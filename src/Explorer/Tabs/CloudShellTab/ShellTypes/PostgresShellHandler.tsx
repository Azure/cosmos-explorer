/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * PostgreSQL shell type handler
 */

import { Terminal } from "xterm";
import { TerminalKind } from "../../../../Contracts/ViewModels";
import { userContext } from "../../../../UserContext";
import { listKeys } from "../../../../Utils/arm/generatedClients/cosmos/databaseAccounts";
import { setShellType } from "../Data/CloudShellApiClient";
import { NetworkAccessHandler } from "../Network/NetworkAccessHandler";
import { getHostFromUrl } from "../Utils/CommonUtils";
import { ShellTypeConfig } from "./ShellTypeFactory";

export class PostgresShellHandler implements ShellTypeConfig {
  private shellType: TerminalKind = TerminalKind.Postgres;

  constructor() {
    setShellType(this.shellType);
  }

  public getShellName(): string {
    return "PostgreSQL";
  }

  public async getInitialCommands(): Promise<string> {
    const dbAccount = userContext.databaseAccount;
    const endpoint = dbAccount.properties.postgresqlEndpoint;
    
    // Get database key
    const dbName = dbAccount.name;
    let key = "";
    if (dbName) {
      const keys = await listKeys(userContext.subscriptionId, userContext.resourceGroup, dbName);
      key = keys?.primaryMasterKey || "";
    }

    const config = {
      host: getHostFromUrl(endpoint),
      name: dbAccount.name,
      password: key,
      endpoint: endpoint
    };

    return this.getCommands(config).join("\n").concat("\n");
  }

  public async configureNetworkAccess(terminal: Terminal, region: string): Promise<{
    vNetSettings: any;
    isAllPublicAccessEnabled: boolean;
  }> {
    return await NetworkAccessHandler.configureNetworkAccess(terminal, region, this.shellType);
  }

  private getCommands(config: any): string[] {
    return [
      // 1. Fetch and display location details in a readable format
      "curl -s https://ipinfo.io | jq -r '\"Region: \" + .region + \" Country: \" + .country + \" City: \" + .city + \" IP Addr: \" + .ip'",
      // 2. Check if psql is installed; if not, proceed with installation
      "if ! command -v psql &> /dev/null; then echo '⚠️ psql not found. Installing...'; fi",
      // 3. Download PostgreSQL if not installed
      "if ! command -v psql &> /dev/null; then curl -LO https://ftp.postgresql.org/pub/source/v15.2/postgresql-15.2.tar.bz2; fi",
      // 4. Extract PostgreSQL package if not installed
      "if ! command -v psql &> /dev/null; then tar -xvjf postgresql-15.2.tar.bz2; fi",
      // 5. Create a directory for PostgreSQL installation if not installed
      "if ! command -v psql &> /dev/null; then mkdir -p ~/pgsql; fi",
      // 6. Download readline (dependency for PostgreSQL) if not installed
      "if ! command -v psql &> /dev/null; then curl -LO https://ftp.gnu.org/gnu/readline/readline-8.1.tar.gz; fi",
      // 7. Extract readline package if not installed
      "if ! command -v psql &> /dev/null; then tar -xvzf readline-8.1.tar.gz; fi",
      // 8. Configure readline if not installed
      "if ! command -v psql &> /dev/null; then cd readline-8.1 && ./configure --prefix=$HOME/pgsql; fi",
      // 9. Add PostgreSQL to PATH if not installed
      "if ! command -v psql &> /dev/null; then echo 'export PATH=$HOME/pgsql/bin:$PATH' >> ~/.bashrc; fi",
      // 10. Source .bashrc to update PATH (even if psql was already installed)
      "source ~/.bashrc",
      // 11. Verify PostgreSQL installation
      "psql --version",
      `psql 'read -p "Enter Database Name: " dbname && read -p "Enter Username: " username && host=${config.endpoint} port=5432 dbname=$dbname user=$username sslmode=require'`
    ];
  }
}
