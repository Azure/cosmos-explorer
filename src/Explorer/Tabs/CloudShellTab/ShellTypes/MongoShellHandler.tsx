import { userContext } from "../../../../UserContext";
import { isDataplaneRbacEnabledForProxyApi } from "../../../../Utils/AuthorizationUtils";
import { filterAndCleanTerminalOutput, getHostFromUrl, getMongoShellRemoveInfoText } from "../Utils/CommonUtils";
import { AbstractShellHandler, DISABLE_TELEMETRY_COMMAND, EXIT_COMMAND_MONGO } from "./AbstractShellHandler";

export class MongoShellHandler extends AbstractShellHandler {
  private _key: string;
  private _endpoint: string | undefined;
  private _removeInfoText: string[] = getMongoShellRemoveInfoText();
  private _isEntraIdEnabled: boolean = isDataplaneRbacEnabledForProxyApi(userContext);
  constructor(private key: string) {
    super();
    this._key = key;
    this._endpoint = userContext?.databaseAccount?.properties?.mongoEndpoint;
  }

  private _getKeyConnectionCommand(dbName: string): string {
    return `mongosh mongodb://${getHostFromUrl(this._endpoint)}:10255?appName=${
      this.APP_NAME
    } --username ${dbName} --password ${this._key} --tls --tlsAllowInvalidCertificates`;
  }

  private _getAadConnectionCommand(dbName: string): string {
    return `mongosh 'mongodb://${dbName}:${this._key}@${dbName}.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&authMechanism=PLAIN&retryWrites=false' --tls --tlsAllowInvalidCertificates`;
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
    const connectionCommand = this._isEntraIdEnabled
      ? this._getAadConnectionCommand(dbName)
      : this._getKeyConnectionCommand(dbName);
    const fullCommand = `${DISABLE_TELEMETRY_COMMAND}; ${connectionCommand}`;
    return fullCommand;
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
