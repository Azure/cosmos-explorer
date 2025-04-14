/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * VCore MongoDB shell type handler
 */

import { userContext } from "../../../../UserContext";
import { AbstractShellHandler } from "./AbstractShellHandler";

const PACKAGE_VERSION: string = "2.5.0";

export class VCoreMongoShellHandler extends AbstractShellHandler {
  private _endpoint: string | undefined;

  constructor() {
    super();
    this._endpoint = userContext?.databaseAccount?.properties?.vcoreMongoEndpoint;
  }

  public getShellName(): string {
    return "MongoDB VCore";
  }

  public getSetUpCommands(): string[] {
    return [
      "if ! command -v mongosh &> /dev/null; then echo '⚠️ mongosh not found. Installing...'; fi",
      `if ! command -v mongosh &> /dev/null; then curl -LO https://downloads.mongodb.com/compass/mongosh-${PACKAGE_VERSION}-linux-x64.tgz; fi`,
      `if ! command -v mongosh &> /dev/null; then tar -xvzf mongosh-${PACKAGE_VERSION}-linux-x64.tgz; fi`,
      `if ! command -v mongosh &> /dev/null; then mkdir -p ~/mongosh && mv mongosh-${PACKAGE_VERSION}-linux-x64/* ~/mongosh/; fi`,
      "if ! command -v mongosh &> /dev/null; then echo 'export PATH=$HOME/mongosh/bin:$PATH' >> ~/.bashrc; fi",
      "source ~/.bashrc",
    ];
  }

  public getConnectionCommand(): string {
    if (!this._endpoint) {
      return `echo '${this.getShellName()} endpoint not found.'`;
    }
    return `read -p "Enter username: " username && mongosh "mongodb+srv://$username:@${this._endpoint}/?authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000"`;
  }

  public getTerminalSuppressedData(): string {
    return "Warning: Non-Genuine MongoDB Detected";
  }
}
