/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Cassandra shell type handler
 */

import { userContext } from "../../../../UserContext";
import { getHostFromUrl } from "../Utils/CommonUtils";
import { AbstractShellHandler } from "./AbstractShellHandler";

const PACKAGE_VERSION: string = "5.0.3";

export class CassandraShellHandler extends AbstractShellHandler {
  
  private _key: string;
  constructor(private key: string) {
    super(); 
    this._key = key;
  }

  public getShellName(): string {
    return "Cassandra";
  }

  public getEndpoint(): string {
    return userContext?.databaseAccount?.properties?.cassandraEndpoint;
  }

  public getSetUpCommands(): string[] {
    return [
      "if ! command -v cqlsh &> /dev/null; then echo '⚠️ cqlsh not found. Installing...'; fi",
      `if ! command -v cqlsh &> /dev/null; then curl -LO https://archive.apache.org/dist/cassandra/${PACKAGE_VERSION}/apache-cassandra-${PACKAGE_VERSION}-bin.tar.gz; fi`,
      `if ! command -v cqlsh &> /dev/null; then tar -xvzf apache-cassandra-${PACKAGE_VERSION}-bin.tar.gz; fi`,
      `if ! command -v cqlsh &> /dev/null; then mkdir -p ~/cassandra && mv apache-cassandra-${PACKAGE_VERSION}/* ~/cassandra/; fi`,
      "if ! command -v cqlsh &> /dev/null; then echo 'export PATH=$HOME/cassandra/bin:$PATH' >> ~/.bashrc; fi",
      "if ! command -v cqlsh &> /dev/null; then echo 'export SSL_VERSION=TLSv1_2' >> ~/.bashrc; fi",
      "if ! command -v cqlsh &> /dev/null; then echo 'export SSL_VALIDATE=false' >> ~/.bashrc; fi",
      "source ~/.bashrc"
    ];
  }

  public getConnectionCommand(): string {
    if (!this.getEndpoint()) {
      return `echo '${this.getShellName()} endpoint not found.'`;
    }

    const dbName = userContext?.databaseAccount?.name;
    if (!dbName) {
      return "echo 'Database name not found.'";
    }

    return `cqlsh ${getHostFromUrl(this.getEndpoint())} 10350 -u ${dbName} -p ${this._key} --ssl --protocol-version=4`;
  }

  public getTerminalSuppressedData(): string {
    return "";
  }
}