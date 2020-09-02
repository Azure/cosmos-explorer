import * as _ from "underscore";
import * as Constants from "./Constants";
import * as DataModels from "../Contracts/DataModels";
import * as HeadersUtility from "./HeadersUtility";
import * as ViewModels from "../Contracts/ViewModels";
import Q from "q";
import {
  ConflictDefinition,
  FeedOptions,
  ItemDefinition,
  QueryIterator,
  Resource,
  TriggerDefinition,
  OfferDefinition
} from "@azure/cosmos";
import { client } from "./CosmosClient";
import { LocalStorageUtility, StorageKey } from "../Shared/StorageUtility";
import { sendCachedDataMessage } from "./MessageHandler";
import { MessageTypes } from "../Contracts/ExplorerContracts";
import { OfferUtils } from "../Utils/OfferUtils";
import { RequestOptions } from "@azure/cosmos/dist-esm";
import StoredProcedure from "../Explorer/Tree/StoredProcedure";
import { Platform, configContext } from "../ConfigContext";
import DocumentId from "../Explorer/Tree/DocumentId";
import ConflictId from "../Explorer/Tree/ConflictId";

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

export function queryDocuments(
  databaseId: string,
  containerId: string,
  query: string,
  options: any
): Q.Promise<QueryIterator<ItemDefinition & Resource>> {
  options = getCommonQueryOptions(options);
  const documentsIterator = client()
    .database(databaseId)
    .container(containerId)
    .items.query(query, options);
  return Q(documentsIterator);
}

export function readStoredProcedures(
  collection: ViewModels.Collection,
  options?: any
): Q.Promise<DataModels.StoredProcedure[]> {
  return Q(
    client()
      .database(collection.databaseId)
      .container(collection.id())
      .scripts.storedProcedures.readAll(options)
      .fetchAll()
      .then(response => response.resources as DataModels.StoredProcedure[])
  );
}

export function readStoredProcedure(
  collection: ViewModels.Collection,
  requestedResource: DataModels.Resource,
  options?: any
): Q.Promise<DataModels.StoredProcedure> {
  return Q(
    client()
      .database(collection.databaseId)
      .container(collection.id())
      .scripts.storedProcedure(requestedResource.id)
      .read(options)
      .then(response => response.resource as DataModels.StoredProcedure)
  );
}
export function readUserDefinedFunctions(
  collection: ViewModels.Collection,
  options: any
): Q.Promise<DataModels.UserDefinedFunction[]> {
  return Q(
    client()
      .database(collection.databaseId)
      .container(collection.id())
      .scripts.userDefinedFunctions.readAll(options)
      .fetchAll()
      .then(response => response.resources as DataModels.UserDefinedFunction[])
  );
}
export function readUserDefinedFunction(
  collection: ViewModels.Collection,
  requestedResource: DataModels.Resource,
  options?: any
): Q.Promise<DataModels.UserDefinedFunction> {
  return Q(
    client()
      .database(collection.databaseId)
      .container(collection.id())
      .scripts.userDefinedFunction(requestedResource.id)
      .read(options)
      .then(response => response.resource as DataModels.UserDefinedFunction)
  );
}

export function readTriggers(collection: ViewModels.Collection, options: any): Q.Promise<DataModels.Trigger[]> {
  return Q(
    client()
      .database(collection.databaseId)
      .container(collection.id())
      .scripts.triggers.readAll(options)
      .fetchAll()
      .then(response => response.resources as DataModels.Trigger[])
  );
}

export function readTrigger(
  collection: ViewModels.Collection,
  requestedResource: DataModels.Resource,
  options?: any
): Q.Promise<DataModels.Trigger> {
  return Q(
    client()
      .database(collection.databaseId)
      .container(collection.id())
      .scripts.trigger(requestedResource.id)
      .read(options)
      .then(response => response.resource as DataModels.Trigger)
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

export function updateOffer(
  offer: DataModels.Offer,
  newOffer: DataModels.Offer,
  options?: RequestOptions
): Q.Promise<DataModels.Offer> {
  return Q(
    client()
      .offer(offer.id)
      // TODO Remove casting when SDK types are fixed (https://github.com/Azure/azure-sdk-for-js/issues/10660)
      .replace((newOffer as unknown) as OfferDefinition, options)
      .then(response => {
        return Promise.all([refreshCachedOffers(), refreshCachedResources()]).then(() => response.resource);
      })
  );
}

export function updateStoredProcedure(
  collection: ViewModels.Collection,
  storedProcedure: DataModels.StoredProcedure,
  options: any
): Q.Promise<DataModels.StoredProcedure> {
  return Q(
    client()
      .database(collection.databaseId)
      .container(collection.id())
      .scripts.storedProcedure(storedProcedure.id)
      .replace(storedProcedure, options)
      .then(response => response.resource as DataModels.StoredProcedure)
  );
}

export function updateUserDefinedFunction(
  collection: ViewModels.Collection,
  userDefinedFunction: DataModels.UserDefinedFunction,
  options?: any
): Q.Promise<DataModels.UserDefinedFunction> {
  return Q(
    client()
      .database(collection.databaseId)
      .container(collection.id())
      .scripts.userDefinedFunction(userDefinedFunction.id)
      .replace(userDefinedFunction, options)
      .then(response => response.resource as DataModels.StoredProcedure)
  );
}

export function updateTrigger(
  collection: ViewModels.Collection,
  trigger: DataModels.Trigger,
  options?: any
): Q.Promise<DataModels.Trigger> {
  return Q(
    client()
      .database(collection.databaseId)
      .container(collection.id())
      .scripts.trigger(trigger.id)
      .replace(trigger as TriggerDefinition, options)
      .then(response => response.resource as DataModels.Trigger)
  );
}

export function createDocument(collection: ViewModels.CollectionBase, newDocument: any): Q.Promise<any> {
  return Q(
    client()
      .database(collection.databaseId)
      .container(collection.id())
      .items.create(newDocument)
      .then(response => response.resource as DataModels.StoredProcedure)
  );
}

export function createStoredProcedure(
  collection: ViewModels.Collection,
  newStoredProcedure: DataModels.StoredProcedure,
  options?: any
): Q.Promise<DataModels.StoredProcedure> {
  return Q(
    client()
      .database(collection.databaseId)
      .container(collection.id())
      .scripts.storedProcedures.create(newStoredProcedure, options)
      .then(response => response.resource as DataModels.StoredProcedure)
  );
}

export function createUserDefinedFunction(
  collection: ViewModels.Collection,
  newUserDefinedFunction: DataModels.UserDefinedFunction,
  options: any
): Q.Promise<DataModels.UserDefinedFunction> {
  return Q(
    client()
      .database(collection.databaseId)
      .container(collection.id())
      .scripts.userDefinedFunctions.create(newUserDefinedFunction, options)
      .then(response => response.resource as DataModels.UserDefinedFunction)
  );
}

export function createTrigger(
  collection: ViewModels.Collection,
  newTrigger: DataModels.Trigger,
  options?: any
): Q.Promise<DataModels.Trigger> {
  return Q(
    client()
      .database(collection.databaseId)
      .container(collection.id())
      .scripts.triggers.create(newTrigger as TriggerDefinition, options)
      .then(response => response.resource as DataModels.Trigger)
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

export function deleteStoredProcedure(
  collection: ViewModels.Collection,
  storedProcedure: DataModels.StoredProcedure,
  options: any
): Q.Promise<any> {
  return Q(
    client()
      .database(collection.databaseId)
      .container(collection.id())
      .scripts.storedProcedure(storedProcedure.id)
      .delete()
  );
}

export function deleteUserDefinedFunction(
  collection: ViewModels.Collection,
  userDefinedFunction: DataModels.UserDefinedFunction,
  options: any
): Q.Promise<any> {
  return Q(
    client()
      .database(collection.databaseId)
      .container(collection.id())
      .scripts.userDefinedFunction(userDefinedFunction.id)
      .delete()
  );
}

export function deleteTrigger(
  collection: ViewModels.Collection,
  trigger: DataModels.Trigger,
  options: any
): Q.Promise<any> {
  return Q(
    client()
      .database(collection.databaseId)
      .container(collection.id())
      .scripts.trigger(trigger.id)
      .delete()
  );
}

export function readCollectionQuotaInfo(
  collection: ViewModels.Collection,
  options: any
): Q.Promise<DataModels.CollectionQuotaInfo> {
  options = options || {};
  options.populateQuotaInfo = true;
  options.initialHeaders = options.initialHeaders || {};
  options.initialHeaders[Constants.HttpHeaders.populatePartitionStatistics] = true;

  return Q(
    client()
      .database(collection.databaseId)
      .container(collection.id())
      .read(options)
      // TODO any needed because SDK does not properly type response.resource.statistics
      .then((response: any) => {
        let quota: DataModels.CollectionQuotaInfo = HeadersUtility.getQuota(response.headers);
        quota["usageSizeInKB"] = response.resource.statistics.reduce(
          (
            previousValue: number,
            currentValue: DataModels.Statistic,
            currentIndex: number,
            array: DataModels.Statistic[]
          ) => {
            return previousValue + currentValue.sizeInKB;
          },
          0
        );
        quota["numPartitions"] = response.resource.statistics.length;
        quota["uniqueKeyPolicy"] = collection.uniqueKeyPolicy; // TODO: Remove after refactoring (#119617)
        return quota;
      })
  );
}

export function readOffers(options: any): Q.Promise<DataModels.Offer[]> {
  if (options.isServerless) {
    return Q([]); // Reading offers is not supported for serverless accounts
  }

  try {
    if (configContext.platform === Platform.Portal) {
      return sendCachedDataMessage<DataModels.Offer[]>(MessageTypes.AllOffers, [
        (<any>window).dataExplorer.databaseAccount().id,
        Constants.ClientDefaults.portalCacheTimeoutMs
      ]);
    }
  } catch (error) {
    // If error getting cached Offers, continue on and read via SDK
  }
  return Q(
    client()
      .offers.readAll()
      .fetchAll()
      .then(response => response.resources)
      .catch(error => {
        // This should be removed when we can correctly identify if an account is serverless when connected using connection string too.
        if (error.message.includes("Reading or replacing offers is not supported for serverless accounts")) {
          return [];
        }
        throw error;
      })
  );
}

export function readOffer(requestedResource: DataModels.Offer, options: any): Q.Promise<DataModels.OfferWithHeaders> {
  options = options || {};
  options.initialHeaders = options.initialHeaders || {};
  if (!OfferUtils.isOfferV1(requestedResource)) {
    options.initialHeaders[Constants.HttpHeaders.populateCollectionThroughputInfo] = true;
  }

  return Q(
    client()
      .offer(requestedResource.id)
      .read(options)
      .then(response => ({ ...response.resource, headers: response.headers }))
  );
}

export function refreshCachedOffers(): Q.Promise<void> {
  if (configContext.platform === Platform.Portal) {
    return sendCachedDataMessage(MessageTypes.RefreshOffers, []);
  } else {
    return Q();
  }
}

export function refreshCachedResources(options?: any): Q.Promise<void> {
  if (configContext.platform === Platform.Portal) {
    return sendCachedDataMessage(MessageTypes.RefreshResources, []);
  } else {
    return Q();
  }
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
