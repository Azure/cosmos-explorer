import { userContext } from "../../../../UserContext";
import { filterAndCleanTerminalOutput, getMongoShellRemoveInfoText } from "../Utils/CommonUtils";
import { AbstractShellHandler, DISABLE_TELEMETRY_COMMAND } from "./AbstractShellHandler";

export class VCoreMongoShellHandler extends AbstractShellHandler {
  private _endpoint: string | undefined;
  private _removeInfoText: string[] = getMongoShellRemoveInfoText();

  constructor() {
    super();
    this._endpoint = userContext?.databaseAccount?.properties?.vcoreMongoEndpoint;
  }

  public getShellName(): string {
    return "MongoDB VCore";
  }

  public getSetUpCommands(): string[] {
    return this.mongoShellSetupCommands();
  }

  public getConnectionCommand(): string {
    if (!this._endpoint) {
      return `echo '${this.getShellName()} endpoint not found.'`;
    }

    const userName = userContext.vcoreMongoConnectionParams.adminLogin;

    const connectionUri = `mongodb+srv://${userName}:@${this._endpoint}/?authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000&appName=${this.APP_NAME}`;

    return `${DISABLE_TELEMETRY_COMMAND} && mongosh "${connectionUri}"`;
  }

  public getTerminalSuppressedData(): string[] {
    return ["Warning: Non-Genuine MongoDB Detected", "Telemetry is now disabled."];
  }

  updateTerminalData(data: string): string {
    return filterAndCleanTerminalOutput(data, this._removeInfoText);
  }
}
