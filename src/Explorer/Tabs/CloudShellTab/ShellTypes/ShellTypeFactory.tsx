/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Factory for creating shell type handlers
 */

import { Terminal } from "xterm";
import { TerminalKind } from "../../../../Contracts/ViewModels";
import { CassandraShellHandler } from "./CassandraShellHandler";
import { MongoShellHandler } from "./MongoShellHandler";
import { PostgresShellHandler } from "./PostgresShellHandler";
import { VCoreMongoShellHandler } from "./VCoreMongoShellHandler";

export interface ShellTypeConfig {
  getShellName(): string;
  getInitialCommands(): Promise<string>;
  configureNetworkAccess(terminal: Terminal, region: string): Promise<{
    vNetSettings: any;
    isAllPublicAccessEnabled: boolean;
  }>;
}

export class ShellTypeHandler {
  /**
   * Gets the appropriate handler for the given shell type
   */
  public static getHandler(shellType: TerminalKind): ShellTypeConfig {
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

  /**
   * Gets the display name for a shell type
   */
  public static getShellNameForDisplay(terminalKind: TerminalKind): string {
    switch (terminalKind) {
      case TerminalKind.Postgres:
        return "PostgreSQL";
      case TerminalKind.Mongo:
      case TerminalKind.VCoreMongo:
        return "MongoDB";
      case TerminalKind.Cassandra:
        return "Cassandra";
      default:
        return "";
    }
  }
}
