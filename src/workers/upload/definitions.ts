import { DatabaseAccount } from "../../Contracts/DataModels";
import { Platform } from "../../ConfigContext";

export interface StartUploadMessageParams {
  files: FileList;
  documentClientParams: DocumentClientParams;
}

export interface DocumentClientParams {
  databaseId: string;
  containerId: string;
  masterKey: string;
  endpoint: string;
  accessToken: string;
  platform: Platform;
  databaseAccount: DatabaseAccount;
}

export interface UploadDetailsRecord {
  fileName: string;
  numSucceeded: number;
  numFailed: number;
  errors: string[];
}

export interface UploadDetails {
  data: UploadDetailsRecord[];
}
