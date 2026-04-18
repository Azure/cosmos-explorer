import { configContext } from "../../ConfigContext";
import { userContext } from "../../UserContext";
import { get } from "../../Utils/arm/generatedClients/cosmos/locations";
import { armRequestWithoutPolling, getOfferingIdsRequest } from "../../Utils/arm/request";
import { selfServeTraceFailure, selfServeTraceStart, selfServeTraceSuccess } from "../SelfServeTelemetryProcessor";
import { RefreshResult } from "../SelfServeTypes";
import SqlX from "./SqlX";
import {
  FetchPricesResponse,
  GetOfferingIdsResponse,
  OfferingIdMap,
  OfferingIdRequest,
  PriceMapAndCurrencyCode,
  RegionItem,
  RegionsResponse,
  SqlxServiceResource,
  UpdateDedicatedGatewayRequestParameters,
} from "./SqlxTypes";

const apiVersion = "2024-02-15-preview";

export enum ResourceStatus {
  Running = "Running",
  Creating = "Creating",
  Updating = "Updating",
  Deleting = "Deleting",
}

export interface DedicatedGatewayResponse {
  sku: string;
  dedicatedGatewayType: string;
  instances: number;
  status: string;
  endpoint: string;
}

export const getPath = (subscriptionId: string, resourceGroup: string, name: string): string => {
  return `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.DocumentDB/databaseAccounts/${name}/services/SqlDedicatedGateway`;
};

export const updateDedicatedGatewayResource = async (
  sku: string,
  dedicatedGatewayType: string,
  instances: number,
): Promise<string> => {
  const path = getPath(userContext.subscriptionId, userContext.resourceGroup, userContext.databaseAccount.name);
  const body: UpdateDedicatedGatewayRequestParameters = {
    properties: {
      instanceSize: sku,
      dedicatedGatewayType: dedicatedGatewayType,
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
      dedicatedGatewayType: response.properties.dedicatedGatewayType,
      instances: response.properties.instanceCount,
      status: response.properties.status,
      endpoint: response.properties.sqlxEndPoint,
    };
  } catch (e) {
    return {
      sku: undefined,
      dedicatedGatewayType: undefined,
      instances: undefined,
      status: undefined,
      endpoint: undefined,
    };
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

export const getRegionShortName = async (regionDisplayName: string): Promise<string> => {
  const locationsList = await get(userContext.subscriptionId, regionDisplayName);

  if ("id" in locationsList) {
    const locationId = locationsList.id;
    return locationId.substring(locationId.lastIndexOf("/") + 1);
  }
  return undefined;
};

const getFetchPricesPathForRegion = (subscriptionId: string): string => {
  return `/subscriptions/${subscriptionId}/providers/Microsoft.CostManagement/fetchPrices`;
};

export const getPriceMapAndCurrencyCode = async (map: OfferingIdMap): Promise<PriceMapAndCurrencyCode> => {
  const telemetryData = {
    feature: "Calculate approximate cost",
    function: "getPriceMapAndCurrencyCode",
    description: "fetch prices API call",
    selfServeClassName: SqlX.name,
  };
  const getPriceMapAndCurrencyCodeTimestamp = selfServeTraceStart(telemetryData);

  try {
    const priceMap = new Map<string, Map<string, number>>();
    let billingCurrency;
    for (const region of map.keys()) {
      // if no offering id is found for that region, skipping calling price API
      const subMap = map.get(region);
      if (!subMap || subMap.size === 0) {
        continue;
      }
      const regionPriceMap = new Map<string, number>();
      const regionShortName = await getRegionShortName(region);
      const requestBody: OfferingIdRequest = {
        location: regionShortName,
        ids: Array.from(map.get(region).keys()),
      };

      const response = await armRequestWithoutPolling<FetchPricesResponse>({
        host: configContext.ARM_ENDPOINT,
        path: getFetchPricesPathForRegion(userContext.subscriptionId),
        method: "POST",
        apiVersion: "2023-04-01-preview",
        body: requestBody,
      });

      for (const item of response.result) {
        if (item.error) {
          continue;
        }

        if (billingCurrency === undefined) {
          billingCurrency = item.billingCurrency;
        } else if (item.billingCurrency !== billingCurrency) {
          throw Error("Currency Code Mismatch: Currency code not same for all regions / skus.");
        }

        const offeringId = item.id;
        const skuName = map.get(region).get(offeringId);
        const unitPriceinBillingCurrency = item.prices.find((x) => x.type === "Consumption")
          ?.unitPriceinBillingCurrency;
        regionPriceMap.set(skuName, unitPriceinBillingCurrency);
      }
      priceMap.set(region, regionPriceMap);
    }

    selfServeTraceSuccess(telemetryData, getPriceMapAndCurrencyCodeTimestamp);
    return { priceMap: priceMap, billingCurrency: billingCurrency };
  } catch (err) {
    const failureTelemetry = { err, selfServeClassName: SqlX.name };
    selfServeTraceFailure(failureTelemetry, getPriceMapAndCurrencyCodeTimestamp);
    return { priceMap: new Map<string, Map<string, number>>(), billingCurrency: undefined };
  }
};

const getOfferingIdPathForRegion = (): string => {
  return `/skus?serviceFamily=Databases&service=Azure Cosmos DB`;
};

export const getOfferingIds = async (regions: Array<RegionItem>): Promise<OfferingIdMap> => {
  const telemetryData = {
    feature: "Get Offering Ids to calculate approximate cost",
    function: "getOfferingIds",
    description: "fetch offering ids API call",
    selfServeClassName: SqlX.name,
  };
  const getOfferingIdsCodeTimestamp = selfServeTraceStart(telemetryData);

  try {
    const offeringIdMap = new Map<string, Map<string, string>>();
    for (const regionItem of regions) {
      const regionOfferingIdMap = new Map<string, string>();
      const regionShortName = await getRegionShortName(regionItem.locationName);

      const response = await getOfferingIdsRequest<GetOfferingIdsResponse>({
        host: configContext.CATALOG_ENDPOINT,
        path: getOfferingIdPathForRegion(),
        method: "GET",
        apiVersion: configContext.CATALOG_API_VERSION,
        queryParams: {
          filter:
            "armRegionName eq '" +
            regionShortName +
            "' and productDisplayName eq 'Azure Cosmos DB Dedicated Gateway - General Purpose'",
        },
      });

      for (const item of response.result.items) {
        if (item.offeringProperties?.length > 0) {
          regionOfferingIdMap.set(item.offeringProperties[0].offeringId, item.skuName);
        }
      }
      offeringIdMap.set(regionItem.locationName, regionOfferingIdMap);
    }

    selfServeTraceSuccess(telemetryData, getOfferingIdsCodeTimestamp);
    return offeringIdMap;
  } catch (err) {
    const failureTelemetry = { err, selfServeClassName: SqlX.name };
    selfServeTraceFailure(failureTelemetry, getOfferingIdsCodeTimestamp);
    return new Map<string, Map<string, string>>();
  }
};
