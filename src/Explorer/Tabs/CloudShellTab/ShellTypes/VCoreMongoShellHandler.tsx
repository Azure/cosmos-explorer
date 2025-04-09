/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * VCore MongoDB shell type handler
 */

import { userContext } from "../../../../UserContext";
import { AbstractShellHandler } from "./AbstractShellHandler";

const PACKAGE_VERSION: string = "2.3.8";

export class VCoreMongoShellHandler extends AbstractShellHandler {

  public getShellName(): string {
    return "MongoDB VCore";
  }

  public getEndpoint(): string {
    return userContext.databaseAccount?.properties?.vcoreMongoEndpoint;
  }

  public getSetUpCommands(): string[] {
    return [
      "if ! command -v mongosh &> /dev/null; then echo '⚠️ mongosh not found. Installing...'; fi",
      `if ! command -v mongosh &> /dev/null; then curl -LO https://downloads.mongodb.com/compass/mongosh-${PACKAGE_VERSION}-linux-x64.tgz; fi`,
      `if ! command -v mongosh &> /dev/null; then tar -xvzf mongosh-${PACKAGE_VERSION}-linux-x64.tgz; fi`,
      `if ! command -v mongosh &> /dev/null; then mkdir -p ~/mongosh && mv mongosh-${PACKAGE_VERSION}-linux-x64/* ~/mongosh/; fi`,
      "if ! command -v mongosh &> /dev/null; then echo 'export PATH=$HOME/mongosh/bin:$PATH' >> ~/.bashrc; fi",
      "source ~/.bashrc"
    ];
  }

  public getConnectionCommands(config: any): string[] {
    return [
      `read -p "Enter username: " username && mongosh "mongodb+srv://$username:@${config.endpoint}/?authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000" --tls --tlsAllowInvalidCertificates`
    ];
  }

  public getTerminalSuppressedData(): string {
    return "Warning: Non-Genuine MongoDB Detected";
  }
}