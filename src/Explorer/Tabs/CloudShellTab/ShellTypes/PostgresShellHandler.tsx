/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * PostgreSQL shell type handler
 */

import { userContext } from "../../../../UserContext";
import { AbstractShellHandler } from "./AbstractShellHandler";

const PACKAGE_VERSION: string = "15.2";

export class PostgresShellHandler extends AbstractShellHandler {

  public getShellName(): string {
    return "PostgreSQL";
  }

  public getEndpoint(): string {
        return userContext?.databaseAccount?.properties?.postgresqlEndpoint;
  }

  public getSetUpCommands(): string[] {
    return [
      "if ! command -v psql &> /dev/null; then echo '⚠️ psql not found. Installing...'; fi",
      `if ! command -v psql &> /dev/null; then curl -LO https://ftp.postgresql.org/pub/source/v${PACKAGE_VERSION}/postgresql-${PACKAGE_VERSION}.tar.bz2; fi`,
      `if ! command -v psql &> /dev/null; then tar -xvjf postgresql-${PACKAGE_VERSION}.tar.bz2; fi`,
      "if ! command -v psql &> /dev/null; then mkdir -p ~/pgsql; fi",
      "if ! command -v psql &> /dev/null; then curl -LO https://ftp.gnu.org/gnu/readline/readline-8.1.tar.gz; fi",
      "if ! command -v psql &> /dev/null; then tar -xvzf readline-8.1.tar.gz; fi",
      "if ! command -v psql &> /dev/null; then cd readline-8.1 && ./configure --prefix=$HOME/pgsql; fi",
      "if ! command -v psql &> /dev/null; then echo 'export PATH=$HOME/pgsql/bin:$PATH' >> ~/.bashrc; fi",
      "source ~/.bashrc"
    ];
  }

  public getConnectionCommand(): string {
    const endpoint = this.getEndpoint()
    if (!endpoint) {
      return `echo '${this.getShellName()} endpoint not found.'`;
    }
    return `read -p "Enter Database Name: " dbname && read -p "Enter Username: " username && psql -h "${endpoint}" -p 5432 -d "$dbname" -U "$username" --set=sslmode=require`;
  }

  public getTerminalSuppressedData(): string {
    return "";
  }
}