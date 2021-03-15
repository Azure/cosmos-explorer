import { SessionStorageUtility } from "../../Shared/StorageUtility";
import { userContext } from "../../UserContext";
import { get } from "../../Utils/arm/generatedClients/2020-04-01/databaseAccounts";
import { RefreshResult } from "../SelfServeTypes";
export enum Regions {
  NorthCentralUS = "NorthCentralUS",
  WestUS = "WestUS",
  EastUS2 = "EastUS2",
}

export interface InitializeResponse {
  regions: Regions;
  enableLogging: boolean;
  accountName: string;
  collectionThroughput: number;
  dbThroughput: number;
}

export const getMaxCollectionThroughput = async (): Promise<number> => {
  return 10000;
};

export const getMinCollectionThroughput = async (): Promise<number> => {
  return 400;
};

export const getMaxDatabaseThroughput = async (): Promise<number> => {
  return 10000;
};

export const getMinDatabaseThroughput = async (): Promise<number> => {
  return 400;
};

export const update = async (
  regions: Regions,
  enableLogging: boolean,
  accountName: string,
  collectionThroughput: number,
  dbThoughput: number
): Promise<void> => {
  SessionStorageUtility.setEntry("regions", regions);
  SessionStorageUtility.setEntry("enableLogging", enableLogging?.toString());
  SessionStorageUtility.setEntry("accountName", accountName);
  SessionStorageUtility.setEntry("collectionThroughput", collectionThroughput?.toString());
  SessionStorageUtility.setEntry("dbThroughput", dbThoughput?.toString());
};

export const initialize = async (): Promise<InitializeResponse> => {
  const regions = Regions[SessionStorageUtility.getEntry("regions") as keyof typeof Regions];
  const enableLogging = SessionStorageUtility.getEntry("enableLogging") === "true";
  const accountName = SessionStorageUtility.getEntry("accountName");
  let collectionThroughput = parseInt(SessionStorageUtility.getEntry("collectionThroughput"));
  collectionThroughput = isNaN(collectionThroughput) ? undefined : collectionThroughput;
  let dbThroughput = parseInt(SessionStorageUtility.getEntry("dbThroughput"));
  dbThroughput = isNaN(dbThroughput) ? undefined : dbThroughput;
  return {
    regions: regions,
    enableLogging: enableLogging,
    accountName: accountName,
    collectionThroughput: collectionThroughput,
    dbThroughput: dbThroughput,
  };
};

export const onRefreshSelfServeExample = async (): Promise<RefreshResult> => {
  const refreshCountString = SessionStorageUtility.getEntry("refreshCount");
  const refreshCount = refreshCountString ? parseInt(refreshCountString) : 0;

  const subscriptionId = userContext.subscriptionId;
  const resourceGroup = userContext.resourceGroup;
  const databaseAccountName = userContext.databaseAccount.name;
  const databaseAccountGetResults = await get(subscriptionId, resourceGroup, databaseAccountName);
  const isUpdateInProgress = databaseAccountGetResults.properties.provisioningState !== "Succeeded";

  const progressToBeSent = refreshCount % 5 === 0 ? isUpdateInProgress : true;
  SessionStorageUtility.setEntry("refreshCount", (refreshCount + 1).toString());

  return {
    isUpdateInProgress: progressToBeSent,
    updateInProgressMessageTKey: "UpdateInProgressMessage",
  };
};
