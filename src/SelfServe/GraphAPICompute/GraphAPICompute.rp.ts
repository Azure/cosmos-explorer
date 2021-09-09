import { configContext } from "../../ConfigContext";
import { userContext } from "../../UserContext";
import { armRequestWithoutPolling } from "../../Utils/arm/request";
import { selfServeTraceFailure, selfServeTraceStart, selfServeTraceSuccess } from "../SelfServeTelemetryProcessor";
import { RefreshResult } from "../SelfServeTypes";
import GraphAPICompute from "./GraphAPICompute";
import {
  FetchPricesResponse,
  RegionsResponse,
  GraphAPIComputeServiceResource,
  UpdateComputeRequestParameters,
} from "./GraphAPICompute.types";

const apiVersion = "2021-04-01-preview";
const gremlinV2 = "GremlinV2";

export enum ResourceStatus {
  Running = "Running",
  Creating = "Creating",
  Updating = "Updating",
  Deleting = "Deleting",
}

export interface ComputeResponse {
  sku: string;
  instances: number;
  status: string;
  endpoint: string;
}

export const getPath = (subscriptionId: string, resourceGroup: string, name: string): string => {
  return `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.DocumentDB/databaseAccounts/${name}/services/${gremlinV2}`;
};

export const updateComputeResource = async (sku: string, instances: number): Promise<string> => {
  const path = getPath(userContext.subscriptionId, userContext.resourceGroup, userContext.databaseAccount.name);
  const body: UpdateComputeRequestParameters = {
    properties: {
      instanceSize: sku,
      instanceCount: instances,
      serviceType: gremlinV2,
    },
  };
  const telemetryData = { ...body, httpMethod: "PUT", selfServeClassName: GraphAPICompute.name };
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
    const failureTelemetry = { ...body, e, selfServeClassName: GraphAPICompute.name };
    selfServeTraceFailure(failureTelemetry, updateTimeStamp);
    throw e;
  }
  return armRequestResult?.operationStatusUrl;
};

export const deleteComputeResource = async (): Promise<string> => {
  const path = getPath(userContext.subscriptionId, userContext.resourceGroup, userContext.databaseAccount.name);
  const telemetryData = { httpMethod: "DELETE", selfServeClassName: GraphAPICompute.name };
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
    const failureTelemetry = { e, selfServeClassName: GraphAPICompute.name };
    selfServeTraceFailure(failureTelemetry, deleteTimeStamp);
    throw e;
  }
  return armRequestResult?.operationStatusUrl;
};

export const getComputeResource = async (): Promise<GraphAPIComputeServiceResource> => {
  const path = getPath(userContext.subscriptionId, userContext.resourceGroup, userContext.databaseAccount.name);
  const telemetryData = { httpMethod: "GET", selfServeClassName: GraphAPICompute.name };
  const getResourceTimeStamp = selfServeTraceStart(telemetryData);
  let armRequestResult;
  try {
    armRequestResult = await armRequestWithoutPolling<GraphAPIComputeServiceResource>({
      host: configContext.ARM_ENDPOINT,
      path,
      method: "GET",
      apiVersion,
    });
    selfServeTraceSuccess(telemetryData, getResourceTimeStamp);
  } catch (e) {
    const failureTelemetry = { e, selfServeClassName: GraphAPICompute.name };
    selfServeTraceFailure(failureTelemetry, getResourceTimeStamp);
    throw e;
  }
  return armRequestResult?.result;
};

export const getCurrentProvisioningState = async (): Promise<ComputeResponse> => {
  try {
    const response = await getComputeResource();
    return {
      sku: response.properties.instanceSize,
      instances: response.properties.instanceCount,
      status: response.properties.status,
      endpoint: response.properties.GraphAPIComputeEndPoint,
    };
  } catch (e) {
    return { sku: undefined, instances: undefined, status: undefined, endpoint: undefined };
  }
};

export const refreshComputeProvisioning = async (): Promise<RefreshResult> => {
  try {
    const response = await getComputeResource();
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

export const getReadRegions = async (): Promise<Array<string>> => {
  try {
    const readRegions = new Array<string>();

    const response = await armRequestWithoutPolling<RegionsResponse>({
      host: configContext.ARM_ENDPOINT,
      path: getGeneralPath(userContext.subscriptionId, userContext.resourceGroup, userContext.databaseAccount.name),
      method: "GET",
      apiVersion: "2021-04-01-preview",
    });

    if (response.result.location !== undefined) {
      readRegions.push(response.result.location.replace(" ", "").toLowerCase());
    } else {
      for (const location of response.result.locations) {
        readRegions.push(location.locationName.replace(" ", "").toLowerCase());
      }
    }
    return readRegions;
  } catch (err) {
    return new Array<string>();
  }
};

const getFetchPricesPathForRegion = (subscriptionId: string): string => {
  return `/subscriptions/${subscriptionId}/providers/Microsoft.CostManagement/fetchPrices`;
};

export const getPriceMap = async (regions: Array<string>): Promise<Map<string, Map<string, number>>> => {
  try {
    const priceMap = new Map<string, Map<string, number>>();

    for (const region of regions) {
      const regionPriceMap = new Map<string, number>();

      const response = await armRequestWithoutPolling<FetchPricesResponse>({
        host: configContext.ARM_ENDPOINT,
        path: getFetchPricesPathForRegion(userContext.subscriptionId),
        method: "POST",
        apiVersion: "2020-01-01-preview",
        queryParams: {
          filter:
            "armRegionName eq '" +
            region +
            "' and serviceFamily eq 'Databases' and productName eq 'Azure Cosmos DB Dedicated Gateway - General Purpose'",
        },
      });

      for (const item of response.result.Items) {
        regionPriceMap.set(item.skuName, item.retailPrice);
      }
      priceMap.set(region, regionPriceMap);
    }

    return priceMap;
  } catch (err) {
    return undefined;
  }
};
