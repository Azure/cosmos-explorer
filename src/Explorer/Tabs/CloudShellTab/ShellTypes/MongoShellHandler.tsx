import { userContext } from "../../../../UserContext";
import { filterAndCleanTerminalOutput, getHostFromUrl, getMongoShellRemoveInfoText } from "../Utils/CommonUtils";
import {
  AbstractShellHandler,
  DISABLE_TELEMETRY_COMMAND,
  EXIT_COMMAND_MONGO
} from "./AbstractShellHandler";

export class MongoShellHandler extends AbstractShellHandler {
  private _key: string;
  private _endpoint: string | undefined;
  private _removeInfoText: string[] = getMongoShellRemoveInfoText();
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
      DISABLE_TELEMETRY_COMMAND +
      " && " +
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

  public getTerminalSuppressedData(): string[] {
    return ["Warning: Non-Genuine MongoDB Detected", "Telemetry is now disabled."];
  }

  protected getExitCommand(): string {
    return EXIT_COMMAND_MONGO;
  }

  updateTerminalData(data: string): string {
    return filterAndCleanTerminalOutput(data, this._removeInfoText);
  }
}
