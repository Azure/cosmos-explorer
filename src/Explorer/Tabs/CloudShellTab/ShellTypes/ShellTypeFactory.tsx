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
import { CosmosDBShellHandler } from "./CosmosDBShellHandler";
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
      return new CosmosDBShellHandler(await getKey(isCloudShellEntraAuthEnabled(userContext)));
    default:
      throw new Error(`Unsupported shell type: ${shellType}`);
  }
}

/**
 * Resolves the credential to inject into the Cloud Shell for a connection.
 *
 * @param useEntraIdAuth When true, returns an Entra ID (AAD) bearer token scoped to
 * the account's data plane; otherwise returns the account master key. The caller
 * decides which credential applies so it stays in sync with the connection command
 * the matching handler builds.
 *
 * On the Entra ID path the cached `userContext.aadToken` is used when available. When
 * none is cached (for example an account with local auth disabled while Data Explorer
 * itself is still in key mode) we try to silently mint a Cosmos data-plane token so it
 * can be exported to the Cloud Shell. This is required because neither credential the
 * ephemeral Cloud Shell has access to can obtain one: its managed identity fails with
 * "AudienceNotSupported" for the `*.documents.azure.com` audience, and its `az` session
 * is not logged in ("Please run 'az login'"). The silent acquisition is only attempted
 * when an MSAL account is already cached, so it can never fall back to an interactive
 * popup (popups cannot complete inside the hosted Cloud Shell context). On any failure
 * an empty string is returned so no credential is exported and the shell tool falls
 * through to its Azure CLI credential.
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
        return "";
      }
      return (await acquireMsalTokenForAccount(userContext.databaseAccount, true)) || "";
    } catch (error) {
      console.error("Failed to silently acquire a Cosmos data-plane token for the Cloud Shell", error);
      return "";
    }
  }

  const keys = await listKeys(userContext.subscriptionId, userContext.resourceGroup, dbName);
  return keys?.primaryMasterKey || "";
}
