import { configContext } from "../../ConfigContext";
import { userContext } from "../../UserContext";
import { armRequestWithoutPolling } from "../../Utils/arm/request";
import { selfServeTraceFailure, selfServeTraceStart, selfServeTraceSuccess } from "../SelfServeTelemetryProcessor";
import { RefreshResult } from "../SelfServeTypes";
import SqlX from "./SqlX";
import { SqlxServiceResource, UpdateDedicatedGatewayRequestParameters } from "./SqlxTypes";

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

// Data model for Read Regions Query
interface ReadRegionsResponse {
  locations: Array<ReadRegionItem>;
  location: string;
}

interface ReadRegionItem {
  locationName: string;
}

// Construct path to query arm about cosmos db account as a whole
const getGeneralPath = (subscriptionId: string, resourceGroup: string, name: string): string => {
  return `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.DocumentDB/databaseAccounts/${name}`;
};

// Query ARM to get regions
export const getReadRegions = async (): Promise<Array<string>> => {
  try {
    var readRegions = new Array<string>();

    // Query ARM
    const response = await armRequestWithoutPolling<ReadRegionsResponse>({
      host: configContext.ARM_ENDPOINT,
      path: getGeneralPath(userContext.subscriptionId, userContext.resourceGroup, userContext.databaseAccount.name),
      method: "GET",
      apiVersion: "2021-04-01-preview",
    });

    // Parse ARM Response to determine read regions
    if (response.result.location != undefined) {
      readRegions.push(response.result.location.replace(" ", "").toLowerCase());
    } else {
      for (var i = 0; i < response.result.locations.length; i++) {
        readRegions.push(response.result.locations[i].locationName.replace(" ", "").toLowerCase());
      }
    }
    return readRegions;
  } catch (err) {
    alert(err);
    // TODO: Log some failure
    return new Array<string>();
  }
};

// Get Fetch Prices Path for Dedicated Gateway Product
const getFetchPricesPathForRegion = (subscriptionId: string): string => {
  return `/subscriptions/${subscriptionId}/providers/Microsoft.CostManagement/fetchPrices`;
};

// Data Model for Fetch Prices API
interface FetchPricesResponse {
  Items: Array<PriceItem>;
  NextPageLink: string | undefined;
  Count: number;
}

interface PriceItem {
  retailPrice: number;
  skuName: string;
}

// Query ARM Fetch Prices to get pricing
export const getPriceMap = async (readRegions: Array<string>): Promise<Map<string, Map<string, number>>> => {
  try {
    // Initialize empty PriceMap
    var priceMap = new Map<string, Map<string, number>>();

    // Query ARM
    for (var i = 0; i < readRegions.length; i++) {
      var regionPriceMap = new Map<string, number>();

      // Make actual query
      const response = await armRequestWithoutPolling<FetchPricesResponse>({
        host: configContext.ARM_ENDPOINT,
        path: getFetchPricesPathForRegion(userContext.subscriptionId),
        method: "POST",
        apiVersion: "2020-01-01-preview",
        queryParams: {
          filter: `armRegionName eq '${readRegions[i]}' and serviceFamily eq 'Databases' and productName eq 'Azure Cosmos DB Dedicated Gateway - General Purpose'`,
        },
      });

      // Parse response to create price mapping for current region
      for (var j = 0; j < response.result.Items.length; j++) {
        regionPriceMap.set(response.result.Items[j].skuName, response.result.Items[j].retailPrice);
      }

      // Insert region's PriceMap to overall PriceMap
      priceMap.set(readRegions[i], regionPriceMap);
    }

    return priceMap;
  } catch (err) {
    alert(err);
    // TODO: Log some failure
    return undefined;
  }
};
