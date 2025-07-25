import { userContext } from "../../../../UserContext";
import { getHostFromUrl } from "../Utils/CommonUtils";
import { AbstractShellHandler } from "./AbstractShellHandler";

const PACKAGE_VERSION: string = "6.2.0";

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
      "if ! command -v cqlsh &> /dev/null; then echo '⚠️ cqlsh not found. Installing...'; fi",
      `if ! command -v cqlsh &> /dev/null; then pip3 install --user cqlsh==${PACKAGE_VERSION} ; fi`,
      "echo 'export SSL_VERSION=TLSv1_2' >> ~/.bashrc",
      "echo 'export SSL_VALIDATE=false' >> ~/.bashrc",
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

    return `cqlsh ${getHostFromUrl(this._endpoint)} 10350 -u ${dbName} -p ${this._key} --ssl`;
  }

  public getTerminalSuppressedData(): string[] {
    return [""];
  }
}
