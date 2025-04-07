/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * VCore MongoDB shell type handler
 */

import { Terminal } from "xterm";
import { TerminalKind } from "../../../../Contracts/ViewModels";
import { userContext } from "../../../../UserContext";
import { listKeys } from "../../../../Utils/arm/generatedClients/cosmos/databaseAccounts";
import { setShellType } from "../Data/CloudShellApiClient";
import { NetworkAccessHandler } from "../Network/NetworkAccessHandler";
import { getHostFromUrl } from "../Utils/CommonUtils";
import { ShellTypeConfig } from "./ShellTypeFactory";

export class VCoreMongoShellHandler implements ShellTypeConfig {
  private shellType: TerminalKind = TerminalKind.VCoreMongo;

  constructor() {
    setShellType(this.shellType);
  }

  public getShellName(): string {
    return "MongoDB VCore";
  }

  public async getInitialCommands(): Promise<string> {
    const dbAccount = userContext.databaseAccount;
    const endpoint = dbAccount.properties.vcoreMongoEndpoint;
    
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
    // VCore MongoDB uses private endpoints
    return await NetworkAccessHandler.configureNetworkAccess(terminal, region, this.shellType);
  }

  private getCommands(config: any): string[] {
    return [
      // 1. Fetch and display location details in a readable format
      "curl -s https://ipinfo.io | jq -r '\"Region: \" + .region + \" Country: \" + .country + \" City: \" + .city + \" IP Addr: \" + .ip'",
      // 2. Check if mongosh is installed; if not, proceed with installation
      "if ! command -v mongosh &> /dev/null; then echo '⚠️ mongosh not found. Installing...'; fi",
      // 3. Download mongosh if not installed
      "if ! command -v mongosh &> /dev/null; then curl -LO https://downloads.mongodb.com/compass/mongosh-2.3.8-linux-x64.tgz; fi",
      // 4. Extract mongosh package if not installed
      "if ! command -v mongosh &> /dev/null; then tar -xvzf mongosh-2.3.8-linux-x64.tgz; fi",
      // 5. Move mongosh binaries if not installed
      "if ! command -v mongosh &> /dev/null; then mkdir -p ~/mongosh && mv mongosh-2.3.8-linux-x64/* ~/mongosh/; fi",
      // 6. Add mongosh to PATH if not installed
      "if ! command -v mongosh &> /dev/null; then echo 'export PATH=$HOME/mongosh/bin:$PATH' >> ~/.bashrc; fi",
      // 7. Source .bashrc to update PATH (even if mongosh was already installed)
      "source ~/.bashrc",
      // 8. Verify mongosh installation
      "mongosh --version",
      // 9. Login to MongoDB
      `read -p "Enter username: " username && mongosh "mongodb+srv://$username:@${config.endpoint}/?authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000" --tls --tlsAllowInvalidCertificates`
    ];
  }
}
