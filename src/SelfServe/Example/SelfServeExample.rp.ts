import { SessionStorageUtility } from "../../Shared/StorageUtility";
import { userContext } from "../../UserContext";
import { get } from "../../Utils/arm/generatedClients/2020-04-01/databaseAccounts";
import { RefreshResult } from "../SelfServeTypes";
import { AccountProps, Regions } from "./SelfServeExample.types";

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

export const update = async (accountProps: AccountProps): Promise<void> => {
  // This is only an example. DO NOT store actual data in the Session/Local storage for your SelfServe feature.

  SessionStorageUtility.setEntry("regions", accountProps.regions);
  SessionStorageUtility.setEntry("enableLogging", accountProps.enableLogging?.toString());
  SessionStorageUtility.setEntry("accountName", accountProps.accountName);
  SessionStorageUtility.setEntry("collectionThroughput", accountProps.collectionThroughput?.toString());
  SessionStorageUtility.setEntry("dbThroughput", accountProps.dbThroughput?.toString());
};

export const initialize = async (): Promise<AccountProps> => {
  // This is only an example. DO NOT store actual data in the Session/Local storage for your SelfServe feature.

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
  // This is only an example. DO NOT store actual data in the Session/Local storage for your SelfServe feature.

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
