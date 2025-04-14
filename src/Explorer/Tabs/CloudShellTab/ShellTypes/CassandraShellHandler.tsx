/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Cassandra shell type handler
 */

import { userContext } from "../../../../UserContext";
import { getHostFromUrl } from "../Utils/CommonUtils";
import { AbstractShellHandler } from "./AbstractShellHandler";

const PACKAGE_VERSION: string = "6.2.0";
const PYTHON_VERSION: string = "3.11.0";

export class CassandraShellHandler extends AbstractShellHandler {
  private _key: string;
  private _endpoint: string | undefined;

  constructor(private key: string) {
    super();
    this._key = key;
    this._endpoint = userContext?.databaseAccount?.properties?.cassandraEndpoint;
  }

  public getShellName(): string {
    return "Cassandra";
  }

  public getSetUpCommands(): string[] {
    return [
      "cqlsh --version",
      "if ! command -v cqlsh &> /dev/null; then echo '⚠️ cqlsh not found. Installing...'; fi",
      `curl -LO https://www.python.org/ftp/python/${PYTHON_VERSION}/Python-${PYTHON_VERSION}.tgz;`,
      `tar -xvzf Python-${PYTHON_VERSION}.tgz;`,
      `cd Python-${PYTHON_VERSION} && ./configure --prefix=$HOME/python;`,
      "echo 'export PATH=$HOME/python/bin:$PATH' >> ~/.bashrc;",
      "source ~/.bashrc",
      `if ! command -v cqlsh &> /dev/null; then pip install --user cqlsh==${PACKAGE_VERSION}; fi`,
      "if ! command -v cqlsh &> /dev/null; then echo 'export SSL_VERSION=TLSv1_2' >> ~/.bashrc; fi",
      "if ! command -v cqlsh &> /dev/null; then echo 'export SSL_VALIDATE=false' >> ~/.bashrc; fi",
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

    return `cqlsh ${getHostFromUrl(this._endpoint)} 10350 -u ${dbName} -p ${this._key} --ssl --protocol-version=4`;
  }

  public getTerminalSuppressedData(): string {
    return "";
  }
}
