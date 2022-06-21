import { configContext } from "../../ConfigContext";
import { userContext } from "../../UserContext";
import { armRequestWithoutPolling } from "../../Utils/arm/request";
import { selfServeTraceFailure, selfServeTraceStart, selfServeTraceSuccess } from "../SelfServeTelemetryProcessor";
import { RefreshResult } from "../SelfServeTypes";
import SqlX from "./SqlX";
import {
  FetchPricesResponse,
  PriceMapAndCurrencyCode,
  RegionItem,
  RegionsResponse,
  SqlxServiceResource,
  UpdateDedicatedGatewayRequestParameters,
} from "./SqlxTypes";

const apiVersion = "2021-04-01-preview";

export enum ResourceStatus {
  Running = "Running",
  Creating = "Creating",
  Updating = "Updating",
  Deleting = "Deleting",
}

export interface DedicatedGatewayResponse {
  sku: string;
  instances: number;
  status: string;
  endpoint: string;
}

export const getPath = (subscriptionId: string, resourceGroup: string, name: string): string => {
  return `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.DocumentDB/databaseAccounts/${name}/services/SqlDedicatedGateway`;
};

export const updateDedicatedGatewayResource = async (sku: string, instances: number): Promise<string> => {
  const path = getPath(userContext.subscriptionId, userContext.resourceGroup, userContext.databaseAccount.name);
  const body: UpdateDedicatedGatewayRequestParameters = {
    properties: {
      instanceSize: sku,
      instanceCount: instances,
      serviceType: "SqlDedicatedGateway",
    },
  };
  const telemetryData = { ...body, httpMethod: "PUT", selfServeClassName: SqlX.name };
  const updateTimeStamp = selfServeTraceStart(telemetryData);
  let armRequestResult;
  try {
    armRequestResult = await armRequestWithoutPolling({
      host: configContext.ARM_ENDPOINT,
      path,
      method: "PUT",
      apiVersion,
      body,
    });
    selfServeTraceSuccess(telemetryData, updateTimeStamp);
  } catch (e) {
    const failureTelemetry = { ...body, e, selfServeClassName: SqlX.name };
    selfServeTraceFailure(failureTelemetry, updateTimeStamp);
    throw e;
  }
  return armRequestResult?.operationStatusUrl;
};

export const deleteDedicatedGatewayResource = async (): Promise<string> => {
  const path = getPath(userContext.subscriptionId, userContext.resourceGroup, userContext.databaseAccount.name);
  const telemetryData = { httpMethod: "DELETE", selfServeClassName: SqlX.name };
  const deleteTimeStamp = selfServeTraceStart(telemetryData);
  let armRequestResult;
  try {
    armRequestResult = await armRequestWithoutPolling({
      host: configContext.ARM_ENDPOINT,
      path,
      method: "DELETE",
      apiVersion,
    });
    selfServeTraceSuccess(telemetryData, deleteTimeStamp);
  } catch (e) {
    const failureTelemetry = { e, selfServeClassName: SqlX.name };
    selfServeTraceFailure(failureTelemetry, deleteTimeStamp);
    throw e;
  }
  return armRequestResult?.operationStatusUrl;
};

export const getDedicatedGatewayResource = async (): Promise<SqlxServiceResource> => {
  const path = getPath(userContext.subscriptionId, userContext.resourceGroup, userContext.databaseAccount.name);
  const telemetryData = { httpMethod: "GET", selfServeClassName: SqlX.name };
  const getResourceTimeStamp = selfServeTraceStart(telemetryData);
  let armRequestResult;
  try {
    armRequestResult = await armRequestWithoutPolling<SqlxServiceResource>({
      host: configContext.ARM_ENDPOINT,
      path,
      method: "GET",
      apiVersion,
    });
    selfServeTraceSuccess(telemetryData, getResourceTimeStamp);
  } catch (e) {
    const failureTelemetry = { e, selfServeClassName: SqlX.name };
    selfServeTraceFailure(failureTelemetry, getResourceTimeStamp);
    throw e;
  }
  return armRequestResult?.result;
};

export const getCurrentProvisioningState = async (): Promise<DedicatedGatewayResponse> => {
  try {
    const response = await getDedicatedGatewayResource();
    return {
      sku: response.properties.instanceSize,
      instances: response.properties.instanceCount,
      status: response.properties.status,
      endpoint: response.properties.sqlxEndPoint,
    };
  } catch (e) {
    return { sku: undefined, instances: undefined, status: undefined, endpoint: undefined };
  }
};

export const refreshDedicatedGatewayProvisioning = async (): Promise<RefreshResult> => {
  try {
    const response = await getDedicatedGatewayResource();
    if (response.properties.status === ResourceStatus.Running.toString()) {
      return { isUpdateInProgress: false, updateInProgressMessageTKey: undefined };
    } else if (response.properties.status === ResourceStatus.Creating.toString()) {
      return { isUpdateInProgress: true, updateInProgressMessageTKey: "CreateMessage" };
    } else if (response.properties.status === ResourceStatus.Deleting.toString()) {
      return { isUpdateInProgress: true, updateInProgressMessageTKey: "DeleteMessage" };
    } else {
      return { isUpdateInProgress: true, updateInProgressMessageTKey: "UpdateMessage" };
    }
  } catch {
    //TODO differentiate between different failures
    return { isUpdateInProgress: false, updateInProgressMessageTKey: undefined };
  }
};

const getGeneralPath = (subscriptionId: string, resourceGroup: string, name: string): string => {
  return `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.DocumentDB/databaseAccounts/${name}`;
};

export const getRegions = async (): Promise<Array<RegionItem>> => {
  const telemetryData = {
    feature: "Calculate approximate cost",
    function: "getRegions",
    description: "",
    selfServeClassName: SqlX.name,
  };
  const getRegionsTimestamp = selfServeTraceStart(telemetryData);

  try {
    const response = await armRequestWithoutPolling<RegionsResponse>({
      host: configContext.ARM_ENDPOINT,
      path: getGeneralPath(userContext.subscriptionId, userContext.resourceGroup, userContext.databaseAccount.name),
      method: "GET",
      apiVersion: "2021-04-01-preview",
    });

    selfServeTraceSuccess(telemetryData, getRegionsTimestamp);
    return response.result.properties.locations;
  } catch (err) {
    const failureTelemetry = { err, selfServeClassName: SqlX.name };
    selfServeTraceFailure(failureTelemetry, getRegionsTimestamp);
    return new Array<RegionItem>();
  }
};

const getFetchPricesPathForRegion = (subscriptionId: string): string => {
  return `/subscriptions/${subscriptionId}/providers/Microsoft.CostManagement/fetchPrices`;
};

export const getPriceMapAndCurrencyCode = async (regions: Array<RegionItem>): Promise<PriceMapAndCurrencyCode> => {
  const telemetryData = {
    feature: "Calculate approximate cost",
    function: "getPriceMapAndCurrencyCode",
    description: "fetch prices API call",
    selfServeClassName: SqlX.name,
  };
  const getPriceMapAndCurrencyCodeTimestamp = selfServeTraceStart(telemetryData);

  try {
    const priceMap = new Map<string, Map<string, number>>();
    let currencyCode;
    for (const regionItem of regions) {
      const regionPriceMap = new Map<string, number>();

      const response = await armRequestWithoutPolling<FetchPricesResponse>({
        host: configContext.ARM_ENDPOINT,
        path: getFetchPricesPathForRegion(userContext.subscriptionId),
        method: "POST",
        apiVersion: "2020-01-01-preview",
        queryParams: {
          filter:
            "armRegionName eq '" +
            regionItem.locationName.split(" ").join("").toLowerCase() +
            "' and serviceFamily eq 'Databases' and productName eq 'Azure Cosmos DB Dedicated Gateway - General Purpose'",
        },
      });

      for (const item of response.result.Items) {
        if (currencyCode === undefined) {
          currencyCode = item.currencyCode;
        } else if (item.currencyCode !== currencyCode) {
          throw Error("Currency Code Mismatch: Currency code not same for all regions / skus.");
        }
        regionPriceMap.set(item.skuName, item.retailPrice);
      }
      priceMap.set(regionItem.locationName, regionPriceMap);
    }

    selfServeTraceSuccess(telemetryData, getPriceMapAndCurrencyCodeTimestamp);
    return { priceMap: priceMap, currencyCode: currencyCode };
  } catch (err) {
    const failureTelemetry = { err, selfServeClassName: SqlX.name };
    selfServeTraceFailure(failureTelemetry, getPriceMapAndCurrencyCodeTimestamp);
    return { priceMap: undefined, currencyCode: undefined };
  }
};
