import { userContext } from "../../../../UserContext";
import { getHostFromUrl } from "../Utils/CommonUtils";
import { AbstractShellHandler } from "./AbstractShellHandler";

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
    return this.mongoShellSetupCommands();
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
    } --tls --tlsAllowInvalidCertificates --appName ${this.APP_NAME}`;
  }

  public getTerminalSuppressedData(): string {
    return "Warning: Non-Genuine MongoDB Detected";
  }
}
