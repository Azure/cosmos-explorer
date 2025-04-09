/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Mongo shell type handler
 */

import { userContext } from "../../../../UserContext";
import { listKeys } from "../../../../Utils/arm/generatedClients/cosmos/databaseAccounts";
import { getHostFromUrl } from "../Utils/CommonUtils";
import { ShellTypeConfig } from "./ShellTypeFactory";

export class MongoShellHandler implements ShellTypeConfig {

  public getShellName(): string {
    return "MongoDB";
  }

  public async getInitialCommands(): Promise<string> {
    const dbAccount = userContext.databaseAccount;
    const endpoint = dbAccount.properties.mongoEndpoint;
    
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
      "echo 'START INITIALIZATION'",
      "if ! command -v mongosh &> /dev/null; then echo '⚠️ mongosh not found. Installing...'; fi",
      "if ! command -v mongosh &> /dev/null; then curl -LO https://downloads.mongodb.com/compass/mongosh-2.3.8-linux-x64.tgz; fi",
      "if ! command -v mongosh &> /dev/null; then tar -xvzf mongosh-2.3.8-linux-x64.tgz; fi",
      "if ! command -v mongosh &> /dev/null; then mkdir -p ~/mongosh && mv mongosh-2.3.8-linux-x64/* ~/mongosh/; fi",
      "if ! command -v mongosh &> /dev/null; then echo 'export PATH=$HOME/mongosh/bin:$PATH' >> ~/.bashrc; fi",
      "source ~/.bashrc",
      "echo 'END INITIALIZATION'",
      `mongosh --host ${config.host} --port 10255 --username ${config.name} --password ${config.password} --tls --tlsAllowInvalidCertificates`
    ];
  }
}