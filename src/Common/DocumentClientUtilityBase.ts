import { ConflictDefinition, ItemDefinition, QueryIterator, Resource } from "@azure/cosmos";
import Q from "q";
import * as ViewModels from "../Contracts/ViewModels";
import ConflictId from "../Explorer/Tree/ConflictId";
import DocumentId from "../Explorer/Tree/DocumentId";
import StoredProcedure from "../Explorer/Tree/StoredProcedure";
import { logConsoleInfo, logConsoleProgress } from "../Utils/NotificationConsoleUtils";
import * as Constants from "./Constants";
import * as DataAccessUtilityBase from "./DataAccessUtilityBase";
import { MinimalQueryIterator, nextPage } from "./IteratorUtilities";
import { handleError } from "./ErrorHandlingUtils";

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
        handleError(
          error,
          "ExecuteStoredProcedure",
          `Failed to execute stored procedure ${storedProcedure.id()} for container ${storedProcedure.collection.id()}`
        );
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
        handleError(error, "QueryDocumentsPage", `Failed to query ${entityName} for container ${resourceName}`);
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
        handleError(error, "ReadDocument", `Failed to read ${entityName} ${documentId.id()}`);
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
        handleError(error, "UpdateDocument", `Failed to update ${entityName} ${documentId.id()}`);
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
        handleError(error, "CreateDocument", `Error while creating new ${entityName} for container ${collection.id()}`);
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
        handleError(error, "DeleteDocument", `Error while deleting ${entityName} ${documentId.id()}`);
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
        handleError(error, "DeleteConflict", `Error while deleting conflict ${conflictId.id()}`);
        deferred.reject(error);
      }
    )
    .finally(() => {
      clearMessage();
    });

  return deferred.promise;
}
