/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Mongo shell type handler
 */

import { userContext } from "../../../../UserContext";
import { getHostFromUrl } from "../Utils/CommonUtils";
import { AbstractShellHandler } from "./AbstractShellHandler";

const PACKAGE_VERSION: string = "2.5.0";

export class MongoShellHandler extends AbstractShellHandler {
  private _key: string;
  private _endpoint: string | undefined;
  constructor(private key: string) {
    super();
    this._key = key;
    this._endpoint = userContext?.databaseAccount?.properties?.mongoEndpoint;
  }

  public getShellName(): string {
    return "MongoDB";
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

    const dbName = userContext?.databaseAccount?.name;
    if (!dbName) {
      return "echo 'Database name not found.'";
    }
    return `mongosh --host ${getHostFromUrl(this._endpoint)} --port 10255 --username ${dbName} --password ${
      this._key
    } --tls --tlsAllowInvalidCertificates`;
  }

  public getTerminalSuppressedData(): string {
    return "Warning: Non-Genuine MongoDB Detected";
  }
}
