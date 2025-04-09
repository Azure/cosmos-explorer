import { userContext } from "../../../../UserContext";
import { listKeys } from "../../../../Utils/arm/generatedClients/cosmos/databaseAccounts";
import { getHostFromUrl } from "../Utils/CommonUtils";

export const START_MARKER = `echo "START INITIALIZATION" > /dev/null`;
export const END_MARKER = `echo "END INITIALIZATION" > /dev/null`;

export abstract class AbstractShellHandler {
  
  abstract getShellName(): string;
  abstract getSetUpCommands(): string[];
  abstract getConnectionCommands(config: any): string[];
  abstract getEndpoint(): string;
  abstract getTerminalSuppressedData(): string;

  public async getInitialCommands(): Promise<string> {
    const dbAccount = userContext.databaseAccount;
    const dbName = dbAccount.name;

    let key = "";
    if (dbName) {
      const keys = await listKeys(userContext.subscriptionId, userContext.resourceGroup, dbName);
      key = keys?.primaryMasterKey || "";
    }

    const setupCommands = this.getSetUpCommands();

    const config = {
      host: getHostFromUrl(this.getEndpoint()),
      name: dbName,
      password: key,
      endpoint: this.getEndpoint(),
    };
    const connectionCommands = this.getConnectionCommands(config);

    const allCommands = [
      START_MARKER,
      ...setupCommands,
      END_MARKER,
      ...connectionCommands
    ];
  
    return allCommands.join("\n").concat("\n");
  }
}