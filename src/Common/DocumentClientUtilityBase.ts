import { ConflictDefinition, ItemDefinition, QueryIterator, Resource } from "@azure/cosmos";
import { RequestOptions } from "@azure/cosmos/dist-esm";
import Q from "q";
import * as DataModels from "../Contracts/DataModels";
import * as ViewModels from "../Contracts/ViewModels";
import ConflictId from "../Explorer/Tree/ConflictId";
import DocumentId from "../Explorer/Tree/DocumentId";
import StoredProcedure from "../Explorer/Tree/StoredProcedure";
import { logConsoleError, logConsoleInfo, logConsoleProgress } from "../Utils/NotificationConsoleUtils";
import * as Constants from "./Constants";
import { sendNotificationForError } from "./dataAccess/sendNotificationForError";
import * as DataAccessUtilityBase from "./DataAccessUtilityBase";
import { MinimalQueryIterator, nextPage } from "./IteratorUtilities";
import * as Logger from "./Logger";

// TODO: Log all promise resolutions and errors with verbosity levels
export function queryDocuments(
  databaseId: string,
  containerId: string,
  query: string,
  options: any
): Q.Promise<QueryIterator<ItemDefinition & Resource>> {
  return DataAccessUtilityBase.queryDocuments(databaseId, containerId, query, options);
}

export function queryConflicts(
  databaseId: string,
  containerId: string,
  query: string,
  options: any
): Q.Promise<QueryIterator<ConflictDefinition & Resource>> {
  return DataAccessUtilityBase.queryConflicts(databaseId, containerId, query, options);
}

export function getEntityName() {
  const defaultExperience =
    window.dataExplorer && window.dataExplorer.defaultExperience && window.dataExplorer.defaultExperience();
  if (defaultExperience === Constants.DefaultAccountExperience.MongoDB) {
    return "document";
  }
  return "item";
}

export function executeStoredProcedure(
  collection: ViewModels.Collection,
  storedProcedure: StoredProcedure,
  partitionKeyValue: any,
  params: any[]
): Q.Promise<any> {
  var deferred = Q.defer<any>();

  const clearMessage = logConsoleProgress(`Executing stored procedure ${storedProcedure.id()}`);
  DataAccessUtilityBase.executeStoredProcedure(collection, storedProcedure, partitionKeyValue, params)
    .then(
      (response: any) => {
        deferred.resolve(response);
        logConsoleInfo(
          `Finished executing stored procedure ${storedProcedure.id()} for container ${storedProcedure.collection.id()}`
        );
      },
      (error: any) => {
        logConsoleError(
          `Failed to execute stored procedure ${storedProcedure.id()} for container ${storedProcedure.collection.id()}: ${JSON.stringify(
            error
          )}`
        );
        Logger.logError(JSON.stringify(error), "ExecuteStoredProcedure", error.code);
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => {
      clearMessage();
    });

  return deferred.promise;
}

export function queryDocumentsPage(
  resourceName: string,
  documentsIterator: MinimalQueryIterator,
  firstItemIndex: number,
  options: any
): Q.Promise<ViewModels.QueryResults> {
  var deferred = Q.defer<ViewModels.QueryResults>();
  const entityName = getEntityName();
  const clearMessage = logConsoleProgress(`Querying ${entityName} for container ${resourceName}`);
  Q(nextPage(documentsIterator, firstItemIndex))
    .then(
      (result: ViewModels.QueryResults) => {
        const itemCount = (result.documents && result.documents.length) || 0;
        logConsoleInfo(`Successfully fetched ${itemCount} ${entityName} for container ${resourceName}`);
        deferred.resolve(result);
      },
      (error: any) => {
        logConsoleError(`Failed to query ${entityName} for container ${resourceName}: ${JSON.stringify(error)}`);
        Logger.logError(JSON.stringify(error), "QueryDocumentsPage", error.code);
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => {
      clearMessage();
    });

  return deferred.promise;
}

export function readDocument(collection: ViewModels.CollectionBase, documentId: DocumentId): Q.Promise<any> {
  var deferred = Q.defer<any>();
  const entityName = getEntityName();
  const clearMessage = logConsoleProgress(`Reading ${entityName} ${documentId.id()}`);
  DataAccessUtilityBase.readDocument(collection, documentId)
    .then(
      (document: any) => {
        deferred.resolve(document);
      },
      (error: any) => {
        logConsoleError(`Failed to read ${entityName} ${documentId.id()}: ${JSON.stringify(error)}`);
        Logger.logError(JSON.stringify(error), "ReadDocument", error.code);
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => {
      clearMessage();
    });

  return deferred.promise;
}

export function updateDocument(
  collection: ViewModels.CollectionBase,
  documentId: DocumentId,
  newDocument: any
): Q.Promise<any> {
  var deferred = Q.defer<any>();
  const entityName = getEntityName();
  const clearMessage = logConsoleProgress(`Updating ${entityName} ${documentId.id()}`);
  DataAccessUtilityBase.updateDocument(collection, documentId, newDocument)
    .then(
      (updatedDocument: any) => {
        logConsoleInfo(`Successfully updated ${entityName} ${documentId.id()}`);
        deferred.resolve(updatedDocument);
      },
      (error: any) => {
        logConsoleError(`Failed to update ${entityName} ${documentId.id()}: ${JSON.stringify(error)}`);
        Logger.logError(JSON.stringify(error), "UpdateDocument", error.code);
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => {
      clearMessage();
    });

  return deferred.promise;
}

export function updateOffer(
  offer: DataModels.Offer,
  newOffer: DataModels.Offer,
  options: RequestOptions
): Q.Promise<DataModels.Offer> {
  var deferred = Q.defer<any>();
  const clearMessage = logConsoleProgress(`Updating offer for resource ${offer.resource}`);
  DataAccessUtilityBase.updateOffer(offer, newOffer, options)
    .then(
      (replacedOffer: DataModels.Offer) => {
        logConsoleInfo(`Successfully updated offer for resource ${offer.resource}`);
        deferred.resolve(replacedOffer);
      },
      (error: any) => {
        logConsoleError(`Error updating offer for resource ${offer.resource}: ${JSON.stringify(error)}`);
        Logger.logError(
          JSON.stringify({
            oldOffer: offer,
            newOffer: newOffer,
            error: error
          }),
          "UpdateOffer",
          error.code
        );
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => {
      clearMessage();
    });

  return deferred.promise;
}

export function createDocument(collection: ViewModels.CollectionBase, newDocument: any): Q.Promise<any> {
  var deferred = Q.defer<any>();
  const entityName = getEntityName();
  const clearMessage = logConsoleProgress(`Creating new ${entityName} for container ${collection.id()}`);
  DataAccessUtilityBase.createDocument(collection, newDocument)
    .then(
      (savedDocument: any) => {
        logConsoleInfo(`Successfully created new ${entityName} for container ${collection.id()}`);
        deferred.resolve(savedDocument);
      },
      (error: any) => {
        logConsoleError(
          `Error while creating new ${entityName} for container ${collection.id()}:\n ${JSON.stringify(error)}`
        );
        Logger.logError(JSON.stringify(error), "CreateDocument", error.code);
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => {
      clearMessage();
    });

  return deferred.promise;
}

export function deleteDocument(collection: ViewModels.CollectionBase, documentId: DocumentId): Q.Promise<any> {
  var deferred = Q.defer<any>();
  const entityName = getEntityName();
  const clearMessage = logConsoleProgress(`Deleting ${entityName} ${documentId.id()}`);
  DataAccessUtilityBase.deleteDocument(collection, documentId)
    .then(
      (response: any) => {
        logConsoleInfo(`Successfully deleted ${entityName} ${documentId.id()}`);
        deferred.resolve(response);
      },
      (error: any) => {
        logConsoleError(`Error while deleting ${entityName} ${documentId.id()}:\n ${JSON.stringify(error)}`);
        Logger.logError(JSON.stringify(error), "DeleteDocument", error.code);
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => {
      clearMessage();
    });

  return deferred.promise;
}

export function deleteConflict(
  collection: ViewModels.CollectionBase,
  conflictId: ConflictId,
  options?: any
): Q.Promise<any> {
  var deferred = Q.defer<any>();

  const clearMessage = logConsoleProgress(`Deleting conflict ${conflictId.id()}`);
  DataAccessUtilityBase.deleteConflict(collection, conflictId, options)
    .then(
      (response: any) => {
        logConsoleInfo(`Successfully deleted conflict ${conflictId.id()}`);
        deferred.resolve(response);
      },
      (error: any) => {
        logConsoleError(`Error while deleting conflict ${conflictId.id()}:\n ${JSON.stringify(error)}`);
        Logger.logError(JSON.stringify(error), "DeleteConflict", error.code);
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => {
      clearMessage();
    });

  return deferred.promise;
}

export function refreshCachedResources(options: any = {}): Q.Promise<void> {
  return DataAccessUtilityBase.refreshCachedResources(options);
}

export function refreshCachedOffers(): Q.Promise<void> {
  return DataAccessUtilityBase.refreshCachedOffers();
}
