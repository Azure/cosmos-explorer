import { userContext } from "../../../../UserContext";
import { AbstractShellHandler, DISABLE_TELEMETRY_COMMAND } from "./AbstractShellHandler";

export class VCoreMongoShellHandler extends AbstractShellHandler {
  private _endpoint: string | undefined;
  private _textFilterRules: string[] = [
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

    return `${DISABLE_TELEMETRY_COMMAND} && mongosh "${connectionUri}"`;
  }

  public getTerminalSuppressedData(): string[] {
    return ["Warning: Non-Genuine MongoDB Detected", "Telemetry is now disabled."];
  }

  updateTerminalData(content: string): string {
    const updatedContent = content
      .split("\n")
      .filter((line) => !this._textFilterRules.some((part) => line.includes(part)))
      .filter((line, idx, arr) => (arr.length > 3 && idx <= arr.length - 3 ? !["", "\r"].includes(line) : true)) // Filter out empty lines and carriage returns, but keep the last 3 lines if they exist
      .join("\n");
    return updatedContent;
  }
}
