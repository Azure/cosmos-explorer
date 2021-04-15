// TODO: Remove this file and move definitions. Its only here due to old worker code that has been removed
export interface UploadDetailsRecord {
  fileName: string;
  numSucceeded: number;
  numFailed: number;
  errors: string[];
}

export interface UploadDetails {
  data: UploadDetailsRecord[];
}
