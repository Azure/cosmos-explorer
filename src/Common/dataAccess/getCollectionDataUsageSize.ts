import { isFabricNative } from "Platform/Fabric/FabricUtil";
import { AuthType } from "../../AuthType";
import { configContext } from "../../ConfigContext";
import { userContext } from "../../UserContext";
import { armRequest } from "../../Utils/arm/request";
import { handleError } from "../ErrorHandlingUtils";

interface TimeSeriesData {
  data: {
    timeStamp: string;
    total: number;
  }[];
  metadatavalues: {
    name: {
      localizedValue: string;
      value: string;
    };
    value: string;
  };
}

interface MetricsData {
  displayDescription: string;
  errorCode: string;
  id: string;
  name: {
    value: string;
    localizedValue: string;
  };
  timeseries: TimeSeriesData[];
  type: string;
  unit: string;
}

interface MetricsResponse {
  cost: number;
  interval: string;
  namespace: string;
  resourceregion: string;
  timespan: string;
  value: MetricsData[];
}

export const getCollectionUsageSizeInKB = async (databaseName: string, containerName: string): Promise<number> => {
  if (userContext.authType !== AuthType.AAD || isFabricNative()) {
    return undefined;
  }

  const { subscriptionId, resourceGroup, databaseAccount } = userContext;
  const accountName = databaseAccount.name;

  const filter = `DatabaseName eq '${databaseName}' and CollectionName eq '${containerName}'`;
  const metricNames = "DataUsage,IndexUsage";
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/providers/microsoft.insights/metrics`;

  try {
    const metricsResponse: MetricsResponse = await armRequest({
      host: configContext.ARM_ENDPOINT,
      path,
      method: "GET",
      apiVersion: "2018-01-01",
      queryParams: {
        filter,
        metricNames,
      },
    });

    if (metricsResponse?.value?.length !== 2) {
      return undefined;
    }

    const dataUsageData: MetricsData = metricsResponse.value[0];
    const indexUsagedata: MetricsData = metricsResponse.value[1];
    const dataUsageSizeInKb: number = getUsageSizeInKb(dataUsageData);
    const indexUsageSizeInKb: number = getUsageSizeInKb(indexUsagedata);

    return dataUsageSizeInKb + indexUsageSizeInKb;
  } catch (error) {
    handleError(error, "getCollectionUsageSize");
    return undefined;
  }
};

const getUsageSizeInKb = (metricsData: MetricsData): number => {
  if (metricsData?.errorCode !== "Success") {
    throw Error(`Get collection usage size failed: ${metricsData.errorCode}`);
  }

  const timeSeriesData: TimeSeriesData = metricsData?.timeseries?.[0];
  const usageSizeInBytes: number = timeSeriesData?.data?.[0]?.total;

  return usageSizeInBytes ? usageSizeInBytes / 1024 : 0;
};
