import { TerminalKind } from "../../../../Contracts/ViewModels";
import { userContext } from "../../../../UserContext";
import { listKeys } from "../../../../Utils/arm/generatedClients/cosmos/databaseAccounts";
import {
  acquireMsalTokenForAccount,
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
 * On the Entra ID path a cached `userContext.aadToken` is preferred, but when none
 * is available (for example an account with local auth disabled while Data Explorer
 * itself is still in key mode) a token is acquired on demand. Without this, the
 * shell would export no credential and silently fall back to interactive browser /
 * device-code auth, which cannot complete inside Azure Cloud Shell.
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
    return (await acquireMsalTokenForAccount(userContext.databaseAccount, true)) || "";
  }

  const keys = await listKeys(userContext.subscriptionId, userContext.resourceGroup, dbName);
  return keys?.primaryMasterKey || "";
}
