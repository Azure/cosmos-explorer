import { TerminalKind } from "../../../../Contracts/ViewModels";
import { userContext } from "../../../../UserContext";
import { getReadOnlyKeys, listKeys } from "../../../../Utils/arm/generatedClients/cosmos/databaseAccounts";
import {
  acquireMsalTokenForAccount,
  getMsalInstance,
  isCloudShellEntraAuthEnabled,
  isDataplaneRbacEnabledForProxyApi,
} from "../../../../Utils/AuthorizationUtils";
import { AbstractShellHandler } from "./AbstractShellHandler";
import { CassandraShellHandler } from "./CassandraShellHandler";
import { CosmosDBShellCredential, CosmosDBShellHandler } from "./CosmosDBShellHandler";
import { MongoShellHandler } from "./MongoShellHandler";
import { PostgresShellHandler } from "./PostgresShellHandler";
import { VCoreMongoShellHandler } from "./VCoreMongoShellHandler";

/**
 * Gets the appropriate handler for the given shell type
 */
export async function getHandler(shellType: TerminalKind): Promise<AbstractShellHandler> {
  switch (shellType) {
    case TerminalKind.Postgres:
      return new PostgresShellHandler();
    case TerminalKind.Mongo:
      return new MongoShellHandler(await getKey(isDataplaneRbacEnabledForProxyApi(userContext)));
    case TerminalKind.VCoreMongo:
      return new VCoreMongoShellHandler();
    case TerminalKind.Cassandra:
      return new CassandraShellHandler(await getKey(isDataplaneRbacEnabledForProxyApi(userContext)));
    case TerminalKind.CosmosDB:
      return new CosmosDBShellHandler(await getCosmosDBShellCredential());
    default:
      throw new Error(`Unsupported shell type: ${shellType}`);
  }
}

/**
 * Resolves the credential Data Explorer already holds for the current account and hands
 * it to the Cosmos DB Shell.
 *
 * The Cloud Shell cannot authenticate to Cosmos DB on its own: its managed identity is
 * rejected with "AudienceNotSupported" for the `*.documents.azure.com` audience, its `az`
 * session is not signed in, and the interactive browser/device-code flows are not usable
 * from the embedded terminal. The credential therefore has to come from Data Explorer.
 *
 * Resolution order:
 * 1. Entra ID data-plane token — the cached `userContext.aadToken`, or a silently minted
 *    one. Silent acquisition is only attempted when an MSAL account is already cached so
 *    it can never trigger an interactive popup.
 * 2. Account master key — the key Data Explorer already resolved (`userContext.masterKey`),
 *    or, if that is not populated, one fetched via ARM (`listKeys`, falling back to
 *    `getReadOnlyKeys` on any failure for read-only callers). The key is handed to the
 *    handler, which delivers it as a full connection string. Skipped when the account has
 *    local auth disabled (keys do not exist).
 *
 * Returns `undefined` when nothing could be resolved, which makes the handler surface
 * actionable guidance instead of letting the tool attempt its own sign-in.
 */
export async function getCosmosDBShellCredential(): Promise<CosmosDBShellCredential | undefined> {
  const dbName = userContext.databaseAccount?.name;
  if (!dbName) {
    return undefined;
  }

  if (isCloudShellEntraAuthEnabled(userContext)) {
    const token = await resolveCosmosDataPlaneToken();
    if (token) {
      return { kind: "token", value: token };
    }
  }

  if (userContext.databaseAccount?.properties?.disableLocalAuth) {
    console.warn(
      "CloudShell: could not resolve an Entra ID token and local auth is disabled on this account, " +
        "so no credential can be passed to the Cosmos DB shell.",
    );
    return undefined;
  }

  const key = await resolveAccountKey(dbName);
  if (!key) {
    console.warn(
      "CloudShell: no Entra ID token or account key could be resolved for the Cosmos DB shell. " +
        "Data Explorer may be authenticating through the portal proxy (per-request tokens), which " +
        "cannot be reused by the shell. Ensure you have either data-plane RBAC access (then use " +
        '"Login for Entra ID") or permission to list the account keys.',
    );
    return undefined;
  }
  return { kind: "key", value: key };
}

/**
 * Returns a Cosmos data-plane token without ever prompting. Silent acquisition is guarded
 * on an existing cached MSAL account because `acquireMsalTokenForAccount` falls back to an
 * interactive popup when none exists, which cannot complete in the hosted Cloud Shell.
 */
async function resolveCosmosDataPlaneToken(): Promise<string> {
  if (userContext.aadToken) {
    return userContext.aadToken;
  }

  try {
    const msalInstance = await getMsalInstance();
    if (msalInstance.getAllAccounts().length === 0) {
      return "";
    }
    return (await acquireMsalTokenForAccount(userContext.databaseAccount, true)) || "";
  } catch (error) {
    console.error("Failed to silently acquire a Cosmos data-plane token for the Cloud Shell", error);
    return "";
  }
}

/**
 * Resolves the subscription id and resource group for the current account. These are
 * normally populated on `userContext`, but in some hosting contexts they can be missing,
 * so they are parsed from the account's ARM resource id as a fallback. The id has the form
 * `/subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.DocumentDB/databaseAccounts/<name>`.
 */
function resolveAccountArmScope(): { subscriptionId: string; resourceGroup: string } {
  let subscriptionId = userContext.subscriptionId;
  let resourceGroup = userContext.resourceGroup;

  const accountId = userContext.databaseAccount?.id;
  if ((!subscriptionId || !resourceGroup) && accountId) {
    const match = accountId.match(/\/subscriptions\/([^/]+)\/resourceGroups\/([^/]+)\//i);
    if (match) {
      subscriptionId = subscriptionId || match[1];
      resourceGroup = resourceGroup || match[2];
    }
  }

  return { subscriptionId, resourceGroup };
}

async function resolveAccountKey(dbName: string): Promise<string> {
  // Prefer the key Data Explorer already resolved for this account so the shell reuses the
  // exact credential DE is connected with and avoids a redundant ARM round-trip.
  if (userContext.masterKey) {
    return userContext.masterKey;
  }

  // Otherwise fetch it via ARM, mirroring DE's own `fetchAndUpdateKeys`: try the read-write
  // keys first, then fall back to the read-only keys. The fallback is attempted on any
  // failure (not just "AuthorizationFailed") because a read-only caller can surface the
  // missing-permission error in different shapes; without it such a user gets no credential
  // and the shell cannot connect.
  const { subscriptionId, resourceGroup } = resolveAccountArmScope();
  if (!subscriptionId || !resourceGroup) {
    console.error(
      "CloudShell: cannot list Cosmos DB account keys because the subscription id or resource group " +
        "could not be determined for this account.",
    );
    return "";
  }

  try {
    const keys = await listKeys(subscriptionId, resourceGroup, dbName);
    if (keys?.primaryMasterKey) {
      return keys.primaryMasterKey;
    }
  } catch (error) {
    console.error("Failed to list read-write account keys for the Cloud Shell; trying read-only keys", error);
  }

  try {
    const readOnlyKeys = await getReadOnlyKeys(subscriptionId, resourceGroup, dbName);
    return readOnlyKeys?.primaryReadonlyMasterKey || "";
  } catch (readOnlyError) {
    console.error("Failed to list read-only account keys for the Cloud Shell", readOnlyError);
    return "";
  }
}

/**
 * Resolves the credential to inject into the Cloud Shell for a Mongo or Cassandra
 * connection.
 *
 * @param useEntraIdAuth When true, returns an Entra ID (AAD) bearer token scoped to
 * the account's data plane; otherwise returns the account master key. The caller
 * decides which credential applies so it stays in sync with the connection command
 * the matching handler builds.
 *
 * The Cosmos DB (NoSQL) shell does not use this function — see
 * {@link getCosmosDBShellCredential}, which also reports which kind of credential it
 * resolved so the correct environment variable is exported.
 */
export async function getKey(useEntraIdAuth: boolean): Promise<string> {
  const dbName = userContext.databaseAccount.name;
  if (!dbName) {
    return "";
  }
  if (useEntraIdAuth) {
    if (userContext.aadToken) {
      return userContext.aadToken;
    }

    try {
      const msalInstance = await getMsalInstance();
      if (msalInstance.getAllAccounts().length === 0) {
        // No cached account to silently acquire against; a token request here would
        // require an interactive popup, which cannot complete in the Cloud Shell.
        console.warn(
          "CloudShell: no cached MSAL account available to mint a Cosmos data-plane token; " +
            "the shell will use interactive device-code authentication.",
        );
        return "";
      }
      const token = (await acquireMsalTokenForAccount(userContext.databaseAccount, true)) || "";
      if (!token) {
        console.warn("CloudShell: silent Cosmos data-plane token acquisition returned an empty token.");
      }
      return token;
    } catch (error) {
      console.error("Failed to silently acquire a Cosmos data-plane token for the Cloud Shell", error);
      return "";
    }
  }

  const keys = await listKeys(userContext.subscriptionId, userContext.resourceGroup, dbName);
  return keys?.primaryMasterKey || "";
}
