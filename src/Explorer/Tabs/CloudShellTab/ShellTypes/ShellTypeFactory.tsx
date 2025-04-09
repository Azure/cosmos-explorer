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

export class ShellTypeHandlerFactory {
  /**
   * Gets the appropriate handler for the given shell type
   */
  public static getHandler(shellType: TerminalKind): AbstractShellHandler {
    switch (shellType) {
      case TerminalKind.Postgres:
        return new PostgresShellHandler();
      case TerminalKind.Mongo:
        return new MongoShellHandler();
      case TerminalKind.VCoreMongo:
        return new VCoreMongoShellHandler();
      case TerminalKind.Cassandra:
        return new CassandraShellHandler();
      default:
        throw new Error(`Unsupported shell type: ${shellType}`);
    }
  }
}