import { ConflictDefinition, ItemDefinition, QueryIterator, Resource } from "@azure/cosmos";
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
): Promise<QueryIterator<ItemDefinition & Resource>> {
  return DataAccessUtilityBase.queryDocuments(databaseId, containerId, query, options);
}

export function queryConflicts(
  databaseId: string,
  containerId: string,
  query: string,
  options: any
): Promise<QueryIterator<ConflictDefinition & Resource>> {
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
): Promise<any> {
  const clearMessage = logConsoleProgress(`Executing stored procedure ${storedProcedure.id()}`);
  return DataAccessUtilityBase.executeStoredProcedure(collection, storedProcedure, partitionKeyValue, params)
    .then(
      (response: any) => {
        logConsoleInfo(
          `Finished executing stored procedure ${storedProcedure.id()} for container ${storedProcedure.collection.id()}`
        );
        return response;
      },
      (error: any) => {
        handleError(
          error,
          `Failed to execute stored procedure ${storedProcedure.id()} for container ${storedProcedure.collection.id()}`,
          "ExecuteStoredProcedure"
        );
        throw error;
      }
    )
    .finally(clearMessage);
}

export function queryDocumentsPage(
  resourceName: string,
  documentsIterator: MinimalQueryIterator,
  firstItemIndex: number,
  options: any
): Promise<ViewModels.QueryResults> {
  const entityName = getEntityName();
  const clearMessage = logConsoleProgress(`Querying ${entityName} for container ${resourceName}`);
  return nextPage(documentsIterator, firstItemIndex)
    .then(
      (result: ViewModels.QueryResults) => {
        const itemCount = (result.documents && result.documents.length) || 0;
        logConsoleInfo(`Successfully fetched ${itemCount} ${entityName} for container ${resourceName}`);
        return result;
      },
      (error: any) => {
        handleError(error, `Failed to query ${entityName} for container ${resourceName}`, "QueryDocumentsPage");
        throw error;
      }
    )
    .finally(clearMessage);
}

export function readDocument(collection: ViewModels.CollectionBase, documentId: DocumentId): Promise<any> {
  const entityName = getEntityName();
  const clearMessage = logConsoleProgress(`Reading ${entityName} ${documentId.id()}`);
  return DataAccessUtilityBase.readDocument(collection, documentId)
    .catch((error: any) => {
      handleError(error, `Failed to read ${entityName} ${documentId.id()}`, "ReadDocument");
      throw error;
    })
    .finally(clearMessage);
}

export function updateDocument(
  collection: ViewModels.CollectionBase,
  documentId: DocumentId,
  newDocument: any
): Promise<any> {
  const entityName = getEntityName();
  const clearMessage = logConsoleProgress(`Updating ${entityName} ${documentId.id()}`);
  return DataAccessUtilityBase.updateDocument(collection, documentId, newDocument)
    .then(
      (updatedDocument: any) => {
        logConsoleInfo(`Successfully updated ${entityName} ${documentId.id()}`);
        return updatedDocument;
      },
      (error: any) => {
        handleError(error, `Failed to update ${entityName} ${documentId.id()}`, "UpdateDocument");
        throw error;
      }
    )
    .finally(clearMessage);
}

export function createDocument(collection: ViewModels.CollectionBase, newDocument: any): Promise<any> {
  const entityName = getEntityName();
  const clearMessage = logConsoleProgress(`Creating new ${entityName} for container ${collection.id()}`);
  return DataAccessUtilityBase.createDocument(collection, newDocument)
    .then(
      (savedDocument: any) => {
        logConsoleInfo(`Successfully created new ${entityName} for container ${collection.id()}`);
        return savedDocument;
      },
      (error: any) => {
        handleError(error, `Error while creating new ${entityName} for container ${collection.id()}`, "CreateDocument");
        throw error;
      }
    )
    .finally(clearMessage);
}

export function deleteDocument(collection: ViewModels.CollectionBase, documentId: DocumentId): Promise<any> {
  const entityName = getEntityName();
  const clearMessage = logConsoleProgress(`Deleting ${entityName} ${documentId.id()}`);
  return DataAccessUtilityBase.deleteDocument(collection, documentId)
    .then(
      (response: any) => {
        logConsoleInfo(`Successfully deleted ${entityName} ${documentId.id()}`);
        return response;
      },
      (error: any) => {
        handleError(error, `Error while deleting ${entityName} ${documentId.id()}`, "DeleteDocument");
        throw error;
      }
    )
    .finally(clearMessage);
}

export function deleteConflict(
  collection: ViewModels.CollectionBase,
  conflictId: ConflictId,
  options?: any
): Promise<any> {
  const clearMessage = logConsoleProgress(`Deleting conflict ${conflictId.id()}`);
  return DataAccessUtilityBase.deleteConflict(collection, conflictId, options)
    .then(
      (response: any) => {
        logConsoleInfo(`Successfully deleted conflict ${conflictId.id()}`);
        return response;
      },
      (error: any) => {
        handleError(error, `Error while deleting conflict ${conflictId.id()}`, "DeleteConflict");
        throw error;
      }
    )
    .finally(clearMessage);
}

export function refreshCachedResources(options: any = {}): Promise<void> {
  return DataAccessUtilityBase.refreshCachedResources(options);
}

export function refreshCachedOffers(): Promise<void> {
  return DataAccessUtilityBase.refreshCachedOffers();
}
