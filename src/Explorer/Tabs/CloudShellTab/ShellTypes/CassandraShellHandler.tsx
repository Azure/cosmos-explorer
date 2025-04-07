/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Cassandra shell type handler
 */

import { Terminal } from "xterm";
import { TerminalKind } from "../../../../Contracts/ViewModels";
import { userContext } from "../../../../UserContext";
import { listKeys } from "../../../../Utils/arm/generatedClients/cosmos/databaseAccounts";
import { setShellType } from "../Data/CloudShellApiClient";
import { NetworkAccessHandler } from "../Network/NetworkAccessHandler";
import { getHostFromUrl } from "../Utils/CommonUtils";
import { ShellTypeConfig } from "./ShellTypeFactory";

export class CassandraShellHandler implements ShellTypeConfig {
  private shellType: TerminalKind = TerminalKind.Cassandra;

  constructor() {
    setShellType(this.shellType);
  }

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
      // 2. Check if cqlsh is installed; if not, proceed with installation
      "if ! command -v cqlsh &> /dev/null; then echo '⚠️ cqlsh not found. Installing...'; fi",
      // 3. Download Cassandra if not installed
      "if ! command -v cqlsh &> /dev/null; then curl -LO https://archive.apache.org/dist/cassandra/5.0.3/apache-cassandra-5.0.3-bin.tar.gz; fi",
      // 4. Extract Cassandra package if not installed
      "if ! command -v cqlsh &> /dev/null; then tar -xvzf apache-cassandra-5.0.3-bin.tar.gz; fi",
      // 5. Move Cassandra binaries if not installed
      "if ! command -v cqlsh &> /dev/null; then mkdir -p ~/cassandra && mv apache-cassandra-5.0.3/* ~/cassandra/; fi",
      // 6. Add Cassandra to PATH if not installed
      "if ! command -v cqlsh &> /dev/null; then echo 'export PATH=$HOME/cassandra/bin:$PATH' >> ~/.bashrc; fi",
      // 7. Set environment variables for SSL
      "if ! command -v cqlsh &> /dev/null; then echo 'export SSL_VERSION=TLSv1_2' >> ~/.bashrc; fi",
      "if ! command -v cqlsh &> /dev/null; then echo 'export SSL_VALIDATE=false' >> ~/.bashrc; fi",
      // 8. Source .bashrc to update PATH (even if cqlsh was already installed)
      "source ~/.bashrc",
      // 9. Verify cqlsh installation
      "cqlsh --version",
      // 10. Login to Cassandra
      `cqlsh ${config.host} 10350 -u ${config.name} -p ${config.password} --ssl --protocol-version=4`
    ];
  }
}
