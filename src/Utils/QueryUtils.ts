import * as DataModels from "../Contracts/DataModels";
import * as ViewModels from "../Contracts/ViewModels";

export class QueryUtils {
  public static buildDocumentsQuery(
    filter: string,
    partitionKeyProperty: string,
    partitionKey: DataModels.PartitionKey
  ): string {
    let query: string = partitionKeyProperty
      ? `select c.id, c._self, c._rid, c._ts, ${QueryUtils.buildDocumentsQueryPartitionProjections(
          "c",
          partitionKey
        )} as _partitionKeyValue from c`
      : `select c.id, c._self, c._rid, c._ts from c`;

    if (filter) {
      query += " " + filter;
    }

    return query;
  }

  public static buildDocumentsQueryPartitionProjections(
    collectionAlias: string,
    partitionKey: DataModels.PartitionKey
  ): string {
    if (!partitionKey) {
      return "";
    }

    // e.g., path /order/id will be projected as c["order"]["id"],
    // to escape any property names that match a keyword
    let projections = [];
    for (let index in partitionKey.paths) {
      // TODO: Handle "/" in partition key definitions
      const projectedProperties: string[] = partitionKey.paths[index].split("/").slice(1);
      let projectedProperty: string = "";

      projectedProperties.forEach((property: string) => {
        const projection = property.trim();
        if (projection.length > 0 && projection.charAt(0) != "'" && projection.charAt(0) != '"') {
          projectedProperty = projectedProperty + `["${projection}"]`;
        } else if (projection.length > 0 && projection.charAt(0) == "'") {
          // trim single quotes and escape double quotes
          const projectionSlice = projection.slice(1, projection.length - 1);
          projectedProperty =
            projectedProperty + `["${projectionSlice.replace(/\\"/g, '"').replace(/"/g, '\\\\\\"')}"]`;
        } else {
          projectedProperty = projectedProperty + `[${projection}]`;
        }
      });

      projections.push(`${collectionAlias}${projectedProperty}`);
    }

    return projections.join(",");
  }

  public static queryPagesUntilContentPresent(
    firstItemIndex: number,
    queryItems: (itemIndex: number) => Promise<ViewModels.QueryResults>
  ): Promise<ViewModels.QueryResults> {
    let roundTrips: number = 0;
    let netRequestCharge: number = 0;
    const doRequest = async (itemIndex: number): Promise<ViewModels.QueryResults> =>
      queryItems(itemIndex).then((results: ViewModels.QueryResults) => {
        roundTrips = roundTrips + 1;
        results.roundTrips = roundTrips;
        results.requestCharge = Number(results.requestCharge) + netRequestCharge;
        netRequestCharge = Number(results.requestCharge);
        const resultsMetadata: ViewModels.QueryResultsMetadata = {
          hasMoreResults: results.hasMoreResults,
          itemCount: results.itemCount,
          firstItemIndex: results.firstItemIndex,
          lastItemIndex: results.lastItemIndex
        };
        if (resultsMetadata.itemCount === 0 && resultsMetadata.hasMoreResults) {
          return doRequest(resultsMetadata.lastItemIndex);
        }
        return results;
      });

    return doRequest(firstItemIndex);
  }

  public static queryAllPages(
    queryItems: (itemIndex: number) => Promise<ViewModels.QueryResults>
  ): Promise<ViewModels.QueryResults> {
    const queryResults: ViewModels.QueryResults = {
      documents: [],
      activityId: undefined,
      hasMoreResults: false,
      itemCount: 0,
      firstItemIndex: 0,
      lastItemIndex: 0,
      requestCharge: 0,
      roundTrips: 0
    };
    const doRequest = async (itemIndex: number): Promise<ViewModels.QueryResults> =>
      queryItems(itemIndex).then((results: ViewModels.QueryResults) => {
        const { requestCharge, hasMoreResults, itemCount, lastItemIndex, documents } = results;
        queryResults.roundTrips = queryResults.roundTrips + 1;
        queryResults.requestCharge = Number(queryResults.requestCharge) + Number(requestCharge);
        queryResults.hasMoreResults = hasMoreResults;
        queryResults.itemCount = queryResults.itemCount + itemCount;
        queryResults.lastItemIndex = lastItemIndex;
        queryResults.documents = queryResults.documents.concat(documents);
        if (queryResults.hasMoreResults) {
          return doRequest(queryResults.lastItemIndex + 1);
        }
        return queryResults;
      });

    return doRequest(0);
  }
}
