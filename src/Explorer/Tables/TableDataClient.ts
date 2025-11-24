import { FeedOptions } from "@azure/cosmos";
import * as ko from "knockout";
import Q from "q";
import { AuthType } from "../../AuthType";
import * as Constants from "../../Common/Constants";
import { CassandraProxyAPIs } from "../../Common/Constants";
import { handleError } from "../../Common/ErrorHandlingUtils";
import * as HeadersUtility from "../../Common/HeadersUtility";
import { createDocument } from "../../Common/dataAccess/createDocument";
import { deleteDocument } from "../../Common/dataAccess/deleteDocument";
import { queryDocuments } from "../../Common/dataAccess/queryDocuments";
import { updateDocument } from "../../Common/dataAccess/updateDocument";
import { configContext } from "../../ConfigContext";
import * as ViewModels from "../../Contracts/ViewModels";
import { userContext } from "../../UserContext";
import { getAuthorizationHeader, isDataplaneRbacEnabledForProxyApi } from "../../Utils/AuthorizationUtils";
import * as NotificationConsoleUtils from "../../Utils/NotificationConsoleUtils";
import { logConsoleInfo, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import Explorer from "../Explorer";
import * as TableConstants from "./Constants";
import * as Entities from "./Entities";
import * as TableEntityProcessor from "./TableEntityProcessor";

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
    entity: Entities.ITableEntity,
  ): Q.Promise<Entities.ITableEntity>;

  public abstract updateDocument(
    collection: ViewModels.Collection,
    originalDocument: any,
    newEntity: Entities.ITableEntity,
  ): Promise<Entities.ITableEntity>;

  public abstract queryDocuments(
    collection: ViewModels.Collection,
    query: string,
    shouldNotify?: boolean,
    paginationToken?: string,
  ): Promise<Entities.IListTableEntitiesResult>;

  public abstract deleteDocuments(
    collection: ViewModels.Collection,
    entitiesToDelete: Entities.ITableEntity[],
  ): Promise<any>;
}

export class TablesAPIDataClient extends TableDataClient {
  public createDocument(
    collection: ViewModels.Collection,
    entity: Entities.ITableEntity,
  ): Q.Promise<Entities.ITableEntity> {
    const deferred = Q.defer<Entities.ITableEntity>();
    createDocument(
      collection,
      TableEntityProcessor.convertEntityToNewDocument(<Entities.ITableEntityForTablesAPI>entity),
    ).then(
      (newDocument: any) => {
        const newEntity = TableEntityProcessor.convertDocumentsToEntities([newDocument])[0];
        deferred.resolve(newEntity);
      },
      (reason) => {
        deferred.reject(reason);
      },
    );
    return deferred.promise;
  }

  public async updateDocument(
    collection: ViewModels.Collection,
    originalDocument: any,
    entity: Entities.ITableEntity,
  ): Promise<Entities.ITableEntity> {
    try {
      const newDocument = await updateDocument(
        collection,
        originalDocument,
        TableEntityProcessor.convertEntityToNewDocument(<Entities.ITableEntityForTablesAPI>entity),
      );
      return TableEntityProcessor.convertDocumentsToEntities([newDocument])[0];
    } catch (error) {
      handleError(error, "TablesAPIDataClient/updateDocument");
      throw error;
    }
  }

  public async queryDocuments(
    collection: ViewModels.Collection,
    query: string,
  ): Promise<Entities.IListTableEntitiesResult> {
    try {
      const options = {
        enableCrossPartitionQuery: HeadersUtility.shouldEnableCrossPartitionKey(),
      } as FeedOptions;
      const iterator = queryDocuments(collection.databaseId, collection.id(), query, options);
      const response = await iterator.fetchNext();
      const documents = response?.resources;
      const entities = TableEntityProcessor.convertDocumentsToEntities(documents);

      return {
        Results: entities,
        ContinuationToken: iterator.hasMoreResults(),
        iterator: iterator,
      };
    } catch (error) {
      handleError(error, "TablesAPIDataClient/queryDocuments", "Query documents failed");
      throw error;
    }
  }

  public async deleteDocuments(
    collection: ViewModels.Collection,
    entitiesToDelete: Entities.ITableEntity[],
  ): Promise<any> {
    const documentsToDelete: any[] = TableEntityProcessor.convertEntitiesToDocuments(
      <Entities.ITableEntityForTablesAPI[]>entitiesToDelete,
      collection,
    );

    await Promise.all(
      documentsToDelete?.map(async (document) => {
        document.id = ko.observable<string>(document.id);
        await deleteDocument(collection, document);
      }),
    );
  }
}

export class CassandraAPIDataClient extends TableDataClient {
  public createDocument(
    collection: ViewModels.Collection,
    entity: Entities.ITableEntity,
  ): Q.Promise<Entities.ITableEntity> {
    const clearInProgressMessage = logConsoleProgress(`Adding new row to table ${collection.id()}`);
    let properties = "(";
    let values = "(";
    for (let property in entity) {
      if (entity[property]._ === "" || entity[property]._ === undefined) {
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
          logConsoleInfo(`Successfully added new row to table ${collection.id()}`);
          deferred.resolve(entity);
        },
        (error) => {
          const errorText = error.responseJSON?.message ?? JSON.stringify(error);
          handleError(errorText, "AddRowCassandra", `Error while adding new row to table ${collection.id()}`);
          deferred.reject(errorText);
        },
      )
      .finally(clearInProgressMessage);
    return deferred.promise;
  }

  public async updateDocument(
    collection: ViewModels.Collection,
    originalDocument: any,
    newEntity: Entities.ITableEntity,
  ): Promise<Entities.ITableEntity> {
    const clearMessage = NotificationConsoleUtils.logConsoleProgress(`Updating row ${originalDocument.RowKey._}`);

    try {
      let whereSegment = " WHERE";
      let keys: CassandraTableKey[] = collection.cassandraKeys.partitionKeys.concat(
        collection.cassandraKeys.clusteringKeys,
      );
      for (let keyIndex in keys) {
        const key = keys[keyIndex].property;
        const keyType = keys[keyIndex].type;
        whereSegment += this.isStringType(keyType)
          ? ` ${key} = '${newEntity[key]._}' AND`
          : ` ${key} = ${newEntity[key]._} AND`;
      }
      whereSegment = whereSegment.slice(0, whereSegment.length - 4);

      let updateQuery = `UPDATE ${collection.databaseId}.${collection.id()}`;
      let isPropertyUpdated = false;
      let isFirstPropertyToUpdate = true;
      for (let property in newEntity) {
        if (
          !originalDocument[property] ||
          newEntity[property]._.toString() !== originalDocument[property]._.toString()
        ) {
          if (newEntity[property]._.toString() === "" || newEntity[property]._ === undefined) {
            continue;
          }
          let propertyQuerySegment = this.isStringType(newEntity[property].$)
            ? `${property} = '${newEntity[property]._}',`
            : `${property} = ${newEntity[property]._},`;
          // Only add the "SET" keyword once
          if (isFirstPropertyToUpdate) {
            propertyQuerySegment = " SET " + propertyQuerySegment;
            isFirstPropertyToUpdate = false;
          }
          updateQuery += propertyQuerySegment;
          isPropertyUpdated = true;
        }
      }

      if (isPropertyUpdated) {
        updateQuery = updateQuery.slice(0, updateQuery.length - 1);
        updateQuery += whereSegment;
        await this.queryDocuments(collection, updateQuery);
      }

      let deleteQuery = `DELETE `;
      let isPropertyDeleted = false;
      for (let property in originalDocument) {
        if (property !== TableConstants.EntityKeyNames.RowKey && !newEntity[property] && !!originalDocument[property]) {
          deleteQuery += ` ${property},`;
          isPropertyDeleted = true;
        }
      }

      if (isPropertyDeleted) {
        deleteQuery = deleteQuery.slice(0, deleteQuery.length - 1);
        deleteQuery += ` FROM ${collection.databaseId}.${collection.id()}${whereSegment}`;
        await this.queryDocuments(collection, deleteQuery);
      }

      newEntity[TableConstants.EntityKeyNames.RowKey] = originalDocument[TableConstants.EntityKeyNames.RowKey];
      NotificationConsoleUtils.logConsoleInfo(`Successfully updated row ${newEntity.RowKey._}`);
      return newEntity;
    } catch (error) {
      handleError(error, "UpdateRowCassandra", "Failed to update row ${newEntity.RowKey._}");
      throw error;
    } finally {
      clearMessage();
    }
  }

  public async queryDocuments(
    collection: ViewModels.Collection,
    query: string,
    shouldNotify?: boolean,
    paginationToken?: string,
  ): Promise<Entities.IListTableEntitiesResult> {
    const clearMessage =
      shouldNotify && NotificationConsoleUtils.logConsoleProgress(`Querying rows for table ${collection.id()}`);
    try {
      const { authType, databaseAccount } = userContext;

      const apiEndpoint: string =
        authType === AuthType.EncryptedToken
          ? CassandraProxyAPIs.connectionStringQueryApi
          : CassandraProxyAPIs.queryApi;

      const data: any = await $.ajax(`${configContext.CASSANDRA_PROXY_ENDPOINT}/${apiEndpoint}`, {
        type: "POST",
        contentType: Constants.ContentType.applicationJson,
        data: JSON.stringify({
          accountName: databaseAccount?.name,
          cassandraEndpoint: this.trimCassandraEndpoint(databaseAccount?.properties.cassandraEndpoint),
          resourceId: databaseAccount?.id,
          keyspaceId: collection.databaseId,
          tableId: collection.id(),
          query,
          paginationToken,
        }),
        beforeSend: this.setCommonHeaders as any,
        cache: false,
      });
      shouldNotify &&
        NotificationConsoleUtils.logConsoleInfo(
          `Successfully fetched ${data.result.length} rows for table ${collection.id()}`,
        );
      return {
        Results: data.result,
        ContinuationToken: data.paginationToken,
      };
    } catch (error) {
      shouldNotify &&
        handleError(error, "QueryDocumentsCassandra", `Failed to query rows for table ${collection.id()}`);
      throw error;
    } finally {
      clearMessage?.();
    }
  }

  public async deleteDocuments(
    collection: ViewModels.Collection,
    entitiesToDelete: Entities.ITableEntity[],
  ): Promise<any> {
    const query = `DELETE FROM ${collection.databaseId}.${collection.id()} WHERE `;
    const partitionKeys: CassandraTableKey[] = collection.cassandraKeys.partitionKeys;
    await Promise.all(
      entitiesToDelete.map(async (currEntityToDelete: Entities.ITableEntity) => {
        const clearMessage = NotificationConsoleUtils.logConsoleProgress(`Deleting row ${currEntityToDelete.RowKey._}`);

        let currQuery = query;
        for (let partitionKeyIndex = 0; partitionKeyIndex < partitionKeys.length; partitionKeyIndex++) {
          const partitionKey: CassandraTableKey = partitionKeys[partitionKeyIndex];
          const partitionKeyValue: Entities.ITableEntityAttribute = currEntityToDelete[partitionKey.property];
          currQuery =
            currQuery +
            (this.isStringType(partitionKeyValue.$)
              ? `${partitionKey.property} = '${partitionKeyValue._}'`
              : `${partitionKey.property} = ${partitionKeyValue._}`);
          if (partitionKeyIndex < partitionKeys.length - 1) {
            currQuery = `${currQuery} AND `;
          }
        }
        try {
          await this.queryDocuments(collection, currQuery);
          NotificationConsoleUtils.logConsoleInfo(`Successfully deleted row ${currEntityToDelete.RowKey._}`);
        } catch (error) {
          handleError(error, "DeleteRowCassandra", `Error while deleting row ${currEntityToDelete.RowKey._}`);
          throw error;
        } finally {
          clearMessage();
        }
      }),
    );
  }

  public createKeyspace(
    cassandraEndpoint: string,
    resourceId: string,
    explorer: Explorer,
    createKeyspaceQuery: string,
  ): Q.Promise<any> {
    if (!createKeyspaceQuery) {
      return Q.reject("No query specified");
    }

    const deferred: Q.Deferred<any> = Q.defer();
    const clearInProgressMessage = logConsoleProgress(`Creating a new keyspace with query ${createKeyspaceQuery}`);
    this.createOrDeleteQuery(cassandraEndpoint, resourceId, createKeyspaceQuery)
      .then(
        (data: any) => {
          logConsoleInfo(`Successfully created a keyspace with query ${createKeyspaceQuery}`);
          deferred.resolve();
        },
        (error) => {
          const errorText = error.responseJSON?.message ?? JSON.stringify(error);
          handleError(
            errorText,
            "CreateKeyspaceCassandra",
            `Error while creating a keyspace with query ${createKeyspaceQuery}`,
          );
          deferred.reject(errorText);
        },
      )
      .finally(clearInProgressMessage);

    return deferred.promise.timeout(Constants.ClientDefaults.requestTimeoutMs);
  }

  public createTableAndKeyspace(
    cassandraEndpoint: string,
    resourceId: string,
    explorer: Explorer,
    createTableQuery: string,
    createKeyspaceQuery?: string,
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
        const clearInProgressMessage = logConsoleProgress(`Creating a new table with query ${createTableQuery}`);
        this.createOrDeleteQuery(cassandraEndpoint, resourceId, createTableQuery)
          .then(
            (data: any) => {
              logConsoleInfo(`Successfully created a table with query ${createTableQuery}`);
              deferred.resolve();
            },
            (error) => {
              const errorText = error.responseJSON?.message ?? JSON.stringify(error);
              handleError(
                errorText,
                "CreateTableCassandra",
                `Error while creating a table with query ${createTableQuery}`,
              );
              deferred.reject(errorText);
            },
          )
          .finally(clearInProgressMessage);
      },
      (reason) => {
        deferred.reject(reason);
      },
    );
    return deferred.promise;
  }

  public getTableKeys(collection: ViewModels.Collection): Q.Promise<CassandraTableKeys> {
    if (!!collection.cassandraKeys) {
      return Q.resolve(collection.cassandraKeys);
    }
    const clearInProgressMessage = logConsoleProgress(`Fetching keys for table ${collection.id()}`);
    const { authType, databaseAccount } = userContext;
    const apiEndpoint: string =
      authType === AuthType.EncryptedToken ? CassandraProxyAPIs.connectionStringKeysApi : CassandraProxyAPIs.keysApi;

    let endpoint = `${configContext.CASSANDRA_PROXY_ENDPOINT}/${apiEndpoint}`;
    const deferred = Q.defer<CassandraTableKeys>();

    $.ajax(endpoint, {
      type: "POST",
      contentType: Constants.ContentType.applicationJson,
      data: JSON.stringify({
        accountName: databaseAccount?.name,
        cassandraEndpoint: this.trimCassandraEndpoint(databaseAccount?.properties.cassandraEndpoint),
        resourceId: databaseAccount?.id,
        keyspaceId: collection.databaseId,
        tableId: collection.id(),
      }),
      beforeSend: this.setCommonHeaders as any,
      cache: false,
    })
      .then(
        (data: CassandraTableKeys) => {
          collection.cassandraKeys = data;
          logConsoleInfo(`Successfully fetched keys for table ${collection.id()}`);
          deferred.resolve(data);
        },
        (error: any) => {
          const errorText = error.responseJSON?.message ?? JSON.stringify(error);
          handleError(errorText, "FetchKeysCassandra", `Error fetching keys for table ${collection.id()}`);
          deferred.reject(errorText);
        },
      )
      .done(clearInProgressMessage);
    return deferred.promise;
  }

  public getTableSchema(collection: ViewModels.Collection): Q.Promise<CassandraTableKey[]> {
    if (!!collection.cassandraSchema) {
      return Q.resolve(collection.cassandraSchema);
    }
    const clearInProgressMessage = logConsoleProgress(`Fetching schema for table ${collection.id()}`);
    const { databaseAccount, authType } = userContext;
    const apiEndpoint: string =
      authType === AuthType.EncryptedToken
        ? CassandraProxyAPIs.connectionStringSchemaApi
        : CassandraProxyAPIs.schemaApi;
    let endpoint = `${configContext.CASSANDRA_PROXY_ENDPOINT}/${apiEndpoint}`;
    const deferred = Q.defer<CassandraTableKey[]>();

    $.ajax(endpoint, {
      type: "POST",
      contentType: Constants.ContentType.applicationJson,
      data: JSON.stringify({
        accountName: databaseAccount?.name,
        cassandraEndpoint: this.trimCassandraEndpoint(databaseAccount?.properties.cassandraEndpoint),
        resourceId: databaseAccount?.id,
        keyspaceId: collection.databaseId,
        tableId: collection.id(),
      }),
      beforeSend: this.setCommonHeaders as any,
      cache: false,
    })
      .then(
        (data: any) => {
          collection.cassandraSchema = data.columns;
          logConsoleInfo(`Successfully fetched schema for table ${collection.id()}`);
          deferred.resolve(data.columns);
        },
        (error: any) => {
          const errorText = error.responseJSON?.message ?? JSON.stringify(error);
          handleError(errorText, "FetchSchemaCassandra", `Error fetching schema for table ${collection.id()}`);
          deferred.reject(errorText);
        },
      )
      .done(clearInProgressMessage);
    return deferred.promise;
  }

  private createOrDeleteQuery(cassandraEndpoint: string, resourceId: string, query: string): Q.Promise<any> {
    const deferred = Q.defer();
    const { authType, databaseAccount } = userContext;
    const apiEndpoint: string =
      authType === AuthType.EncryptedToken
        ? CassandraProxyAPIs.connectionStringCreateOrDeleteApi
        : CassandraProxyAPIs.createOrDeleteApi;

    $.ajax(`${configContext.CASSANDRA_PROXY_ENDPOINT}/${apiEndpoint}`, {
      type: "POST",
      contentType: Constants.ContentType.applicationJson,
      data: JSON.stringify({
        accountName: databaseAccount?.name,
        cassandraEndpoint: this.trimCassandraEndpoint(cassandraEndpoint),
        resourceId: resourceId,
        query: query,
      }),
      beforeSend: this.setCommonHeaders as any,
      cache: false,
    }).then(
      (data: any) => {
        deferred.resolve();
      },
      (reason) => {
        deferred.reject(reason);
      },
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

  private setCommonHeaders: (xhr: XMLHttpRequest) => boolean = (xhr: XMLHttpRequest): boolean => {
    const authorizationHeaderMetadata: ViewModels.AuthorizationTokenHeaderMetadata = getAuthorizationHeader();
    xhr.setRequestHeader(authorizationHeaderMetadata.header, authorizationHeaderMetadata.token);

    if (isDataplaneRbacEnabledForProxyApi(userContext)) {
      xhr.setRequestHeader(Constants.HttpHeaders.entraIdToken, userContext.aadToken);
    }

    xhr.setRequestHeader(Constants.HttpHeaders.sessionId, userContext.sessionId);
    return true;
  };

  private isStringType(dataType: string): boolean {
    // TODO figure out rest of types that are considered strings by Cassandra (if any have been missed)
    return (
      dataType === TableConstants.CassandraType.Text ||
      dataType === TableConstants.CassandraType.Inet ||
      dataType === TableConstants.CassandraType.Ascii ||
      dataType === TableConstants.CassandraType.Varchar ||
      dataType === TableConstants.CassandraType.Timestamp ||
      dataType === TableConstants.CassandraType.Date
    );
  }

  private getCassandraPartitionKeyProperty(collection: ViewModels.Collection): string {
    return collection.cassandraKeys.partitionKeys[0].property;
  }
}
