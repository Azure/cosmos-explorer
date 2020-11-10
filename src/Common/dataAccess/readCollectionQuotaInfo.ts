import * as DataModels from "../../Contracts/DataModels";
import * as HeadersUtility from "../HeadersUtility";
import * as ViewModels from "../../Contracts/ViewModels";
import { ContainerDefinition, Resource } from "@azure/cosmos";
import { HttpHeaders } from "../Constants";
import { RequestOptions } from "@azure/cosmos/dist-esm";
import { client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";

interface ResourceWithStatistics {
  statistics: DataModels.Statistic[];
}

export const readCollectionQuotaInfo = async (
  collection: ViewModels.Collection
): Promise<DataModels.CollectionQuotaInfo> => {
  const clearMessage = logConsoleProgress(`Querying containers for database ${collection.id}`);
  const options: RequestOptions = {};
  options.populateQuotaInfo = true;
  options.initialHeaders = options.initialHeaders || {};
  options.initialHeaders[HttpHeaders.populatePartitionStatistics] = true;

  try {
    const response = await client()
      .database(collection.databaseId)
      .container(collection.id())
      .read(options);
    const quota: DataModels.CollectionQuotaInfo = HeadersUtility.getQuota(response.headers);
    const resource = response.resource as ContainerDefinition & Resource & ResourceWithStatistics;
    quota["usageSizeInKB"] = resource.statistics.reduce(
      (previousValue: number, currentValue: DataModels.Statistic) => previousValue + currentValue.sizeInKB,
      0
    );
    quota["numPartitions"] = resource.statistics.length;
    quota["uniqueKeyPolicy"] = collection.uniqueKeyPolicy; // TODO: Remove after refactoring (#119617)

    return quota;
  } catch (error) {
    handleError(error, "ReadCollectionQuotaInfo", `Error while querying quota info for container ${collection.id}`);
    throw error;
  } finally {
    clearMessage();
  }
};
