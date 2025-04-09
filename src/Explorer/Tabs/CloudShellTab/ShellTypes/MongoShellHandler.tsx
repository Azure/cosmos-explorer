/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Mongo shell type handler
 */

import { userContext } from "../../../../UserContext";
import { AbstractShellHandler } from "./AbstractShellHandler";

const PACKAGE_VERSION: string = "2.3.8";

export class MongoShellHandler extends AbstractShellHandler {

  public getShellName(): string {
    return "MongoDB";
  }

  public getEndpoint(): string {
    return userContext.databaseAccount?.properties?.mongoEndpoint;
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
      `mongosh --host ${config.host} --port 10255 --username ${config.name} --password ${config.password} --tls --tlsAllowInvalidCertificates`
    ];
  }

  public getTerminalSuppressedData(): string {
    return "Warning: Non-Genuine MongoDB Detected";
  }
}