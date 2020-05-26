import { DatabaseAccount } from "../../Contracts/DataModels";
import { PlatformType } from "../../PlatformType";

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
  platform: PlatformType;
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
