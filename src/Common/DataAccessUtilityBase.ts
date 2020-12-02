import { ConflictDefinition, QueryIterator, Resource } from "@azure/cosmos";
import Q from "q";
import * as DataModels from "../Contracts/DataModels";
import * as ViewModels from "../Contracts/ViewModels";
import ConflictId from "../Explorer/Tree/ConflictId";
import DocumentId from "../Explorer/Tree/DocumentId";
import StoredProcedure from "../Explorer/Tree/StoredProcedure";
import * as Constants from "./Constants";
import { client } from "./CosmosClient";

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
): Q.Promise<any> {
  const partitionKey = documentId.partitionKeyValue;

  return Q(
    client()
      .database(collection.databaseId)
      .container(collection.id())
      .item(documentId.id(), partitionKey)
      .replace(newDocument)
      .then(response => response.resource)
  );
}

export function executeStoredProcedure(
  collection: ViewModels.Collection,
  storedProcedure: StoredProcedure,
  partitionKeyValue: any,
  params: any[]
): Q.Promise<any> {
  // TODO remove this deferred. Kept it because of timeout code at bottom of function
  const deferred = Q.defer<any>();

  client()
    .database(collection.databaseId)
    .container(collection.id())
    .scripts.storedProcedure(storedProcedure.id())
    .execute(partitionKeyValue, params, { enableScriptLogging: true })
    .then(response =>
      deferred.resolve({
        result: response.resource,
        scriptLogs: response.headers[Constants.HttpHeaders.scriptLogResults]
      })
    )
    .catch(error => deferred.reject(error));

  return deferred.promise.timeout(
    Constants.ClientDefaults.requestTimeoutMs,
    `Request timed out while executing stored procedure ${storedProcedure.id()}`
  );
}

export function createDocument(collection: ViewModels.CollectionBase, newDocument: any): Q.Promise<any> {
  return Q(
    client()
      .database(collection.databaseId)
      .container(collection.id())
      .items.create(newDocument)
      .then(response => response.resource)
  );
}

export function readDocument(collection: ViewModels.CollectionBase, documentId: DocumentId): Q.Promise<any> {
  const partitionKey = documentId.partitionKeyValue;

  return Q(
    client()
      .database(collection.databaseId)
      .container(collection.id())
      .item(documentId.id(), partitionKey)
      .read()
      .then(response => response.resource)
  );
}

export function deleteDocument(collection: ViewModels.CollectionBase, documentId: DocumentId): Q.Promise<any> {
  const partitionKey = documentId.partitionKeyValue;

  return Q(
    client()
      .database(collection.databaseId)
      .container(collection.id())
      .item(documentId.id(), partitionKey)
      .delete()
  );
}

export function deleteConflict(
  collection: ViewModels.CollectionBase,
  conflictId: ConflictId,
  options: any = {}
): Q.Promise<any> {
  options.partitionKey = options.partitionKey || getPartitionKeyHeaderForConflict(conflictId);

  return Q(
    client()
      .database(collection.databaseId)
      .container(collection.id())
      .conflict(conflictId.id())
      .delete(options)
  );
}

export function queryConflicts(
  databaseId: string,
  containerId: string,
  query: string,
  options: any
): Q.Promise<QueryIterator<ConflictDefinition & Resource>> {
  const documentsIterator = client()
    .database(databaseId)
    .container(containerId)
    .conflicts.query(query, options);
  return Q(documentsIterator);
}
