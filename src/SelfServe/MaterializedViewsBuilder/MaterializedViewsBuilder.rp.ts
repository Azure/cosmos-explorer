import { configContext } from "../../ConfigContext";
import { userContext } from "../../UserContext";
import { armRequestWithoutPolling } from "../../Utils/arm/request";
import { selfServeTraceFailure, selfServeTraceStart, selfServeTraceSuccess } from "../SelfServeTelemetryProcessor";
import { RefreshResult } from "../SelfServeTypes";
import MaterializedViewsBuilder from "./MaterializedViewsBuilder";
import {
  FetchPricesResponse,
  MaterializedViewsBuilderServiceResource,
  PriceMapAndCurrencyCode,
  RegionsResponse,
  UpdateMaterializedViewsBuilderRequestParameters,
} from "./MaterializedViewsBuilderTypes";

const apiVersion = "2021-07-01-preview";

export enum ResourceStatus {
  Running = "Running",
  Creating = "Creating",
  Updating = "Updating",
  Deleting = "Deleting",
}

export interface MaterializedViewsBuilderResponse {
  sku: string;
  instances: number;
  status: string;
  endpoint: string;
}

export const getPath = (subscriptionId: string, resourceGroup: string, name: string): string => {
  return `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.DocumentDB/databaseAccounts/${name}/services/materializedviewsBuilder`;
};

export const updateMaterializedViewsBuilderResource = async (sku: string, instances: number): Promise<string> => {
  const path = getPath(userContext.subscriptionId, userContext.resourceGroup, userContext.databaseAccount.name);
  const body: UpdateMaterializedViewsBuilderRequestParameters = {
    properties: {
      instanceSize: sku,
      instanceCount: instances,
      serviceType: "materializedviewsBuilder",
    },
  };
  const telemetryData = { ...body, httpMethod: "PUT", selfServeClassName: MaterializedViewsBuilder.name };
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
    const failureTelemetry = { ...body, e, selfServeClassName: MaterializedViewsBuilder.name };
    selfServeTraceFailure(failureTelemetry, updateTimeStamp);
    throw e;
  }
  return armRequestResult?.operationStatusUrl;
};

export const deleteMaterializedViewsBuilderResource = async (): Promise<string> => {
  const path = getPath(userContext.subscriptionId, userContext.resourceGroup, userContext.databaseAccount.name);
  const telemetryData = { httpMethod: "DELETE", selfServeClassName: MaterializedViewsBuilder.name };
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
    const failureTelemetry = { e, selfServeClassName: MaterializedViewsBuilder.name };
    selfServeTraceFailure(failureTelemetry, deleteTimeStamp);
    throw e;
  }
  return armRequestResult?.operationStatusUrl;
};

export const getMaterializedViewsBuilderResource = async (): Promise<MaterializedViewsBuilderServiceResource> => {
  const path = getPath(userContext.subscriptionId, userContext.resourceGroup, userContext.databaseAccount.name);
  const telemetryData = { httpMethod: "GET", selfServeClassName: MaterializedViewsBuilder.name };
  const getResourceTimeStamp = selfServeTraceStart(telemetryData);
  let armRequestResult;
  try {
    armRequestResult = await armRequestWithoutPolling<MaterializedViewsBuilderServiceResource>({
      host: configContext.ARM_ENDPOINT,
      path,
      method: "GET",
      apiVersion,
    });
    selfServeTraceSuccess(telemetryData, getResourceTimeStamp);
  } catch (e) {
    const failureTelemetry = { e, selfServeClassName: MaterializedViewsBuilder.name };
    selfServeTraceFailure(failureTelemetry, getResourceTimeStamp);
    throw e;
  }
  return armRequestResult?.result;
};

export const getCurrentProvisioningState = async (): Promise<MaterializedViewsBuilderResponse> => {
  try {
    const response = await getMaterializedViewsBuilderResource();
    return {
      sku: response.properties.instanceSize,
      instances: response.properties.instanceCount,
      status: response.properties.status,
      endpoint: response.properties.MaterializedViewsBuilderEndPoint,
    };
  } catch (e) {
    return { sku: undefined, instances: undefined, status: undefined, endpoint: undefined };
  }
};

export const refreshMaterializedViewsBuilderProvisioning = async (): Promise<RefreshResult> => {
  try {
    const response = await getMaterializedViewsBuilderResource();
    if (response.properties.status === ResourceStatus.Running.toString()) {
      return { isUpdateInProgress: false, updateInProgressMessageTKey: undefined };
    } else if (response.properties.status === ResourceStatus.Creating.toString()) {
      return {
        isUpdateInProgress: true,
        updateInProgressMessageTKey:
          userContext.apiType === "SQL" ? "GlobalsecondaryindexesCreateMessage" : "CreateMessage",
      };
    } else if (response.properties.status === ResourceStatus.Deleting.toString()) {
      return {
        isUpdateInProgress: true,
        updateInProgressMessageTKey:
          userContext.apiType === "SQL" ? "GlobalsecondaryindexesDeleteMessage" : "DeleteMessage",
      };
    } else {
      return {
        isUpdateInProgress: true,
        updateInProgressMessageTKey:
          userContext.apiType === "SQL" ? "GlobalsecondaryindexesUpdateMessage" : "UpdateMessage",
      };
    }
  } catch {
    //TODO differentiate between different failures
    return { isUpdateInProgress: false, updateInProgressMessageTKey: undefined };
  }
};

const getGeneralPath = (subscriptionId: string, resourceGroup: string, name: string): string => {
  return `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.DocumentDB/databaseAccounts/${name}`;
};

export const getRegions = async (): Promise<Array<string>> => {
  const telemetryData = {
    feature: "Calculate approximate cost",
    function: "getRegions",
    description: "",
    selfServeClassName: MaterializedViewsBuilder.name,
  };
  const getRegionsTimestamp = selfServeTraceStart(telemetryData);

  try {
    const regions = new Array<string>();

    const response = await armRequestWithoutPolling<RegionsResponse>({
      host: configContext.ARM_ENDPOINT,
      path: getGeneralPath(userContext.subscriptionId, userContext.resourceGroup, userContext.databaseAccount.name),
      method: "GET",
      apiVersion: "2021-07-01-preview",
    });

    if (response.result.location !== undefined) {
      regions.push(response.result.location.split(" ").join("").toLowerCase());
    } else {
      for (const location of response.result.locations) {
        regions.push(location.locationName.split(" ").join("").toLowerCase());
      }
    }

    selfServeTraceSuccess(telemetryData, getRegionsTimestamp);
    return regions;
  } catch (err) {
    const failureTelemetry = { err, selfServeClassName: MaterializedViewsBuilder.name };
    selfServeTraceFailure(failureTelemetry, getRegionsTimestamp);
    return new Array<string>();
  }
};

const getFetchPricesPathForRegion = (subscriptionId: string): string => {
  return `/subscriptions/${subscriptionId}/providers/Microsoft.CostManagement/fetchPrices`;
};

export const getPriceMapAndCurrencyCode = async (regions: Array<string>): Promise<PriceMapAndCurrencyCode> => {
  const telemetryData = {
    feature: "Calculate approximate cost",
    function: "getPriceMapAndCurrencyCode",
    description: "fetch prices API call",
    selfServeClassName: MaterializedViewsBuilder.name,
  };
  const getPriceMapAndCurrencyCodeTimestamp = selfServeTraceStart(telemetryData);

  try {
    const priceMap = new Map<string, Map<string, number>>();
    let currencyCode;
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
            "' and serviceFamily eq 'Databases' and productName eq 'Azure Cosmos DB MaterializedViews Builder - General Purpose'",
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
      priceMap.set(region, regionPriceMap);
    }

    selfServeTraceSuccess(telemetryData, getPriceMapAndCurrencyCodeTimestamp);
    return { priceMap: priceMap, currencyCode: currencyCode };
  } catch (err) {
    const failureTelemetry = { err, selfServeClassName: MaterializedViewsBuilder.name };
    selfServeTraceFailure(failureTelemetry, getPriceMapAndCurrencyCodeTimestamp);
    return { priceMap: undefined, currencyCode: undefined };
  }
};
