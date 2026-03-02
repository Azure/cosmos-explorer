import { PartitionKey, PartitionKeyDefinition } from "@azure/cosmos";
import { getRUThreshold, ruThresholdEnabled } from "Shared/StorageUtility";
import { userContext } from "UserContext";
import { logConsoleWarning } from "Utils/NotificationConsoleUtils";
import * as DataModels from "../Contracts/DataModels";
import * as ViewModels from "../Contracts/ViewModels";

export const defaultQueryFields = ["id", "_self", "_rid", "_ts"];

export function buildDocumentsQuery(
  filter: string,
  partitionKeyProperties: string[],
  partitionKey: DataModels.PartitionKey,
  additionalField: string[] = [],
): string {
  const fieldSet = new Set<string>(defaultQueryFields);
  additionalField.forEach((prop) => {
    if (!partitionKeyProperties.includes(prop)) {
      fieldSet.add(prop);
    }
  });

  const objectListSpec = [...fieldSet].map((prop) => `c.${prop}`).join(",");
  let query =
    partitionKeyProperties && partitionKeyProperties.length > 0
      ? `select ${objectListSpec}, [${buildDocumentsQueryPartitionProjections(
          "c",
          partitionKey,
        )}] as _partitionKeyValue from c`
      : `select ${objectListSpec} from c`;

  if (filter) {
    query += " " + filter;
  }

  return query;
}

export function buildDocumentsQueryPartitionProjections(
  collectionAlias: string,
  partitionKey?: DataModels.PartitionKey,
): string {
  if (!partitionKey) {
    return "";
  }

  // e.g., path /order/id will be projected as c["order"]["id"],
  // to escape any property names that match a keyword
  const projections = [];
  for (const index in partitionKey.paths) {
    // TODO: Handle "/" in partition key definitions
    const projectedProperties: string[] = partitionKey.paths[index].split("/").slice(1);
    const isSystemPartitionKey: boolean = partitionKey.systemKey || false;
    let projectedProperty = "";

    projectedProperties.forEach((property: string) => {
      const projection = property.trim();
      if (projection.length > 0 && projection.charAt(0) !== "'" && projection.charAt(0) !== '"') {
        projectedProperty += `["${projection}"]`;
      } else if (projection.length > 0 && projection.charAt(0) === "'") {
        // trim single quotes and escape double quotes
        const projectionSlice = projection.slice(1, projection.length - 1);
        projectedProperty += `["${projectionSlice.replace(/\\"/g, '"').replace(/"/g, '\\\\\\"')}"]`;
      } else {
        projectedProperty += `[${projection}]`;
      }
    });
    const fullAccess = `${collectionAlias}${projectedProperty}`;
    if (!isSystemPartitionKey) {
      const wrappedProjection = `IIF(IS_DEFINED(${fullAccess}), ${fullAccess}, {})`;
      projections.push(wrappedProjection);
    } else {
      projections.push(fullAccess);
    }
  }

  return projections.join(",");
}

export const queryPagesUntilContentPresent = async (
  firstItemIndex: number,
  queryItems: (itemIndex: number) => Promise<ViewModels.QueryResults>,
): Promise<ViewModels.QueryResults> => {
  let roundTrips = 0;
  let netRequestCharge = 0;
  const doRequest = async (itemIndex: number): Promise<ViewModels.QueryResults> => {
    const results = await queryItems(itemIndex);
    roundTrips = roundTrips + 1;
    results.roundTrips = roundTrips;
    results.requestCharge = Number(results.requestCharge) + netRequestCharge;
    netRequestCharge = Number(results.requestCharge);

    if (results.hasMoreResults && userContext.apiType === "SQL" && ruThresholdEnabled()) {
      const ruThreshold: number = getRUThreshold();
      if (netRequestCharge > ruThreshold) {
        logConsoleWarning(
          `Warning: Query has exceeded the Request Unit threshold of ${ruThreshold} RUs. Query results show only those documents returned before the threshold was exceeded`,
        );
        results.ruThresholdExceeded = true;
        return results;
      }
    }

    const resultsMetadata = {
      hasMoreResults: results.hasMoreResults,
      itemCount: results.itemCount,
      firstItemIndex: results.firstItemIndex,
      lastItemIndex: results.lastItemIndex,
    };
    if (resultsMetadata.itemCount === 0 && resultsMetadata.hasMoreResults) {
      return await doRequest(resultsMetadata.lastItemIndex);
    }
    return results;
  };

  return await doRequest(firstItemIndex);
};

/**
 * Strips enclosing double quotes from a partition key path segment.
 * e.g., '"partition-key"' -> 'partition-key'
 */
export const stripDoubleQuotesFromSegment = (segment: string): string => {
  if (segment.length >= 2 && segment.charAt(0) === '"' && segment.charAt(segment.length - 1) === '"') {
    return segment.slice(1, -1);
  }
  return segment;
};

/* eslint-disable  @typescript-eslint/no-explicit-any */
export const getValueForPath = (content: any, pathSegments: string[]): any => {
  if (pathSegments.length === 0) {
    return undefined;
  }

  let currentValue = content;

  for (const segment of pathSegments) {
    if (!currentValue || currentValue[segment] === undefined) {
      return undefined;
    }
    currentValue = currentValue[segment];
  }

  return currentValue;
};

/* eslint-disable  @typescript-eslint/no-explicit-any */
export const extractPartitionKeyValues = (
  documentContent: any,
  partitionKeyDefinition: PartitionKeyDefinition,
): PartitionKey[] => {
  if (!partitionKeyDefinition.paths || partitionKeyDefinition.paths.length === 0) {
    return undefined;
  }

  const partitionKeyValues: PartitionKey[] = [];

  partitionKeyDefinition.paths.forEach((partitionKeyPath: string) => {
    const pathSegments: string[] = partitionKeyPath.substring(1).split("/").map(stripDoubleQuotesFromSegment);
    const value = getValueForPath(documentContent, pathSegments);

    if (value !== undefined) {
      partitionKeyValues.push(value);
    } else if (!partitionKeyDefinition.systemKey) {
      partitionKeyValues.push({});
    }
  });

  return partitionKeyValues;
};
