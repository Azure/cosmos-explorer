import * as Constants from "./Constants";
import * as DataModels from "../Contracts/DataModels";
import * as ErrorParserUtility from "./ErrorParserUtility";
import * as ViewModels from "../Contracts/ViewModels";
import Q from "q";
import { ConflictDefinition, ItemDefinition, QueryIterator, Resource } from "@azure/cosmos";
import { ConsoleDataType } from "../Explorer/Menus/NotificationConsole/NotificationConsoleComponent";
import * as DataAccessUtilityBase from "./DataAccessUtilityBase";
import * as Logger from "./Logger";
import { sendMessage } from "./MessageHandler";
import { MessageTypes } from "../Contracts/ExplorerContracts";
import { MinimalQueryIterator, nextPage } from "./IteratorUtilities";
import { NotificationConsoleUtils } from "../Utils/NotificationConsoleUtils";
import { RequestOptions } from "@azure/cosmos/dist-esm";
import StoredProcedure from "../Explorer/Tree/StoredProcedure";
import ConflictId from "../Explorer/Tree/ConflictId";
import DocumentId from "../Explorer/Tree/DocumentId";

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

export function readStoredProcedures(
  collection: ViewModels.Collection,
  options: any = {}
): Q.Promise<DataModels.StoredProcedure[]> {
  var deferred = Q.defer<DataModels.StoredProcedure[]>();
  const id = NotificationConsoleUtils.logConsoleMessage(
    ConsoleDataType.InProgress,
    `Querying stored procedures for container ${collection.id()}`
  );
  DataAccessUtilityBase.readStoredProcedures(collection, options)
    .then(
      (storedProcedures: DataModels.StoredProcedure[]) => {
        deferred.resolve(storedProcedures);
      },
      (error: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Failed to query stored procedures for container ${collection.id()}: ${JSON.stringify(error)}`
        );
        Logger.logError(JSON.stringify(error), "ReadStoredProcedures", error.code);
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => {
      NotificationConsoleUtils.clearInProgressMessageWithId(id);
    });

  return deferred.promise;
}

export function readStoredProcedure(
  collection: ViewModels.Collection,
  requestedResource: DataModels.Resource,
  options?: any
): Q.Promise<DataModels.StoredProcedure> {
  return DataAccessUtilityBase.readStoredProcedure(collection, requestedResource, options);
}

export function readUserDefinedFunctions(
  collection: ViewModels.Collection,
  options: any = {}
): Q.Promise<DataModels.UserDefinedFunction[]> {
  var deferred = Q.defer<DataModels.UserDefinedFunction[]>();
  const id = NotificationConsoleUtils.logConsoleMessage(
    ConsoleDataType.InProgress,
    `Querying user defined functions for collection ${collection.id()}`
  );
  DataAccessUtilityBase.readUserDefinedFunctions(collection, options)
    .then(
      (userDefinedFunctions: DataModels.UserDefinedFunction[]) => {
        deferred.resolve(userDefinedFunctions);
      },
      (error: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Failed to query user defined functions for container ${collection.id()}: ${JSON.stringify(error)}`
        );
        Logger.logError(JSON.stringify(error), "ReadUDFs", error.code);
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => {
      NotificationConsoleUtils.clearInProgressMessageWithId(id);
    });

  return deferred.promise;
}

export function readUserDefinedFunction(
  collection: ViewModels.Collection,
  requestedResource: DataModels.Resource,
  options: any
): Q.Promise<DataModels.UserDefinedFunction> {
  return DataAccessUtilityBase.readUserDefinedFunction(collection, requestedResource, options);
}

export function readTriggers(collection: ViewModels.Collection, options: any): Q.Promise<DataModels.Trigger[]> {
  var deferred = Q.defer<DataModels.Trigger[]>();

  const id = NotificationConsoleUtils.logConsoleMessage(
    ConsoleDataType.InProgress,
    `Querying triggers for container ${collection.id()}`
  );
  DataAccessUtilityBase.readTriggers(collection, options)
    .then(
      (triggers: DataModels.Trigger[]) => {
        deferred.resolve(triggers);
      },
      (error: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Failed to query triggers for container ${collection.id()}: ${JSON.stringify(error)}`
        );
        Logger.logError(JSON.stringify(error), "ReadTriggers", error.code);
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => {
      NotificationConsoleUtils.clearInProgressMessageWithId(id);
    });

  return deferred.promise;
}

export function readTrigger(
  collection: ViewModels.Collection,
  requestedResource: DataModels.Resource,
  options?: any
): Q.Promise<DataModels.Trigger> {
  return DataAccessUtilityBase.readTrigger(collection, requestedResource, options);
}

export function executeStoredProcedure(
  collection: ViewModels.Collection,
  storedProcedure: StoredProcedure,
  partitionKeyValue: any,
  params: any[]
): Q.Promise<any> {
  var deferred = Q.defer<any>();

  const id = NotificationConsoleUtils.logConsoleMessage(
    ConsoleDataType.InProgress,
    `Executing stored procedure ${storedProcedure.id()}`
  );
  DataAccessUtilityBase.executeStoredProcedure(collection, storedProcedure, partitionKeyValue, params)
    .then(
      (response: any) => {
        deferred.resolve(response);
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Info,
          `Finished executing stored procedure ${storedProcedure.id()} for container ${storedProcedure.collection.id()}`
        );
      },
      (error: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
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
      NotificationConsoleUtils.clearInProgressMessageWithId(id);
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
  const id = NotificationConsoleUtils.logConsoleMessage(
    ConsoleDataType.InProgress,
    `Querying ${entityName} for container ${resourceName}`
  );
  Q(nextPage(documentsIterator, firstItemIndex))
    .then(
      (result: ViewModels.QueryResults) => {
        const itemCount = (result.documents && result.documents.length) || 0;
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Info,
          `Successfully fetched ${itemCount} ${entityName} for container ${resourceName}`
        );
        deferred.resolve(result);
      },
      (error: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Failed to query ${entityName} for container ${resourceName}: ${JSON.stringify(error)}`
        );
        Logger.logError(JSON.stringify(error), "QueryDocumentsPage", error.code);
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => {
      NotificationConsoleUtils.clearInProgressMessageWithId(id);
    });

  return deferred.promise;
}

export function readDocument(collection: ViewModels.CollectionBase, documentId: DocumentId): Q.Promise<any> {
  var deferred = Q.defer<any>();
  const entityName = getEntityName();
  const id = NotificationConsoleUtils.logConsoleMessage(
    ConsoleDataType.InProgress,
    `Reading ${entityName} ${documentId.id()}`
  );
  DataAccessUtilityBase.readDocument(collection, documentId)
    .then(
      (document: any) => {
        deferred.resolve(document);
      },
      (error: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Failed to read ${entityName} ${documentId.id()}: ${JSON.stringify(error)}`
        );
        Logger.logError(JSON.stringify(error), "ReadDocument", error.code);
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => {
      NotificationConsoleUtils.clearInProgressMessageWithId(id);
    });

  return deferred.promise;
}

export function updateCollection(
  databaseId: string,
  collection: ViewModels.Collection,
  newCollection: DataModels.Collection
): Q.Promise<DataModels.Collection> {
  var deferred = Q.defer<any>();
  const id = NotificationConsoleUtils.logConsoleMessage(
    ConsoleDataType.InProgress,
    `Updating container ${collection.id()}`
  );
  DataAccessUtilityBase.updateCollection(databaseId, collection.id(), newCollection)
    .then(
      (replacedCollection: DataModels.Collection) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Info,
          `Successfully updated container ${collection.id()}`
        );
        deferred.resolve(replacedCollection);
      },
      (error: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Failed to update container ${collection.id()}: ${JSON.stringify(error)}`
        );
        Logger.logError(JSON.stringify(error), "UpdateCollection", error.code);
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => {
      NotificationConsoleUtils.clearInProgressMessageWithId(id);
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
  const id = NotificationConsoleUtils.logConsoleMessage(
    ConsoleDataType.InProgress,
    `Updating ${entityName} ${documentId.id()}`
  );
  DataAccessUtilityBase.updateDocument(collection, documentId, newDocument)
    .then(
      (updatedDocument: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Info,
          `Successfully updated ${entityName} ${documentId.id()}`
        );
        deferred.resolve(updatedDocument);
      },
      (error: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Failed to update ${entityName} ${documentId.id()}: ${JSON.stringify(error)}`
        );
        Logger.logError(JSON.stringify(error), "UpdateDocument", error.code);
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => {
      NotificationConsoleUtils.clearInProgressMessageWithId(id);
    });

  return deferred.promise;
}

export function updateOffer(
  offer: DataModels.Offer,
  newOffer: DataModels.Offer,
  options: RequestOptions
): Q.Promise<DataModels.Offer> {
  var deferred = Q.defer<any>();
  const id = NotificationConsoleUtils.logConsoleMessage(
    ConsoleDataType.InProgress,
    `Updating offer for resource ${offer.resource}`
  );
  DataAccessUtilityBase.updateOffer(offer, newOffer, options)
    .then(
      (replacedOffer: DataModels.Offer) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Info,
          `Successfully updated offer for resource ${offer.resource}`
        );
        deferred.resolve(replacedOffer);
      },
      (error: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Error updating offer for resource ${offer.resource}: ${JSON.stringify(error)}`
        );
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
      NotificationConsoleUtils.clearInProgressMessageWithId(id);
    });

  return deferred.promise;
}

export function updateOfferThroughputBeyondLimit(
  requestPayload: DataModels.UpdateOfferThroughputRequest
): Q.Promise<void> {
  const deferred: Q.Deferred<void> = Q.defer<void>();
  const resourceDescriptionInfo: string = requestPayload.collectionName
    ? `database ${requestPayload.databaseName} and container ${requestPayload.collectionName}`
    : `database ${requestPayload.databaseName}`;
  const id = NotificationConsoleUtils.logConsoleMessage(
    ConsoleDataType.InProgress,
    `Requesting increase in throughput to ${requestPayload.throughput} for ${resourceDescriptionInfo}`
  );
  DataAccessUtilityBase.updateOfferThroughputBeyondLimit(requestPayload)
    .then(
      () => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Info,
          `Successfully requested an increase in throughput to ${requestPayload.throughput} for ${resourceDescriptionInfo}`
        );
        deferred.resolve();
      },
      (error: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Failed to request an increase in throughput for ${requestPayload.throughput}: ${JSON.stringify(error)}`
        );
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => NotificationConsoleUtils.clearInProgressMessageWithId(id));

  return deferred.promise.timeout(Constants.ClientDefaults.requestTimeoutMs);
}

export function updateStoredProcedure(
  collection: ViewModels.Collection,
  storedProcedure: DataModels.StoredProcedure,
  options?: any
): Q.Promise<DataModels.StoredProcedure> {
  var deferred = Q.defer<any>();
  const id = NotificationConsoleUtils.logConsoleMessage(
    ConsoleDataType.InProgress,
    `Updating stored procedure ${storedProcedure.id}`
  );
  DataAccessUtilityBase.updateStoredProcedure(collection, storedProcedure, options)
    .then(
      (updatedStoredProcedure: DataModels.StoredProcedure) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Info,
          `Successfully updated stored procedure ${storedProcedure.id}`
        );
        deferred.resolve(updatedStoredProcedure);
      },
      (error: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Error while updating stored procedure ${storedProcedure.id}:\n ${JSON.stringify(error)}`
        );
        Logger.logError(JSON.stringify(error), "UpdateStoredProcedure", error.code);
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => {
      NotificationConsoleUtils.clearInProgressMessageWithId(id);
    });

  return deferred.promise;
}

export function updateUserDefinedFunction(
  collection: ViewModels.Collection,
  userDefinedFunction: DataModels.UserDefinedFunction,
  options: any = {}
): Q.Promise<DataModels.UserDefinedFunction> {
  var deferred = Q.defer<any>();
  const id = NotificationConsoleUtils.logConsoleMessage(
    ConsoleDataType.InProgress,
    `Updating user defined function ${userDefinedFunction.id}`
  );
  DataAccessUtilityBase.updateUserDefinedFunction(collection, userDefinedFunction, options)
    .then(
      (updatedUserDefinedFunction: DataModels.UserDefinedFunction) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Info,
          `Successfully updated user defined function ${userDefinedFunction.id}`
        );
        deferred.resolve(updatedUserDefinedFunction);
      },
      (error: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Error while updating user defined function ${userDefinedFunction.id}:\n ${JSON.stringify(error)}`
        );
        Logger.logError(JSON.stringify(error), "UpdateUDF", error.code);
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => {
      NotificationConsoleUtils.clearInProgressMessageWithId(id);
    });

  return deferred.promise;
}

export function updateTrigger(
  collection: ViewModels.Collection,
  trigger: DataModels.Trigger
): Q.Promise<DataModels.Trigger> {
  var deferred = Q.defer<any>();
  const id = NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.InProgress, `Updating trigger ${trigger.id}`);
  DataAccessUtilityBase.updateTrigger(collection, trigger)
    .then(
      (updatedTrigger: DataModels.Trigger) => {
        NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Info, `Updated trigger ${trigger.id}`);
        deferred.resolve(updatedTrigger);
      },
      (error: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Error while updating trigger ${trigger.id}:\n ${JSON.stringify(error)}`
        );
        Logger.logError(JSON.stringify(error), "UpdateTrigger", error.code);
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => {
      NotificationConsoleUtils.clearInProgressMessageWithId(id);
    });

  return deferred.promise;
}

export function createDocument(collection: ViewModels.CollectionBase, newDocument: any): Q.Promise<any> {
  var deferred = Q.defer<any>();
  const entityName = getEntityName();
  const id = NotificationConsoleUtils.logConsoleMessage(
    ConsoleDataType.InProgress,
    `Creating new ${entityName} for container ${collection.id()}`
  );
  DataAccessUtilityBase.createDocument(collection, newDocument)
    .then(
      (savedDocument: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Info,
          `Successfully created new ${entityName} for container ${collection.id()}`
        );
        deferred.resolve(savedDocument);
      },
      (error: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Error while creating new ${entityName} for container ${collection.id()}:\n ${JSON.stringify(error)}`
        );
        Logger.logError(JSON.stringify(error), "CreateDocument", error.code);
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => {
      NotificationConsoleUtils.clearInProgressMessageWithId(id);
    });

  return deferred.promise;
}

export function createStoredProcedure(
  collection: ViewModels.Collection,
  newStoredProcedure: DataModels.StoredProcedure,
  options?: any
): Q.Promise<DataModels.StoredProcedure> {
  var deferred = Q.defer<any>();
  const id = NotificationConsoleUtils.logConsoleMessage(
    ConsoleDataType.InProgress,
    `Creating stored procedure for container ${collection.id()}`
  );
  DataAccessUtilityBase.createStoredProcedure(collection, newStoredProcedure, options)
    .then(
      (createdStoredProcedure: DataModels.StoredProcedure) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Info,
          `Successfully created stored procedure for container ${collection.id()}`
        );
        deferred.resolve(createdStoredProcedure);
      },
      error => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Error while creating stored procedure for container ${collection.id()}:\n ${JSON.stringify(error)}`
        );
        Logger.logError(JSON.stringify(error), "CreateStoredProcedure", error.code);
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => {
      NotificationConsoleUtils.clearInProgressMessageWithId(id);
    });

  return deferred.promise;
}

export function createUserDefinedFunction(
  collection: ViewModels.Collection,
  newUserDefinedFunction: DataModels.UserDefinedFunction,
  options?: any
): Q.Promise<DataModels.UserDefinedFunction> {
  var deferred = Q.defer<any>();
  const id = NotificationConsoleUtils.logConsoleMessage(
    ConsoleDataType.InProgress,
    `Creating user defined function for container ${collection.id()}`
  );
  DataAccessUtilityBase.createUserDefinedFunction(collection, newUserDefinedFunction, options)
    .then(
      (createdUserDefinedFunction: DataModels.UserDefinedFunction) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Info,
          `Successfully created user defined function for container ${collection.id()}`
        );
        deferred.resolve(createdUserDefinedFunction);
      },
      error => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Error while creating user defined function for container ${collection.id()}:\n ${JSON.stringify(error)}`
        );
        Logger.logError(JSON.stringify(error), "CreateUDF", error.code);
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => {
      NotificationConsoleUtils.clearInProgressMessageWithId(id);
    });

  return deferred.promise;
}

export function createTrigger(
  collection: ViewModels.Collection,
  newTrigger: DataModels.Trigger,
  options: any = {}
): Q.Promise<DataModels.Trigger> {
  var deferred = Q.defer<any>();
  const id = NotificationConsoleUtils.logConsoleMessage(
    ConsoleDataType.InProgress,
    `Creating trigger for container ${collection.id()}`
  );
  DataAccessUtilityBase.createTrigger(collection, newTrigger, options)
    .then(
      (createdTrigger: DataModels.Trigger) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Info,
          `Successfully created trigger for container ${collection.id()}`
        );
        deferred.resolve(createdTrigger);
      },
      (error: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Error while creating trigger for container ${collection.id()}:\n ${JSON.stringify(error)}`
        );
        Logger.logError(JSON.stringify(error), "CreateTrigger", error.code);
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => {
      NotificationConsoleUtils.clearInProgressMessageWithId(id);
    });

  return deferred.promise;
}

export function deleteDocument(collection: ViewModels.CollectionBase, documentId: DocumentId): Q.Promise<any> {
  var deferred = Q.defer<any>();
  const entityName = getEntityName();
  const id = NotificationConsoleUtils.logConsoleMessage(
    ConsoleDataType.InProgress,
    `Deleting ${entityName} ${documentId.id()}`
  );
  DataAccessUtilityBase.deleteDocument(collection, documentId)
    .then(
      (response: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Info,
          `Successfully deleted ${entityName} ${documentId.id()}`
        );
        deferred.resolve(response);
      },
      (error: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Error while deleting ${entityName} ${documentId.id()}:\n ${JSON.stringify(error)}`
        );
        Logger.logError(JSON.stringify(error), "DeleteDocument", error.code);
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => {
      NotificationConsoleUtils.clearInProgressMessageWithId(id);
    });

  return deferred.promise;
}

export function deleteConflict(
  collection: ViewModels.CollectionBase,
  conflictId: ConflictId,
  options?: any
): Q.Promise<any> {
  var deferred = Q.defer<any>();

  const id = NotificationConsoleUtils.logConsoleMessage(
    ConsoleDataType.InProgress,
    `Deleting conflict ${conflictId.id()}`
  );
  DataAccessUtilityBase.deleteConflict(collection, conflictId, options)
    .then(
      (response: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Info,
          `Successfully deleted conflict ${conflictId.id()}`
        );
        deferred.resolve(response);
      },
      (error: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Error while deleting conflict ${conflictId.id()}:\n ${JSON.stringify(error)}`
        );
        Logger.logError(JSON.stringify(error), "DeleteConflict", error.code);
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => {
      NotificationConsoleUtils.clearInProgressMessageWithId(id);
    });

  return deferred.promise;
}

export function deleteCollection(collection: ViewModels.Collection, options: any = {}): Q.Promise<any> {
  var deferred = Q.defer<any>();

  const id = NotificationConsoleUtils.logConsoleMessage(
    ConsoleDataType.InProgress,
    `Deleting container ${collection.id()}`
  );
  DataAccessUtilityBase.deleteCollection(collection, options)
    .then(
      (response: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Info,
          `Successfully deleted container ${collection.id()}`
        );
        deferred.resolve(response);
      },
      (error: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Error while deleting container ${collection.id()}:\n ${JSON.stringify(error)}`
        );
        Logger.logError(JSON.stringify(error), "DeleteCollection", error.code);
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => {
      NotificationConsoleUtils.clearInProgressMessageWithId(id);
    });

  return deferred.promise;
}

export function deleteDatabase(database: ViewModels.Database, options: any = {}): Q.Promise<any> {
  var deferred = Q.defer<any>();

  const id = NotificationConsoleUtils.logConsoleMessage(
    ConsoleDataType.InProgress,
    `Deleting database ${database.id()}`
  );
  DataAccessUtilityBase.deleteDatabase(database, options)
    .then(
      (response: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Info,
          `Successfully deleted database ${database.id()}`
        );
        deferred.resolve(response);
      },
      (error: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Error while deleting database ${database.id()}:\n ${JSON.stringify(error)}`
        );
        Logger.logError(JSON.stringify(error), "DeleteDatabase", error.code);
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => {
      NotificationConsoleUtils.clearInProgressMessageWithId(id);
    });

  return deferred.promise;
}

export function deleteStoredProcedure(
  collection: ViewModels.Collection,
  storedProcedure: DataModels.StoredProcedure,
  options: any = {}
): Q.Promise<DataModels.StoredProcedure> {
  var deferred = Q.defer<any>();

  const id = NotificationConsoleUtils.logConsoleMessage(
    ConsoleDataType.InProgress,
    `Deleting stored procedure ${storedProcedure.id}`
  );
  DataAccessUtilityBase.deleteStoredProcedure(collection, storedProcedure, options)
    .then(
      (response: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Info,
          `Successfully deleted stored procedure ${storedProcedure.id}`
        );
        deferred.resolve(response);
      },
      (error: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Error while deleting stored procedure ${storedProcedure.id}:\n ${JSON.stringify(error)}`
        );
        Logger.logError(JSON.stringify(error), "DeleteStoredProcedure", error.code);
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => {
      NotificationConsoleUtils.clearInProgressMessageWithId(id);
    });

  return deferred.promise;
}

export function deleteUserDefinedFunction(
  collection: ViewModels.Collection,
  userDefinedFunction: DataModels.UserDefinedFunction,
  options: any = {}
): Q.Promise<DataModels.UserDefinedFunction> {
  var deferred = Q.defer<any>();
  const id = NotificationConsoleUtils.logConsoleMessage(
    ConsoleDataType.InProgress,
    `Deleting user defined function ${userDefinedFunction.id}`
  );
  DataAccessUtilityBase.deleteUserDefinedFunction(collection, userDefinedFunction, options)
    .then(
      (response: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Info,
          `Successfully deleted user defined function ${userDefinedFunction.id}`
        );
        deferred.resolve(response);
      },
      (error: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Error while deleting user defined function ${userDefinedFunction.id}:\n ${JSON.stringify(error)}`
        );
        Logger.logError(JSON.stringify(error), "DeleteUDF", error.code);
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => {
      NotificationConsoleUtils.clearInProgressMessageWithId(id);
    });

  return deferred.promise;
}

export function deleteTrigger(
  collection: ViewModels.Collection,
  trigger: DataModels.Trigger,
  options: any = {}
): Q.Promise<DataModels.Trigger> {
  var deferred = Q.defer<any>();
  const id = NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.InProgress, `Deleting trigger ${trigger.id}`);
  DataAccessUtilityBase.deleteTrigger(collection, trigger, options)
    .then(
      (response: any) => {
        NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Info, `Successfully deleted trigger ${trigger.id}`);
        deferred.resolve(response);
      },
      (error: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Error while deleting trigger ${trigger.id}:\n ${JSON.stringify(error)}`
        );
        Logger.logError(JSON.stringify(error), "DeleteTrigger", error.code);
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => {
      NotificationConsoleUtils.clearInProgressMessageWithId(id);
    });

  return deferred.promise;
}

export function refreshCachedResources(options: any = {}): Q.Promise<void> {
  return DataAccessUtilityBase.refreshCachedResources(options);
}

export function refreshCachedOffers(): Q.Promise<void> {
  return DataAccessUtilityBase.refreshCachedOffers();
}

export function readCollections(database: ViewModels.Database, options: any = {}): Q.Promise<DataModels.Collection[]> {
  var deferred = Q.defer<DataModels.Collection[]>();
  const id = NotificationConsoleUtils.logConsoleMessage(
    ConsoleDataType.InProgress,
    `Querying containers for database ${database.id()}`
  );
  DataAccessUtilityBase.readCollections(database, options)
    .then(
      (collections: DataModels.Collection[]) => {
        deferred.resolve(collections);
      },
      (error: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Error while querying containers for database ${database.id()}:\n ${JSON.stringify(error)}`
        );
        Logger.logError(JSON.stringify(error), "ReadCollections", error.code);
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => {
      NotificationConsoleUtils.clearInProgressMessageWithId(id);
    });

  return deferred.promise;
}

export function readCollection(databaseId: string, collectionId: string): Q.Promise<DataModels.Collection> {
  const deferred = Q.defer<DataModels.Collection>();
  const id = NotificationConsoleUtils.logConsoleMessage(
    ConsoleDataType.InProgress,
    `Querying container ${collectionId}`
  );

  DataAccessUtilityBase.readCollection(databaseId, collectionId)
    .then(
      (collection: DataModels.Collection) => {
        deferred.resolve(collection);
      },
      (error: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Error while querying containers for database ${databaseId}:\n ${JSON.stringify(error)}`
        );
        Logger.logError(JSON.stringify(error), "ReadCollections", error.code);
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => {
      NotificationConsoleUtils.clearInProgressMessageWithId(id);
    });

  return deferred.promise;
}

export function readCollectionQuotaInfo(
  collection: ViewModels.Collection,
  options?: any
): Q.Promise<DataModels.CollectionQuotaInfo> {
  var deferred = Q.defer<DataModels.CollectionQuotaInfo>();

  const id = NotificationConsoleUtils.logConsoleMessage(
    ConsoleDataType.InProgress,
    `Querying quota info for container ${collection.id}`
  );
  DataAccessUtilityBase.readCollectionQuotaInfo(collection, options)
    .then(
      (quota: DataModels.CollectionQuotaInfo) => {
        deferred.resolve(quota);
      },
      (error: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Error while querying quota info for container ${collection.id}:\n ${JSON.stringify(error)}`
        );
        Logger.logError(JSON.stringify(error), "ReadCollectionQuotaInfo", error.code);
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => {
      NotificationConsoleUtils.clearInProgressMessageWithId(id);
    });

  return deferred.promise;
}

export function readOffers(options: any = {}): Q.Promise<DataModels.Offer[]> {
  var deferred = Q.defer<DataModels.Offer[]>();

  const id = NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.InProgress, "Querying offers");
  DataAccessUtilityBase.readOffers(options)
    .then(
      (offers: DataModels.Offer[]) => {
        deferred.resolve(offers);
      },
      (error: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Error while querying offers:\n ${JSON.stringify(error)}`
        );
        Logger.logError(JSON.stringify(error), "ReadOffers", error.code);
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => {
      NotificationConsoleUtils.clearInProgressMessageWithId(id);
    });

  return deferred.promise;
}

export function readOffer(
  requestedResource: DataModels.Offer,
  options: any = {}
): Q.Promise<DataModels.OfferWithHeaders> {
  var deferred = Q.defer<DataModels.OfferWithHeaders>();

  const id = NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.InProgress, "Querying offer");
  DataAccessUtilityBase.readOffer(requestedResource, options)
    .then(
      (offer: DataModels.OfferWithHeaders) => {
        deferred.resolve(offer);
      },
      (error: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Error while querying offer:\n ${JSON.stringify(error)}`
        );
        Logger.logError(JSON.stringify(error), "ReadOffer", error.code);
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => {
      NotificationConsoleUtils.clearInProgressMessageWithId(id);
    });

  return deferred.promise;
}

export function readDatabases(options: any): Q.Promise<DataModels.Database[]> {
  var deferred = Q.defer<any>();
  const id = NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.InProgress, "Querying databases");
  DataAccessUtilityBase.readDatabases(options)
    .then(
      (databases: DataModels.Database[]) => {
        deferred.resolve(databases);
      },
      (error: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Error while querying databases:\n ${JSON.stringify(error)}`
        );
        Logger.logError(JSON.stringify(error), "ReadDatabases", error.code);
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => {
      NotificationConsoleUtils.clearInProgressMessageWithId(id);
    });

  return deferred.promise;
}

export function getOrCreateDatabaseAndCollection(
  request: DataModels.CreateDatabaseAndCollectionRequest,
  options: any = {}
): Q.Promise<DataModels.Collection> {
  const deferred: Q.Deferred<DataModels.Collection> = Q.defer<DataModels.Collection>();
  const id = NotificationConsoleUtils.logConsoleMessage(
    ConsoleDataType.InProgress,
    `Creating a new container ${request.collectionId} for database ${request.databaseId}`
  );

  DataAccessUtilityBase.getOrCreateDatabaseAndCollection(request, options)
    .then(
      (collection: DataModels.Collection) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Info,
          `Successfully created container ${request.collectionId}`
        );
        deferred.resolve(collection);
      },
      (error: any) => {
        const sanitizedError = ErrorParserUtility.replaceKnownError(JSON.stringify(error));
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Error while creating container ${request.collectionId}:\n ${sanitizedError}`
        );
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => NotificationConsoleUtils.clearInProgressMessageWithId(id));

  return deferred.promise;
}

export function createDatabase(
  request: DataModels.CreateDatabaseRequest,
  options: any = {}
): Q.Promise<DataModels.Database> {
  const deferred: Q.Deferred<DataModels.Database> = Q.defer<DataModels.Database>();
  const id = NotificationConsoleUtils.logConsoleMessage(
    ConsoleDataType.InProgress,
    `Creating a new database ${request.databaseId}`
  );

  DataAccessUtilityBase.createDatabase(request, options)
    .then(
      (database: DataModels.Database) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Info,
          `Successfully created database ${request.databaseId}`
        );
        deferred.resolve(database);
      },
      (error: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Error while creating database ${request.databaseId}:\n ${JSON.stringify(error)}`
        );
        sendNotificationForError(error);
        deferred.reject(error);
      }
    )
    .finally(() => NotificationConsoleUtils.clearInProgressMessageWithId(id));

  return deferred.promise;
}

export function sendNotificationForError(error: any) {
  if (error && error.code === Constants.HttpStatusCodes.Forbidden) {
    if (error.message && error.message.toLowerCase().indexOf("sharedoffer is disabled for your account") > 0) {
      return;
    }
    sendMessage({
      type: MessageTypes.ForbiddenError,
      reason: error && error.message ? error.message : error
    });
  }
}
