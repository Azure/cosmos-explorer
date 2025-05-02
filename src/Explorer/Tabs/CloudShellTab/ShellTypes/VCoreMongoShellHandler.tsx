import { userContext } from "../../../../UserContext";
import { AbstractShellHandler } from "./AbstractShellHandler";

export class VCoreMongoShellHandler extends AbstractShellHandler {
  private _endpoint: string | undefined;

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
    return `mongosh "mongodb+srv://${userName}:@${this._endpoint}/?authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000"`;
  }

  public getTerminalSuppressedData(): string {
    return "Warning: Non-Genuine MongoDB Detected";
  }
}
