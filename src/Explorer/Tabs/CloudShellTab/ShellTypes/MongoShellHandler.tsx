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
    return (
      "mongosh mongodb://" +
      getHostFromUrl(this._endpoint) +
      ":10255?appName=" +
      this.APP_NAME +
      " --username " +
      dbName +
      " --password " +
      this._key +
      " --tls --tlsAllowInvalidCertificates"
    );
  }

  public getTerminalSuppressedData(): string {
    return "Warning: Non-Genuine MongoDB Detected";
  }
}
