import { AuthType } from "../AuthType";
import * as DataModels from "../Contracts/DataModels";
import { ApiType } from "../UserContext";

export interface TerminalProps {
  authToken: string;
  notebookServerEndpoint: string;
  terminalEndpoint: string | undefined;
  databaseAccount: DataModels.DatabaseAccount | undefined;
  authType: AuthType | undefined;
  apiType: ApiType;
  subscriptionId: string | undefined;
}
