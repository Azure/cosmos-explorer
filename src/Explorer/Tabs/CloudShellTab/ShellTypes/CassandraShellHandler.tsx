/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Cassandra shell type handler
 */

import { userContext } from "../../../../UserContext";
import { listKeys } from "../../../../Utils/arm/generatedClients/cosmos/databaseAccounts";
import { getHostFromUrl } from "../Utils/CommonUtils";
import { ShellTypeConfig } from "./ShellTypeFactory";

export class CassandraShellHandler implements ShellTypeConfig {

  public getShellName(): string {
    return "Cassandra";
  }

  public async getInitialCommands(): Promise<string> {
    const dbAccount = userContext.databaseAccount;
    const endpoint = dbAccount.properties.cassandraEndpoint;
    
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
      "if ! command -v cqlsh &> /dev/null; then echo '⚠️ cqlsh not found. Installing...'; fi",
      "if ! command -v cqlsh &> /dev/null; then curl -LO https://archive.apache.org/dist/cassandra/5.0.3/apache-cassandra-5.0.3-bin.tar.gz; fi",
      "if ! command -v cqlsh &> /dev/null; then tar -xvzf apache-cassandra-5.0.3-bin.tar.gz; fi",
      "if ! command -v cqlsh &> /dev/null; then mkdir -p ~/cassandra && mv apache-cassandra-5.0.3/* ~/cassandra/; fi",
      "if ! command -v cqlsh &> /dev/null; then echo 'export PATH=$HOME/cassandra/bin:$PATH' >> ~/.bashrc; fi",
      "if ! command -v cqlsh &> /dev/null; then echo 'export SSL_VERSION=TLSv1_2' >> ~/.bashrc; fi",
      "if ! command -v cqlsh &> /dev/null; then echo 'export SSL_VALIDATE=false' >> ~/.bashrc; fi",
      "source ~/.bashrc",
      `cqlsh ${config.host} 10350 -u ${config.name} -p ${config.password} --ssl --protocol-version=4`
    ];
  }
}