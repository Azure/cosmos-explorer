export enum Regions {
  NorthCentralUS = "NorthCentralUS",
  WestUS = "WestUS",
  EastUS2 = "EastUS2",
}

export interface AccountProps {
  regions: Regions;
  enableLogging: boolean;
  accountName: string;
  collectionThroughput: number;
  dbThroughput: number;
}
