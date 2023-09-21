import { AuthType } from "../AuthType";
import * as DataModels from "../Contracts/DataModels";
import { ApiType } from "../UserContext";

export interface TerminalProps {
  authToken: string;
  notebookServerEndpoint: string;
  terminalEndpoint: string;
  databaseAccount: DataModels.DatabaseAccount;
  authType: AuthType;
  apiType: ApiType;
  subscriptionId: string;
  tabId: string;
  username?: string;
}
