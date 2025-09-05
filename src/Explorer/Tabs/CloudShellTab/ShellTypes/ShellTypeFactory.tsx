import { TerminalKind } from "../../../../Contracts/ViewModels";
import { userContext } from "../../../../UserContext";
import { listKeys } from "../../../../Utils/arm/generatedClients/cosmos/databaseAccounts";
import { isDataplaneRbacEnabledForProxyApi } from "../../../../Utils/AuthorizationUtils";
import { AbstractShellHandler } from "./AbstractShellHandler";
import { CassandraShellHandler } from "./CassandraShellHandler";
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
      return new MongoShellHandler(await getKey());
    case TerminalKind.VCoreMongo:
      return new VCoreMongoShellHandler();
    case TerminalKind.Cassandra:
      return new CassandraShellHandler(await getKey());
    default:
      throw new Error(`Unsupported shell type: ${shellType}`);
  }
}

export async function getKey(): Promise<string> {
  const dbName = userContext.databaseAccount.name;
  if (!dbName) {
    return "";
  }
  if (isDataplaneRbacEnabledForProxyApi(userContext)) {
    return userContext.aadToken || "";
  }

  const keys = await listKeys(userContext.subscriptionId, userContext.resourceGroup, dbName);
  return keys?.primaryMasterKey || "";
}
