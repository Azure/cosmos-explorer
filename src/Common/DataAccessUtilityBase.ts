import {
  ConflictDefinition,
  FeedOptions,
  ItemDefinition,
  OfferDefinition,
  QueryIterator,
  Resource
} from "@azure/cosmos";
import { RequestOptions } from "@azure/cosmos/dist-esm";
import { configContext, Platform } from "../ConfigContext";
import * as DataModels from "../Contracts/DataModels";
import { MessageTypes } from "../Contracts/ExplorerContracts";
import * as ViewModels from "../Contracts/ViewModels";
import ConflictId from "../Explorer/Tree/ConflictId";
import DocumentId from "../Explorer/Tree/DocumentId";
import StoredProcedure from "../Explorer/Tree/StoredProcedure";
import { LocalStorageUtility, StorageKey } from "../Shared/StorageUtility";
import { OfferUtils } from "../Utils/OfferUtils";
import * as Constants from "./Constants";
import { client } from "./CosmosClient";
import * as HeadersUtility from "./HeadersUtility";
import { sendCachedDataMessage } from "./MessageHandler";

export function getCommonQueryOptions(options: FeedOptions): any {
  const storedItemPerPageSetting: number = LocalStorageUtility.getEntryNumber(StorageKey.ActualItemPerPage);
  options = options || {};
  options.populateQueryMetrics = true;
  options.enableScanInQuery = options.enableScanInQuery || true;
  if (!options.partitionKey) {
    options.forceQueryPlan = true;
  }
  options.maxItemCount =
    options.maxItemCount ||
    (storedItemPerPageSetting !== undefined && storedItemPerPageSetting) ||
    Constants.Queries.itemsPerPage;
  options.maxDegreeOfParallelism = LocalStorageUtility.getEntryNumber(StorageKey.MaxDegreeOfParellism);

  return options;
}

export async function queryDocuments(
  databaseId: string,
  containerId: string,
  query: string,
  options: any
): Promise<QueryIterator<ItemDefinition & Resource>> {
  options = getCommonQueryOptions(options);
  return client()
    .database(databaseId)
    .container(containerId)
    .items.query(query, options);
}

export function getPartitionKeyHeaderForConflict(conflictId: ConflictId): Object {
  const partitionKeyDefinition: DataModels.PartitionKey = conflictId.partitionKey;
  const partitionKeyValue: any = conflictId.partitionKeyValue;

  return getPartitionKeyHeader(partitionKeyDefinition, partitionKeyValue);
}

export function getPartitionKeyHeader(partitionKeyDefinition: DataModels.PartitionKey, partitionKeyValue: any): Object {
  if (!partitionKeyDefinition) {
    return undefined;
  }

  if (partitionKeyValue === undefined) {
    return [{}];
  }

  return [partitionKeyValue];
}

export function updateDocument(
  collection: ViewModels.CollectionBase,
  documentId: DocumentId,
  newDocument: any
): Promise<any> {
  const partitionKey = documentId.partitionKeyValue;

  return client()
    .database(collection.databaseId)
    .container(collection.id())
    .item(documentId.id(), partitionKey)
    .replace(newDocument)
    .then(response => response.resource);
}

export function executeStoredProcedure(
  collection: ViewModels.Collection,
  storedProcedure: StoredProcedure,
  partitionKeyValue: any,
  params: any[]
): Promise<any> {
  return Promise.race([
    client()
      .database(collection.databaseId)
      .container(collection.id())
      .scripts.storedProcedure(storedProcedure.id())
      .execute(partitionKeyValue, params, { enableScriptLogging: true })
      .then(response => ({
        result: response.resource,
        scriptLogs: response.headers[Constants.HttpHeaders.scriptLogResults]
      })),
    new Promise((_, reject) =>
      setTimeout(
        () => reject(`Request timed out while executing stored procedure ${storedProcedure.id()}`),
        Constants.ClientDefaults.requestTimeoutMs
      )
    )
  ]);
}

export function createDocument(collection: ViewModels.CollectionBase, newDocument: any): Promise<any> {
  return client()
    .database(collection.databaseId)
    .container(collection.id())
    .items.create(newDocument)
    .then(response => response.resource);
}

export function readDocument(collection: ViewModels.CollectionBase, documentId: DocumentId): Promise<any> {
  const partitionKey = documentId.partitionKeyValue;

  return client()
    .database(collection.databaseId)
    .container(collection.id())
    .item(documentId.id(), partitionKey)
    .read()
    .then(response => response.resource);
}

export function deleteDocument(collection: ViewModels.CollectionBase, documentId: DocumentId): Promise<any> {
  const partitionKey = documentId.partitionKeyValue;

  return client()
    .database(collection.databaseId)
    .container(collection.id())
    .item(documentId.id(), partitionKey)
    .delete();
}

export function deleteConflict(
  collection: ViewModels.CollectionBase,
  conflictId: ConflictId,
  options: any = {}
): Promise<any> {
  options.partitionKey = options.partitionKey || getPartitionKeyHeaderForConflict(conflictId);

  return client()
    .database(collection.databaseId)
    .container(collection.id())
    .conflict(conflictId.id())
    .delete(options);
}

export async function refreshCachedOffers(): Promise<void> {
  if (configContext.platform === Platform.Portal) {
    sendCachedDataMessage(MessageTypes.RefreshOffers, []);
  }
}

export async function refreshCachedResources(options?: any): Promise<void> {
  if (configContext.platform === Platform.Portal) {
    sendCachedDataMessage(MessageTypes.RefreshResources, []);
  }
}

export async function queryConflicts(
  databaseId: string,
  containerId: string,
  query: string,
  options: any
): Promise<QueryIterator<ConflictDefinition & Resource>> {
  return client()
    .database(databaseId)
    .container(containerId)
    .conflicts.query(query, options);
}
