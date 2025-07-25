import { userContext } from "../../../../UserContext";
import { AbstractShellHandler } from "./AbstractShellHandler";

export class VCoreMongoShellHandler extends AbstractShellHandler {
  private _endpoint: string | undefined;
  private _removeInfoText: string[] = [
    "For mongosh info see: https://www.mongodb.com/docs/mongodb-shell/",
    "disableTelemetry() command",
    "https://www.mongodb.com/legal/privacy-policy",
  ];

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

    return `mongosh --nodb --quiet --eval "disableTelemetry()" && mongosh "${connectionUri}"`;
  }

  public getTerminalSuppressedData(): string[] {
    return ["Warning: Non-Genuine MongoDB Detected", "Telemetry is now disabled."];
  }

  updateTerminalData(data: string): string {
    const updatedData = data
      .split("\n")
      .map((line) => {
        const shouldRemove = this._removeInfoText.some((text) => line.includes(text));
        return shouldRemove ? "" : line;
      })
      .join("\n");
    return updatedData;
  }
}
