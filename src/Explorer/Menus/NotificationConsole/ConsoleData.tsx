/**
 * Interface for the data/content that will be recorded
 */

export interface ConsoleData {
  type: ConsoleDataType;
  date: string;
  message: string;
  id?: string;
}

export enum ConsoleDataType {
  Info = 0,
  Error = 1,
  InProgress = 2,
  Warning = 3,
}
