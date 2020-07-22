import * as _ from "underscore";
import * as Constants from "./Constants";
import * as DataModels from "../Contracts/DataModels";
import * as HeadersUtility from "./HeadersUtility";
import * as ViewModels from "../Contracts/ViewModels";
import Q from "q";
import {
  ConflictDefinition,
  ContainerDefinition,
  ContainerResponse,
  DatabaseResponse,
  FeedOptions,
  ItemDefinition,
  PartitionKeyDefinition,
  QueryIterator,
  Resource,
  TriggerDefinition
} from "@azure/cosmos";
import { ContainerRequest } from "@azure/cosmos/dist-esm/client/Container/ContainerRequest";
import { CosmosClient } from "./CosmosClient";
import { DatabaseRequest } from "@azure/cosmos/dist-esm/client/Database/DatabaseRequest";
import { LocalStorageUtility, StorageKey } from "../Shared/StorageUtility";
import { MessageHandler } from "./MessageHandler";
import { MessageTypes } from "../Contracts/ExplorerContracts";
import { OfferUtils } from "../Utils/OfferUtils";
import { RequestOptions } from "@azure/cosmos/dist-esm";
import StoredProcedure from "../Explorer/Tree/StoredProcedure";

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

// TODO: Add timeout for all promises
export abstract class DataAccessUtilityBase {
  public queryDocuments(
    databaseId: string,
    containerId: string,
    query: string,
    options: any
  ): Q.Promise<QueryIterator<ItemDefinition & Resource>> {
    options = getCommonQueryOptions(options);
    const documentsIterator = CosmosClient.client()
      .database(databaseId)
      .container(containerId)
      .items.query(query, options);
    return Q(documentsIterator);
  }

  public readStoredProcedures(
    collection: ViewModels.Collection,
    options?: any
  ): Q.Promise<DataModels.StoredProcedure[]> {
    return Q(
      CosmosClient.client()
        .database(collection.databaseId)
        .container(collection.id())
        .scripts.storedProcedures.readAll(options)
        .fetchAll()
        .then(response => response.resources as DataModels.StoredProcedure[])
    );
  }

  public readStoredProcedure(
    collection: ViewModels.Collection,
    requestedResource: DataModels.Resource,
    options?: any
  ): Q.Promise<DataModels.StoredProcedure> {
    return Q(
      CosmosClient.client()
        .database(collection.databaseId)
        .container(collection.id())
        .scripts.storedProcedure(requestedResource.id)
        .read(options)
        .then(response => response.resource as DataModels.StoredProcedure)
    );
  }
  public readUserDefinedFunctions(
    collection: ViewModels.Collection,
    options: any
  ): Q.Promise<DataModels.UserDefinedFunction[]> {
    return Q(
      CosmosClient.client()
        .database(collection.databaseId)
        .container(collection.id())
        .scripts.userDefinedFunctions.readAll(options)
        .fetchAll()
        .then(response => response.resources as DataModels.UserDefinedFunction[])
    );
  }
  public readUserDefinedFunction(
    collection: ViewModels.Collection,
    requestedResource: DataModels.Resource,
    options?: any
  ): Q.Promise<DataModels.UserDefinedFunction> {
    return Q(
      CosmosClient.client()
        .database(collection.databaseId)
        .container(collection.id())
        .scripts.userDefinedFunction(requestedResource.id)
        .read(options)
        .then(response => response.resource as DataModels.UserDefinedFunction)
    );
  }

  public readTriggers(collection: ViewModels.Collection, options: any): Q.Promise<DataModels.Trigger[]> {
    return Q(
      CosmosClient.client()
        .database(collection.databaseId)
        .container(collection.id())
        .scripts.triggers.readAll(options)
        .fetchAll()
        .then(response => response.resources as DataModels.Trigger[])
    );
  }

  public readTrigger(
    collection: ViewModels.Collection,
    requestedResource: DataModels.Resource,
    options?: any
  ): Q.Promise<DataModels.Trigger> {
    return Q(
      CosmosClient.client()
        .database(collection.databaseId)
        .container(collection.id())
        .scripts.trigger(requestedResource.id)
        .read(options)
        .then(response => response.resource as DataModels.Trigger)
    );
  }

  public executeStoredProcedure(
    collection: ViewModels.Collection,
    storedProcedure: StoredProcedure,
    partitionKeyValue: any,
    params: any[]
  ): Q.Promise<any> {
    // TODO remove this deferred. Kept it because of timeout code at bottom of function
    const deferred = Q.defer<any>();

    CosmosClient.client()
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

  public readDocument(collection: ViewModels.CollectionBase, documentId: ViewModels.DocumentId): Q.Promise<any> {
    const partitionKey = documentId.partitionKeyValue;

    return Q(
      CosmosClient.client()
        .database(collection.databaseId)
        .container(collection.id())
        .item(documentId.id(), partitionKey)
        .read()
        .then(response => response.resource)
    );
  }

  public getPartitionKeyHeaderForConflict(conflictId: ViewModels.ConflictId): Object {
    const partitionKeyDefinition: DataModels.PartitionKey = conflictId.partitionKey;
    const partitionKeyValue: any = conflictId.partitionKeyValue;

    return this.getPartitionKeyHeader(partitionKeyDefinition, partitionKeyValue);
  }

  public getPartitionKeyHeader(partitionKeyDefinition: DataModels.PartitionKey, partitionKeyValue: any): Object {
    if (!partitionKeyDefinition) {
      return undefined;
    }

    if (partitionKeyValue === undefined) {
      return [{}];
    }

    return [partitionKeyValue];
  }

  public updateCollection(
    databaseId: string,
    collectionId: string,
    newCollection: DataModels.Collection,
    options: any = {}
  ): Q.Promise<DataModels.Collection> {
    return Q(
      CosmosClient.client()
        .database(databaseId)
        .container(collectionId)
        .replace(newCollection as ContainerDefinition, options)
        .then(async (response: ContainerResponse) => {
          return this.refreshCachedResources().then(() => response.resource as DataModels.Collection);
        })
    );
  }

  public updateDocument(
    collection: ViewModels.CollectionBase,
    documentId: ViewModels.DocumentId,
    newDocument: any
  ): Q.Promise<any> {
    const partitionKey = documentId.partitionKeyValue;

    return Q(
      CosmosClient.client()
        .database(collection.databaseId)
        .container(collection.id())
        .item(documentId.id(), partitionKey)
        .replace(newDocument)
        .then(response => response.resource)
    );
  }

  public updateOffer(
    offer: DataModels.Offer,
    newOffer: DataModels.Offer,
    options?: RequestOptions
  ): Q.Promise<DataModels.Offer> {
    return Q(
      CosmosClient.client()
        .offer(offer.id)
        .replace(newOffer, options)
        .then(response => {
          return Promise.all([this.refreshCachedOffers(), this.refreshCachedResources()]).then(() => response.resource);
        })
    );
  }

  public updateStoredProcedure(
    collection: ViewModels.Collection,
    storedProcedure: DataModels.StoredProcedure,
    options: any
  ): Q.Promise<DataModels.StoredProcedure> {
    return Q(
      CosmosClient.client()
        .database(collection.databaseId)
        .container(collection.id())
        .scripts.storedProcedure(storedProcedure.id)
        .replace(storedProcedure, options)
        .then(response => response.resource as DataModels.StoredProcedure)
    );
  }

  public updateUserDefinedFunction(
    collection: ViewModels.Collection,
    userDefinedFunction: DataModels.UserDefinedFunction,
    options?: any
  ): Q.Promise<DataModels.UserDefinedFunction> {
    return Q(
      CosmosClient.client()
        .database(collection.databaseId)
        .container(collection.id())
        .scripts.userDefinedFunction(userDefinedFunction.id)
        .replace(userDefinedFunction, options)
        .then(response => response.resource as DataModels.StoredProcedure)
    );
  }

  public updateTrigger(
    collection: ViewModels.Collection,
    trigger: DataModels.Trigger,
    options?: any
  ): Q.Promise<DataModels.Trigger> {
    return Q(
      CosmosClient.client()
        .database(collection.databaseId)
        .container(collection.id())
        .scripts.trigger(trigger.id)
        .replace(trigger as TriggerDefinition, options)
        .then(response => response.resource as DataModels.Trigger)
    );
  }

  public createDocument(collection: ViewModels.CollectionBase, newDocument: any): Q.Promise<any> {
    return Q(
      CosmosClient.client()
        .database(collection.databaseId)
        .container(collection.id())
        .items.create(newDocument)
        .then(response => response.resource as DataModels.StoredProcedure)
    );
  }

  public createStoredProcedure(
    collection: ViewModels.Collection,
    newStoredProcedure: DataModels.StoredProcedure,
    options?: any
  ): Q.Promise<DataModels.StoredProcedure> {
    return Q(
      CosmosClient.client()
        .database(collection.databaseId)
        .container(collection.id())
        .scripts.storedProcedures.create(newStoredProcedure, options)
        .then(response => response.resource as DataModels.StoredProcedure)
    );
  }

  public createUserDefinedFunction(
    collection: ViewModels.Collection,
    newUserDefinedFunction: DataModels.UserDefinedFunction,
    options: any
  ): Q.Promise<DataModels.UserDefinedFunction> {
    return Q(
      CosmosClient.client()
        .database(collection.databaseId)
        .container(collection.id())
        .scripts.userDefinedFunctions.create(newUserDefinedFunction, options)
        .then(response => response.resource as DataModels.UserDefinedFunction)
    );
  }

  public createTrigger(
    collection: ViewModels.Collection,
    newTrigger: DataModels.Trigger,
    options?: any
  ): Q.Promise<DataModels.Trigger> {
    return Q(
      CosmosClient.client()
        .database(collection.databaseId)
        .container(collection.id())
        .scripts.triggers.create(newTrigger as TriggerDefinition, options)
        .then(response => response.resource as DataModels.Trigger)
    );
  }

  public deleteDocument(collection: ViewModels.CollectionBase, documentId: ViewModels.DocumentId): Q.Promise<any> {
    const partitionKey = documentId.partitionKeyValue;

    return Q(
      CosmosClient.client()
        .database(collection.databaseId)
        .container(collection.id())
        .item(documentId.id(), partitionKey)
        .delete()
    );
  }

  public deleteConflict(
    collection: ViewModels.CollectionBase,
    conflictId: ViewModels.ConflictId,
    options: any = {}
  ): Q.Promise<any> {
    options.partitionKey = options.partitionKey || this.getPartitionKeyHeaderForConflict(conflictId);

    return Q(
      CosmosClient.client()
        .database(collection.databaseId)
        .container(collection.id())
        .conflict(conflictId.id())
        .delete(options)
    );
  }

  public deleteCollection(collection: ViewModels.Collection, options: any): Q.Promise<any> {
    return Q(
      CosmosClient.client()
        .database(collection.databaseId)
        .container(collection.id())
        .delete()
        .then(() => this.refreshCachedResources())
    );
  }

  public deleteDatabase(database: ViewModels.Database, options: any): Q.Promise<any> {
    return Q(
      CosmosClient.client()
        .database(database.id())
        .delete()
        .then(() => this.refreshCachedResources())
    );
  }

  public deleteStoredProcedure(
    collection: ViewModels.Collection,
    storedProcedure: DataModels.StoredProcedure,
    options: any
  ): Q.Promise<any> {
    return Q(
      CosmosClient.client()
        .database(collection.databaseId)
        .container(collection.id())
        .scripts.storedProcedure(storedProcedure.id)
        .delete()
    );
  }

  public deleteUserDefinedFunction(
    collection: ViewModels.Collection,
    userDefinedFunction: DataModels.UserDefinedFunction,
    options: any
  ): Q.Promise<any> {
    return Q(
      CosmosClient.client()
        .database(collection.databaseId)
        .container(collection.id())
        .scripts.userDefinedFunction(userDefinedFunction.id)
        .delete()
    );
  }

  public deleteTrigger(collection: ViewModels.Collection, trigger: DataModels.Trigger, options: any): Q.Promise<any> {
    return Q(
      CosmosClient.client()
        .database(collection.databaseId)
        .container(collection.id())
        .scripts.trigger(trigger.id)
        .delete()
    );
  }

  public readCollections(database: ViewModels.Database, options: any): Q.Promise<DataModels.Collection[]> {
    return Q(
      CosmosClient.client()
        .database(database.id())
        .containers.readAll()
        .fetchAll()
        .then(response => response.resources as DataModels.Collection[])
    );
  }

  public readCollection(databaseId: string, collectionId: string): Q.Promise<DataModels.Collection> {
    return Q(
      CosmosClient.client()
        .database(databaseId)
        .container(collectionId)
        .read()
        .then(response => response.resource as DataModels.Collection)
    );
  }

  public readCollectionQuotaInfo(
    collection: ViewModels.Collection,
    options: any
  ): Q.Promise<DataModels.CollectionQuotaInfo> {
    options = options || {};
    options.populateQuotaInfo = true;
    options.initialHeaders = options.initialHeaders || {};
    options.initialHeaders[Constants.HttpHeaders.populatePartitionStatistics] = true;

    return Q(
      CosmosClient.client()
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

  public readOffers(options: any): Q.Promise<DataModels.Offer[]> {
    return Q(
      CosmosClient.client()
        .offers.readAll()
        .fetchAll()
        .then(response => response.resources)
    );
  }

  public readOffer(requestedResource: DataModels.Offer, options: any): Q.Promise<DataModels.OfferWithHeaders> {
    options = options || {};
    options.initialHeaders = options.initialHeaders || {};
    if (!OfferUtils.isOfferV1(requestedResource)) {
      options.initialHeaders[Constants.HttpHeaders.populateCollectionThroughputInfo] = true;
    }

    return Q(
      CosmosClient.client()
        .offer(requestedResource.id)
        .read(options)
        .then(response => ({ ...response.resource, headers: response.headers }))
    );
  }

  public readDatabases(options: any): Q.Promise<DataModels.Database[]> {
    return Q(
      CosmosClient.client()
        .databases.readAll()
        .fetchAll()
        .then(response => response.resources as DataModels.Database[])
    );
  }

  public getOrCreateDatabaseAndCollection(
    request: DataModels.CreateDatabaseAndCollectionRequest,
    options: any
  ): Q.Promise<DataModels.Collection> {
    const databaseOptions: any = options && _.omit(options, "sharedOfferThroughput");
    const {
      databaseId,
      databaseLevelThroughput,
      collectionId,
      partitionKey,
      indexingPolicy,
      uniqueKeyPolicy,
      offerThroughput,
      analyticalStorageTtl,
      hasAutoPilotV2FeatureFlag
    } = request;

    const createBody: DatabaseRequest = {
      id: databaseId
    };

    // TODO: replace when SDK support autopilot
    const initialHeaders = request.autoPilot
      ? !hasAutoPilotV2FeatureFlag
        ? {
            [Constants.HttpHeaders.autoPilotThroughputSDK]: JSON.stringify({
              maxThroughput: request.autoPilot.maxThroughput
            })
          }
        : {
            [Constants.HttpHeaders.autoPilotTier]: request.autoPilot.autopilotTier
          }
      : undefined;
    if (databaseLevelThroughput) {
      if (request.autoPilot) {
        databaseOptions.initialHeaders = initialHeaders;
      }
      createBody.throughput = offerThroughput;
    }

    return Q(
      CosmosClient.client()
        .databases.createIfNotExists(createBody, databaseOptions)
        .then(response => {
          return response.database.containers.create(
            {
              id: collectionId,
              partitionKey: (partitionKey || undefined) as PartitionKeyDefinition,
              indexingPolicy: indexingPolicy ? indexingPolicy : undefined,
              uniqueKeyPolicy: uniqueKeyPolicy ? uniqueKeyPolicy : undefined,
              analyticalStorageTtl: analyticalStorageTtl,
              throughput: databaseLevelThroughput || request.autoPilot ? undefined : offerThroughput
            } as ContainerRequest, // TODO: remove cast when https://github.com/Azure/azure-cosmos-js/issues/423 is fixed
            {
              initialHeaders: databaseLevelThroughput ? undefined : initialHeaders
            }
          );
        })
        .then(containerResponse => containerResponse.resource as DataModels.Collection)
        .finally(() => this.refreshCachedResources(options))
    );
  }

  public createDatabase(request: DataModels.CreateDatabaseRequest, options: any): Q.Promise<DataModels.Database> {
    var deferred = Q.defer<DataModels.Database>();

    this._createDatabase(request, options).then(
      (createdDatabase: DataModels.Database) => {
        this.refreshCachedOffers().then(() => {
          deferred.resolve(createdDatabase);
        });
      },
      _createDatabaseError => {
        deferred.reject(_createDatabaseError);
      }
    );

    return deferred.promise;
  }

  public refreshCachedOffers(): Q.Promise<void> {
    if (MessageHandler.canSendMessage()) {
      return MessageHandler.sendCachedDataMessage(MessageTypes.RefreshOffers, []);
    } else {
      return Q();
    }
  }

  public refreshCachedResources(options?: any): Q.Promise<void> {
    if (MessageHandler.canSendMessage()) {
      return MessageHandler.sendCachedDataMessage(MessageTypes.RefreshResources, []);
    } else {
      return Q();
    }
  }

  public readSubscription(subscriptionId: string, options: any): Q.Promise<DataModels.Subscription> {
    throw new Error("Read subscription not supported on this platform");
  }

  public readSubscriptionDefaults(subscriptionId: string, quotaId: string, options: any): Q.Promise<string> {
    throw new Error("Read subscription defaults not supported on this platform");
  }

  public queryConflicts(
    databaseId: string,
    containerId: string,
    query: string,
    options: any
  ): Q.Promise<QueryIterator<ConflictDefinition & Resource>> {
    const documentsIterator = CosmosClient.client()
      .database(databaseId)
      .container(containerId)
      .conflicts.query(query, options);
    return Q(documentsIterator);
  }

  public updateOfferThroughputBeyondLimit(
    request: DataModels.UpdateOfferThroughputRequest,
    options: any
  ): Q.Promise<void> {
    throw new Error("Updating throughput beyond specified limit is not supported on this platform");
  }

  private _createDatabase(
    request: DataModels.CreateDatabaseRequest,
    options: any = {}
  ): Q.Promise<DataModels.Database> {
    const { databaseId, databaseLevelThroughput, offerThroughput, autoPilot, hasAutoPilotV2FeatureFlag } = request;
    const createBody: DatabaseRequest = { id: databaseId };
    const databaseOptions: any = options && _.omit(options, "sharedOfferThroughput");
    // TODO: replace when SDK support autopilot
    const initialHeaders = autoPilot
      ? !hasAutoPilotV2FeatureFlag
        ? {
            [Constants.HttpHeaders.autoPilotThroughputSDK]: JSON.stringify({ maxThroughput: autoPilot.maxThroughput })
          }
        : {
            [Constants.HttpHeaders.autoPilotTier]: autoPilot.autopilotTier
          }
      : undefined;
    if (!!databaseLevelThroughput) {
      if (autoPilot) {
        databaseOptions.initialHeaders = initialHeaders;
      }
      createBody.throughput = offerThroughput;
    }

    return Q(
      CosmosClient.client()
        .databases.create(createBody, databaseOptions)
        .then((response: DatabaseResponse) => {
          return this.refreshCachedResources(databaseOptions).then(() => response.resource);
        })
    );
  }
}
