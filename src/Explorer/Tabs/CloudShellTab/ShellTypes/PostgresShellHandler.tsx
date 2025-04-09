/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * PostgreSQL shell type handler
 */

import { userContext } from "../../../../UserContext";
import { listKeys } from "../../../../Utils/arm/generatedClients/cosmos/databaseAccounts";
import { getHostFromUrl } from "../Utils/CommonUtils";
import { ShellTypeConfig } from "./ShellTypeFactory";

export class PostgresShellHandler implements ShellTypeConfig {

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

  private getCommands(config: any): string[] {
    return [
      "if ! command -v psql &> /dev/null; then echo '⚠️ psql not found. Installing...'; fi",
      "if ! command -v psql &> /dev/null; then curl -LO https://ftp.postgresql.org/pub/source/v15.2/postgresql-15.2.tar.bz2; fi",
      "if ! command -v psql &> /dev/null; then tar -xvjf postgresql-15.2.tar.bz2; fi",
      "if ! command -v psql &> /dev/null; then mkdir -p ~/pgsql; fi",
      "if ! command -v psql &> /dev/null; then curl -LO https://ftp.gnu.org/gnu/readline/readline-8.1.tar.gz; fi",
      "if ! command -v psql &> /dev/null; then tar -xvzf readline-8.1.tar.gz; fi",
      "if ! command -v psql &> /dev/null; then cd readline-8.1 && ./configure --prefix=$HOME/pgsql; fi",
      "if ! command -v psql &> /dev/null; then echo 'export PATH=$HOME/pgsql/bin:$PATH' >> ~/.bashrc; fi",
      "source ~/.bashrc",
      `psql 'read -p "Enter Database Name: " dbname && read -p "Enter Username: " username && host=${config.endpoint} port=5432 dbname=$dbname user=$username sslmode=require'`
    ];
  }
}