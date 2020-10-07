import * as ko from "knockout";
import Q from "q";

import { displayTokenRenewalPromptForStatus, getAuthorizationHeader } from "../../Utils/AuthorizationUtils";
import { AuthType } from "../../AuthType";
import { ConsoleDataType } from "../../Explorer/Menus/NotificationConsole/NotificationConsoleComponent";
import * as Constants from "../../Common/Constants";
import * as Entities from "./Entities";
import * as HeadersUtility from "../../Common/HeadersUtility";
import * as Logger from "../../Common/Logger";
import * as NotificationConsoleUtils from "../../Utils/NotificationConsoleUtils";
import * as TableConstants from "./Constants";
import * as TableEntityProcessor from "./TableEntityProcessor";
import * as ViewModels from "../../Contracts/ViewModels";
import { MessageTypes } from "../../Contracts/ExplorerContracts";
import { sendMessage } from "../../Common/MessageHandler";
import Explorer from "../Explorer";
import {
  queryDocuments,
  refreshCachedResources,
  deleteDocument,
  updateDocument,
  createDocument
} from "../../Common/DocumentClientUtilityBase";
import { configContext } from "../../ConfigContext";

export interface CassandraTableKeys {
  partitionKeys: CassandraTableKey[];
  clusteringKeys: CassandraTableKey[];
}

export interface CassandraTableKey {
  property: string;
  type: string;
}

export abstract class TableDataClient {
  constructor() {}

  public abstract createDocument(
    collection: ViewModels.Collection,
    entity: Entities.ITableEntity
  ): Q.Promise<Entities.ITableEntity>;

  public abstract updateDocument(
    collection: ViewModels.Collection,
    originalDocument: any,
    newEntity: Entities.ITableEntity
  ): Q.Promise<Entities.ITableEntity>;

  public abstract queryDocuments(
    collection: ViewModels.Collection,
    query: string,
    shouldNotify?: boolean,
    paginationToken?: string
  ): Q.Promise<Entities.IListTableEntitiesResult>;

  public abstract deleteDocuments(
    collection: ViewModels.Collection,
    entitiesToDelete: Entities.ITableEntity[]
  ): Q.Promise<any>;
}

export class TablesAPIDataClient extends TableDataClient {
  public createDocument(
    collection: ViewModels.Collection,
    entity: Entities.ITableEntity
  ): Q.Promise<Entities.ITableEntity> {
    const deferred = Q.defer<Entities.ITableEntity>();
    createDocument(
      collection,
      TableEntityProcessor.convertEntityToNewDocument(<Entities.ITableEntityForTablesAPI>entity)
    ).then(
      (newDocument: any) => {
        const newEntity = TableEntityProcessor.convertDocumentsToEntities([newDocument])[0];
        deferred.resolve(newEntity);
      },
      reason => {
        deferred.reject(reason);
      }
    );
    return deferred.promise;
  }

  public updateDocument(
    collection: ViewModels.Collection,
    originalDocument: any,
    entity: Entities.ITableEntity
  ): Q.Promise<Entities.ITableEntity> {
    const deferred = Q.defer<Entities.ITableEntity>();

    updateDocument(
      collection,
      originalDocument,
      TableEntityProcessor.convertEntityToNewDocument(<Entities.ITableEntityForTablesAPI>entity)
    ).then(
      (newDocument: any) => {
        const newEntity = TableEntityProcessor.convertDocumentsToEntities([newDocument])[0];
        deferred.resolve(newEntity);
      },
      reason => {
        deferred.reject(reason);
      }
    );
    return deferred.promise;
  }

  public queryDocuments(
    collection: ViewModels.Collection,
    query: string
  ): Q.Promise<Entities.IListTableEntitiesResult> {
    const deferred = Q.defer<Entities.IListTableEntitiesResult>();

    let options: any = {};
    options.enableCrossPartitionQuery = HeadersUtility.shouldEnableCrossPartitionKey();
    queryDocuments(collection.databaseId, collection.id(), query, options).then(
      iterator => {
        iterator
          .fetchNext()
          .then(response => response.resources)
          .then(
            (documents: any[] = []) => {
              let entities: Entities.ITableEntity[] = TableEntityProcessor.convertDocumentsToEntities(documents);
              let finalEntities: Entities.IListTableEntitiesResult = <Entities.IListTableEntitiesResult>{
                Results: entities,
                ContinuationToken: iterator.hasMoreResults(),
                iterator: iterator
              };
              deferred.resolve(finalEntities);
            },
            reason => {
              deferred.reject(reason);
            }
          );
      },
      reason => {
        deferred.reject(reason);
      }
    );
    return deferred.promise;
  }

  public deleteDocuments(collection: ViewModels.Collection, entitiesToDelete: Entities.ITableEntity[]): Q.Promise<any> {
    let documentsToDelete: any[] = TableEntityProcessor.convertEntitiesToDocuments(
      <Entities.ITableEntityForTablesAPI[]>entitiesToDelete,
      collection
    );
    let promiseArray: Q.Promise<any>[] = [];
    documentsToDelete &&
      documentsToDelete.forEach(document => {
        document.id = ko.observable<string>(document.id);
        let promise: Q.Promise<any> = deleteDocument(collection, document);
        promiseArray.push(promise);
      });
    return Q.all(promiseArray);
  }
}

export class CassandraAPIDataClient extends TableDataClient {
  public createDocument(
    collection: ViewModels.Collection,
    entity: Entities.ITableEntity
  ): Q.Promise<Entities.ITableEntity> {
    const notificationId = NotificationConsoleUtils.logConsoleMessage(
      ConsoleDataType.InProgress,
      `Adding new row to table ${collection.id()}`
    );
    let properties = "(";
    let values = "(";
    for (let property in entity) {
      if (entity[property]._ === null) {
        continue;
      }
      properties = properties.concat(`${property}, `);
      const propertyType = entity[property].$;
      if (this.isStringType(propertyType)) {
        values = values.concat(`'${entity[property]._}', `);
      } else {
        values = values.concat(`${entity[property]._}, `);
      }
    }
    properties = properties.slice(0, properties.length - 2) + ")";
    values = values.slice(0, values.length - 2) + ")";
    const query = `INSERT INTO ${collection.databaseId}.${collection.id()} ${properties} VALUES ${values}`;
    const deferred = Q.defer<Entities.ITableEntity>();
    this.queryDocuments(collection, query)
      .then(
        (data: any) => {
          entity[TableConstants.EntityKeyNames.RowKey] = entity[this.getCassandraPartitionKeyProperty(collection)];
          entity[TableConstants.EntityKeyNames.RowKey]._ = entity[TableConstants.EntityKeyNames.RowKey]._.toString();
          NotificationConsoleUtils.logConsoleMessage(
            ConsoleDataType.Info,
            `Successfully added new row to table ${collection.id()}`
          );
          deferred.resolve(entity);
        },
        reason => {
          NotificationConsoleUtils.logConsoleMessage(
            ConsoleDataType.Error,
            `Error while adding new row to table ${collection.id()}:\n ${JSON.stringify(reason)}`
          );
          Logger.logError(JSON.stringify(reason), "AddRowCassandra", reason.code);
          this._checkForbiddenError(reason);
          deferred.reject(reason);
        }
      )
      .finally(() => {
        NotificationConsoleUtils.clearInProgressMessageWithId(notificationId);
      });
    return deferred.promise;
  }

  public updateDocument(
    collection: ViewModels.Collection,
    originalDocument: any,
    newEntity: Entities.ITableEntity
  ): Q.Promise<Entities.ITableEntity> {
    const notificationId = NotificationConsoleUtils.logConsoleMessage(
      ConsoleDataType.InProgress,
      `Updating row ${originalDocument.RowKey._}`
    );
    const deferred = Q.defer<Entities.ITableEntity>();
    let promiseArray: Q.Promise<any>[] = [];
    let query = `UPDATE ${collection.databaseId}.${collection.id()}`;
    let isChange: boolean = false;
    for (let property in newEntity) {
      if (!originalDocument[property] || newEntity[property]._.toString() !== originalDocument[property]._.toString()) {
        if (this.isStringType(newEntity[property].$)) {
          query = `${query} SET ${property} = '${newEntity[property]._}',`;
        } else {
          query = `${query} SET ${property} = ${newEntity[property]._},`;
        }
        isChange = true;
      }
    }
    query = query.slice(0, query.length - 1);
    let whereSegment = " WHERE";
    let keys: CassandraTableKey[] = collection.cassandraKeys.partitionKeys.concat(
      collection.cassandraKeys.clusteringKeys
    );
    for (let keyIndex in keys) {
      const key = keys[keyIndex].property;
      const keyType = keys[keyIndex].type;
      if (this.isStringType(keyType)) {
        whereSegment = `${whereSegment} ${key} = '${newEntity[key]._}' AND`;
      } else {
        whereSegment = `${whereSegment} ${key} = ${newEntity[key]._} AND`;
      }
    }
    whereSegment = whereSegment.slice(0, whereSegment.length - 4);
    query = query + whereSegment;
    if (isChange) {
      promiseArray.push(this.queryDocuments(collection, query));
    }
    query = `DELETE `;
    for (let property in originalDocument) {
      if (property !== TableConstants.EntityKeyNames.RowKey && !newEntity[property] && !!originalDocument[property]) {
        query = `${query} ${property},`;
      }
    }
    if (query.length > 7) {
      query = query.slice(0, query.length - 1);
      query = `${query} FROM ${collection.databaseId}.${collection.id()}${whereSegment}`;
      promiseArray.push(this.queryDocuments(collection, query));
    }
    Q.all(promiseArray)
      .then(
        (data: any) => {
          newEntity[TableConstants.EntityKeyNames.RowKey] = originalDocument[TableConstants.EntityKeyNames.RowKey];
          NotificationConsoleUtils.logConsoleMessage(
            ConsoleDataType.Info,
            `Successfully updated row ${newEntity.RowKey._}`
          );
          deferred.resolve(newEntity);
        },
        reason => {
          NotificationConsoleUtils.logConsoleMessage(
            ConsoleDataType.Error,
            `Failed to update row ${newEntity.RowKey._}: ${JSON.stringify(reason)}`
          );
          Logger.logError(JSON.stringify(reason), "UpdateRowCassandra", reason.code);
          this._checkForbiddenError(reason);
          deferred.reject(reason);
        }
      )
      .finally(() => {
        NotificationConsoleUtils.clearInProgressMessageWithId(notificationId);
      });
    return deferred.promise;
  }

  public queryDocuments(
    collection: ViewModels.Collection,
    query: string,
    shouldNotify?: boolean,
    paginationToken?: string
  ): Q.Promise<Entities.IListTableEntitiesResult> {
    let notificationId: string;
    if (shouldNotify) {
      notificationId = NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.InProgress,
        `Querying rows for table ${collection.id()}`
      );
    }
    const deferred = Q.defer<Entities.IListTableEntitiesResult>();
    const authType = window.authType;
    const apiEndpoint: string =
      authType === AuthType.EncryptedToken
        ? Constants.CassandraBackend.guestQueryApi
        : Constants.CassandraBackend.queryApi;
    $.ajax(`${configContext.BACKEND_ENDPOINT}/${apiEndpoint}`, {
      type: "POST",
      data: {
        accountName: collection && collection.container.databaseAccount && collection.container.databaseAccount().name,
        cassandraEndpoint: this.trimCassandraEndpoint(
          collection.container.databaseAccount().properties.cassandraEndpoint
        ),
        resourceId: collection.container.databaseAccount().id,
        keyspaceId: collection.databaseId,
        tableId: collection.id(),
        query: query,
        paginationToken: paginationToken
      },
      beforeSend: this.setAuthorizationHeader,
      error: this.handleAjaxError,
      cache: false
    })
      .then(
        (data: any) => {
          if (shouldNotify) {
            NotificationConsoleUtils.logConsoleMessage(
              ConsoleDataType.Info,
              `Successfully fetched ${data.result.length} rows for table ${collection.id()}`
            );
          }
          deferred.resolve({
            Results: data.result,
            ContinuationToken: data.paginationToken
          });
        },
        reason => {
          if (shouldNotify) {
            NotificationConsoleUtils.logConsoleMessage(
              ConsoleDataType.Error,
              `Failed to query rows for table ${collection.id()}: ${JSON.stringify(reason)}`
            );
            Logger.logError(JSON.stringify(reason), "QueryDocumentsCassandra", reason.status);
            this._checkForbiddenError(reason);
          }
          deferred.reject(reason);
        }
      )
      .done(() => {
        if (shouldNotify) {
          NotificationConsoleUtils.clearInProgressMessageWithId(notificationId);
        }
      });
    return deferred.promise;
  }

  public deleteDocuments(collection: ViewModels.Collection, entitiesToDelete: Entities.ITableEntity[]): Q.Promise<any> {
    const query = `DELETE FROM ${collection.databaseId}.${collection.id()} WHERE `;
    let promiseArray: Q.Promise<any>[] = [];
    let partitionKeyProperty = this.getCassandraPartitionKeyProperty(collection);
    for (let i = 0, len = entitiesToDelete.length; i < len; i++) {
      let currEntityToDelete: Entities.ITableEntity = entitiesToDelete[i];
      let currQuery = query;
      let partitionKeyValue = currEntityToDelete[partitionKeyProperty];
      if (partitionKeyValue._ != null && this.isStringType(partitionKeyValue.$)) {
        currQuery = `${currQuery}${partitionKeyProperty} = '${partitionKeyValue._}' AND `;
      } else {
        currQuery = `${currQuery}${partitionKeyProperty} = ${partitionKeyValue._} AND `;
      }
      currQuery = currQuery.slice(0, currQuery.length - 5);
      const notificationId = NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.InProgress,
        `Deleting row ${currEntityToDelete.RowKey._}`
      );
      promiseArray.push(
        this.queryDocuments(collection, currQuery)
          .then(
            () => {
              NotificationConsoleUtils.logConsoleMessage(
                ConsoleDataType.Info,
                `Successfully deleted row ${currEntityToDelete.RowKey._}`
              );
            },
            reason => {
              NotificationConsoleUtils.logConsoleMessage(
                ConsoleDataType.Error,
                `Error while deleting row ${currEntityToDelete.RowKey._}:\n ${JSON.stringify(reason)}`
              );
              Logger.logError(JSON.stringify(reason), "DeleteRowCassandra", reason.code);
              this._checkForbiddenError(reason);
            }
          )
          .finally(() => {
            NotificationConsoleUtils.clearInProgressMessageWithId(notificationId);
          })
      );
    }
    return Q.all(promiseArray);
  }

  public createKeyspace(
    cassandraEndpoint: string,
    resourceId: string,
    explorer: Explorer,
    createKeyspaceQuery: string
  ): Q.Promise<any> {
    if (!createKeyspaceQuery) {
      return Q.reject("No query specified");
    }

    const deferred: Q.Deferred<any> = Q.defer();
    const notificationId = NotificationConsoleUtils.logConsoleMessage(
      ConsoleDataType.InProgress,
      `Creating a new keyspace with query ${createKeyspaceQuery}`
    );
    this.createOrDeleteQuery(cassandraEndpoint, resourceId, createKeyspaceQuery, explorer)
      .then(
        (data: any) => {
          NotificationConsoleUtils.logConsoleMessage(
            ConsoleDataType.Info,
            `Successfully created a keyspace with query ${createKeyspaceQuery}`
          );
          refreshCachedResources().finally(() => deferred.resolve());
        },
        reason => {
          NotificationConsoleUtils.logConsoleMessage(
            ConsoleDataType.Error,
            `Error while creating a keyspace with query ${createKeyspaceQuery}:\n ${JSON.stringify(reason)}`
          );
          Logger.logError(JSON.stringify(reason), "CreateKeyspaceCassandra", reason.code);
          this._checkForbiddenError(reason);
          deferred.reject(reason);
        }
      )
      .finally(() => {
        NotificationConsoleUtils.clearInProgressMessageWithId(notificationId);
      });

    return deferred.promise.timeout(Constants.ClientDefaults.requestTimeoutMs);
  }

  public createTableAndKeyspace(
    cassandraEndpoint: string,
    resourceId: string,
    explorer: Explorer,
    createTableQuery: string,
    createKeyspaceQuery?: string
  ): Q.Promise<any> {
    let createKeyspacePromise: Q.Promise<any>;
    if (createKeyspaceQuery) {
      createKeyspacePromise = this.createKeyspace(cassandraEndpoint, resourceId, explorer, createKeyspaceQuery);
    } else {
      createKeyspacePromise = Q.resolve(null);
    }

    const deferred = Q.defer();
    createKeyspacePromise.then(
      () => {
        const notificationId = NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.InProgress,
          `Creating a new table with query ${createTableQuery}`
        );
        this.createOrDeleteQuery(cassandraEndpoint, resourceId, createTableQuery, explorer)
          .then(
            (data: any) => {
              NotificationConsoleUtils.logConsoleMessage(
                ConsoleDataType.Info,
                `Successfully created a table with query ${createTableQuery}`
              );
              refreshCachedResources(null).then(
                () => {
                  deferred.resolve();
                },
                reason => {
                  // Still resolve since the keyspace/table was successfully created at this point.
                  deferred.resolve();
                }
              );
            },
            reason => {
              NotificationConsoleUtils.logConsoleMessage(
                ConsoleDataType.Error,
                `Error while creating a table with query ${createTableQuery}:\n ${JSON.stringify(reason)}`
              );
              Logger.logError(JSON.stringify(reason), "CreateTableCassandra", reason.code);
              this._checkForbiddenError(reason);
              deferred.reject(reason);
            }
          )
          .finally(() => {
            NotificationConsoleUtils.clearInProgressMessageWithId(notificationId);
          });
      },
      reason => {
        deferred.reject(reason);
      }
    );
    return deferred.promise;
  }

  public deleteTableOrKeyspace(
    cassandraEndpoint: string,
    resourceId: string,
    deleteQuery: string,
    explorer: Explorer
  ): Q.Promise<any> {
    const deferred = Q.defer<any>();
    const notificationId = NotificationConsoleUtils.logConsoleMessage(
      ConsoleDataType.InProgress,
      `Deleting resource with query ${deleteQuery}`
    );
    this.createOrDeleteQuery(cassandraEndpoint, resourceId, deleteQuery, explorer)
      .then(
        () => {
          NotificationConsoleUtils.logConsoleMessage(
            ConsoleDataType.Info,
            `Successfully deleted resource with query ${deleteQuery}`
          );
          refreshCachedResources(null).then(
            () => {
              deferred.resolve();
            },
            reason => {
              // Still resolve since the keyspace/table was successfully deleted at this point.
              deferred.resolve();
            }
          );
        },
        reason => {
          NotificationConsoleUtils.logConsoleMessage(
            ConsoleDataType.Error,
            `Error while deleting resource with query ${deleteQuery}:\n ${JSON.stringify(reason)}`
          );
          Logger.logError(JSON.stringify(reason), "DeleteKeyspaceOrTableCassandra", reason.code);
          this._checkForbiddenError(reason);
          deferred.reject(reason);
        }
      )
      .finally(() => {
        NotificationConsoleUtils.clearInProgressMessageWithId(notificationId);
      });
    return deferred.promise;
  }

  public getTableKeys(collection: ViewModels.Collection): Q.Promise<CassandraTableKeys> {
    if (!!collection.cassandraKeys) {
      return Q.resolve(collection.cassandraKeys);
    }
    const notificationId = NotificationConsoleUtils.logConsoleMessage(
      ConsoleDataType.InProgress,
      `Fetching keys for table ${collection.id()}`
    );
    const authType = window.authType;
    const apiEndpoint: string =
      authType === AuthType.EncryptedToken
        ? Constants.CassandraBackend.guestKeysApi
        : Constants.CassandraBackend.keysApi;
    let endpoint = `${configContext.BACKEND_ENDPOINT}/${apiEndpoint}`;
    const deferred = Q.defer<CassandraTableKeys>();
    $.ajax(endpoint, {
      type: "POST",
      data: {
        accountName: collection && collection.container.databaseAccount && collection.container.databaseAccount().name,
        cassandraEndpoint: this.trimCassandraEndpoint(
          collection.container.databaseAccount().properties.cassandraEndpoint
        ),
        resourceId: collection.container.databaseAccount().id,
        keyspaceId: collection.databaseId,
        tableId: collection.id()
      },
      beforeSend: this.setAuthorizationHeader,
      error: this.handleAjaxError,
      cache: false
    })
      .then(
        (data: CassandraTableKeys) => {
          collection.cassandraKeys = data;
          NotificationConsoleUtils.logConsoleMessage(
            ConsoleDataType.Info,
            `Successfully fetched keys for table ${collection.id()}`
          );
          deferred.resolve(data);
        },
        reason => {
          NotificationConsoleUtils.logConsoleMessage(
            ConsoleDataType.Error,
            `Error fetching keys for table ${collection.id()}:\n ${JSON.stringify(reason)}`
          );
          Logger.logError(JSON.stringify(reason), "FetchKeysCassandra", reason.status);
          this._checkForbiddenError(reason);
          deferred.reject(reason);
        }
      )
      .done(() => {
        NotificationConsoleUtils.clearInProgressMessageWithId(notificationId);
      });
    return deferred.promise;
  }

  public getTableSchema(collection: ViewModels.Collection): Q.Promise<CassandraTableKey[]> {
    if (!!collection.cassandraSchema) {
      return Q.resolve(collection.cassandraSchema);
    }
    const notificationId = NotificationConsoleUtils.logConsoleMessage(
      ConsoleDataType.InProgress,
      `Fetching schema for table ${collection.id()}`
    );
    const authType = window.authType;
    const apiEndpoint: string =
      authType === AuthType.EncryptedToken
        ? Constants.CassandraBackend.guestSchemaApi
        : Constants.CassandraBackend.schemaApi;
    let endpoint = `${configContext.BACKEND_ENDPOINT}/${apiEndpoint}`;
    const deferred = Q.defer<CassandraTableKey[]>();
    $.ajax(endpoint, {
      type: "POST",
      data: {
        accountName: collection && collection.container.databaseAccount && collection.container.databaseAccount().name,
        cassandraEndpoint: this.trimCassandraEndpoint(
          collection.container.databaseAccount().properties.cassandraEndpoint
        ),
        resourceId: collection.container.databaseAccount().id,
        keyspaceId: collection.databaseId,
        tableId: collection.id()
      },
      beforeSend: this.setAuthorizationHeader,
      error: this.handleAjaxError,
      cache: false
    })
      .then(
        (data: any) => {
          collection.cassandraSchema = data.columns;
          NotificationConsoleUtils.logConsoleMessage(
            ConsoleDataType.Info,
            `Successfully fetched schema for table ${collection.id()}`
          );
          deferred.resolve(data.columns);
        },
        reason => {
          NotificationConsoleUtils.logConsoleMessage(
            ConsoleDataType.Error,
            `Error fetching schema for table ${collection.id()}:\n ${JSON.stringify(reason)}`
          );
          Logger.logError(JSON.stringify(reason), "FetchSchemaCassandra", reason.status);
          this._checkForbiddenError(reason);
          deferred.reject(reason);
        }
      )
      .done(() => {
        NotificationConsoleUtils.clearInProgressMessageWithId(notificationId);
      });
    return deferred.promise;
  }

  private createOrDeleteQuery(
    cassandraEndpoint: string,
    resourceId: string,
    query: string,
    explorer: Explorer
  ): Q.Promise<any> {
    const deferred = Q.defer();
    const authType = window.authType;
    const apiEndpoint: string =
      authType === AuthType.EncryptedToken
        ? Constants.CassandraBackend.guestCreateOrDeleteApi
        : Constants.CassandraBackend.createOrDeleteApi;
    $.ajax(`${configContext.BACKEND_ENDPOINT}/${apiEndpoint}`, {
      type: "POST",
      data: {
        accountName: explorer.databaseAccount() && explorer.databaseAccount().name,
        cassandraEndpoint: this.trimCassandraEndpoint(cassandraEndpoint),
        resourceId: resourceId,
        query: query
      },
      beforeSend: this.setAuthorizationHeader,
      error: this.handleAjaxError,
      cache: false
    }).then(
      (data: any) => {
        deferred.resolve();
      },
      reason => {
        deferred.reject(reason);
      }
    );
    return deferred.promise;
  }

  private trimCassandraEndpoint(cassandraEndpoint: string): string {
    if (!cassandraEndpoint) {
      return cassandraEndpoint;
    }

    if (cassandraEndpoint.indexOf("https://") === 0) {
      cassandraEndpoint = cassandraEndpoint.slice(8, cassandraEndpoint.length);
    }

    if (cassandraEndpoint.indexOf(":443/", cassandraEndpoint.length - 5) !== -1) {
      cassandraEndpoint = cassandraEndpoint.slice(0, cassandraEndpoint.length - 5);
    }

    return cassandraEndpoint;
  }

  private setAuthorizationHeader: (xhr: XMLHttpRequest) => boolean = (xhr: XMLHttpRequest): boolean => {
    const authorizationHeaderMetadata: ViewModels.AuthorizationTokenHeaderMetadata = getAuthorizationHeader();
    xhr.setRequestHeader(authorizationHeaderMetadata.header, authorizationHeaderMetadata.token);

    return true;
  };

  private isStringType(dataType: string): boolean {
    // TODO figure out rest of types that are considered strings by Cassandra (if any have been missed)
    return (
      dataType === TableConstants.CassandraType.Text ||
      dataType === TableConstants.CassandraType.Inet ||
      dataType === TableConstants.CassandraType.Ascii ||
      dataType === TableConstants.CassandraType.Varchar
    );
  }

  private getCassandraPartitionKeyProperty(collection: ViewModels.Collection): string {
    return collection.cassandraKeys.partitionKeys[0].property;
  }

  private handleAjaxError = (xhrObj: XMLHttpRequest, textStatus: string, errorThrown: string): void => {
    if (!xhrObj) {
      return;
    }

    displayTokenRenewalPromptForStatus(xhrObj.status);
  };

  private _checkForbiddenError(reason: any) {
    if (reason && reason.code === Constants.HttpStatusCodes.Forbidden) {
      sendMessage({
        type: MessageTypes.ForbiddenError,
        reason: typeof reason === "string" ? "reason" : JSON.stringify(reason)
      });
    }
  }
}
