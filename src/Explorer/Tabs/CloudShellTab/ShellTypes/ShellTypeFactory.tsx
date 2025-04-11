/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Factory for creating shell type handlers
 */

import { TerminalKind } from "../../../../Contracts/ViewModels";
import { CassandraShellHandler } from "./CassandraShellHandler";
import { MongoShellHandler } from "./MongoShellHandler";
import { PostgresShellHandler } from "./PostgresShellHandler";
import { VCoreMongoShellHandler } from "./VCoreMongoShellHandler";
import { AbstractShellHandler } from "./AbstractShellHandler";
import { userContext } from "../../../../UserContext";
import { listKeys } from "../../../../Utils/arm/generatedClients/cosmos/databaseAccounts";

export class ShellTypeHandlerFactory {
  /**
   * Gets the appropriate handler for the given shell type
   */
  public static async getHandler(shellType: TerminalKind): Promise<AbstractShellHandler> {
    switch (shellType) {
      case TerminalKind.Postgres:
        return new PostgresShellHandler();
      case TerminalKind.Mongo:
        return new MongoShellHandler(await ShellTypeHandlerFactory.getKey());
      case TerminalKind.VCoreMongo:
        return new VCoreMongoShellHandler();
      case TerminalKind.Cassandra:
        return new CassandraShellHandler(await ShellTypeHandlerFactory.getKey());
      default:
        throw new Error(`Unsupported shell type: ${shellType}`);
    }
  }

  public static async getKey(): Promise<string> {
    const dbName = userContext.databaseAccount.name;
    let key = "";
    if (dbName) {
      const keys = await listKeys(userContext.subscriptionId, userContext.resourceGroup, dbName);
      key = keys?.primaryMasterKey || "";
    }

    return key;
  }
  
}