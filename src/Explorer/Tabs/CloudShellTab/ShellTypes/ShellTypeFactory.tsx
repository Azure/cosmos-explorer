import { TerminalKind } from "../../../../Contracts/ViewModels";
import { userContext } from "../../../../UserContext";
import { listKeys } from "../../../../Utils/arm/generatedClients/cosmos/databaseAccounts";
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
 * 2. Account master key via ARM `listKeys` — used when no token applies or none could be
 *    resolved, and skipped when the account has local auth disabled (keys do not exist).
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

  const key = await tryGetPrimaryMasterKey(dbName);
  return key ? { kind: "key", value: key } : undefined;
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

async function tryGetPrimaryMasterKey(dbName: string): Promise<string> {
  try {
    const keys = await listKeys(userContext.subscriptionId, userContext.resourceGroup, dbName);
    return keys?.primaryMasterKey || "";
  } catch (error) {
    console.error("Failed to list account keys for the Cloud Shell", error);
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
