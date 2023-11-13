import { RetryOptions } from "@azure/cosmos";
import { getQueryRetryOptions } from "Common/HeadersUtility";
import { isServerlessAccount } from "Utils/CapabilityUtils";
import * as _ from "underscore";
import * as DataModels from "../Contracts/DataModels";
import * as ViewModels from "../Contracts/ViewModels";
import Explorer from "../Explorer/Explorer";
import DocumentsTab from "../Explorer/Tabs/DocumentsTab";
import DocumentId from "../Explorer/Tree/DocumentId";
import { useDatabases } from "../Explorer/useDatabases";
import { userContext } from "../UserContext";
import * as NotificationConsoleUtils from "../Utils/NotificationConsoleUtils";
import { BackendDefaults, HttpStatusCodes, SavedQueries } from "./Constants";
import { handleError } from "./ErrorHandlingUtils";
import { createCollection } from "./dataAccess/createCollection";
import { createDocument } from "./dataAccess/createDocument";
import { deleteDocument } from "./dataAccess/deleteDocument";
import { queryDocuments } from "./dataAccess/queryDocuments";

export class QueriesClient {
  private static readonly PartitionKey: DataModels.PartitionKey = {
    paths: [`/${SavedQueries.PartitionKeyProperty}`],
    kind: "Hash",
    version: BackendDefaults.partitionKeyVersion,
  };
  private static readonly FetchQuery: string = "SELECT * FROM c";
  private static readonly FetchMongoQuery: string = "{}";

  public constructor(private container: Explorer) {}

  public async setupQueriesCollection(): Promise<DataModels.Collection> {
    const queriesCollection: ViewModels.Collection = this.findQueriesCollection();
    if (queriesCollection) {
      return Promise.resolve(queriesCollection.rawDataModel);
    }

    const clearMessage = NotificationConsoleUtils.logConsoleProgress("Setting up account for saving queries");

    if (isServerlessAccount()) {
      return createCollection({
        collectionId: SavedQueries.CollectionName,
        createNewDatabase: true,
        databaseId: SavedQueries.DatabaseName,
        partitionKey: QueriesClient.PartitionKey,
        databaseLevelThroughput: false,
      });
    } else {
      return createCollection({
        collectionId: SavedQueries.CollectionName,
        createNewDatabase: true,
        databaseId: SavedQueries.DatabaseName,
        partitionKey: QueriesClient.PartitionKey,
        offerThroughput: SavedQueries.OfferThroughput,
        databaseLevelThroughput: false,
      })
        .then(
          (collection: DataModels.Collection) => {
            NotificationConsoleUtils.logConsoleInfo("Successfully set up account for saving queries");
            return Promise.resolve(collection);
          },
          (error: any) => {
            handleError(error, "setupQueriesCollection", "Failed to set up account for saving queries");
            return Promise.reject(error);
          },
        )
        .finally(() => clearMessage());
    }
  }

  public async saveQuery(query: DataModels.Query): Promise<void> {
    const queriesCollection = this.findQueriesCollection();
    if (!queriesCollection) {
      const errorMessage: string = "Account not set up to perform saved query operations";
      NotificationConsoleUtils.logConsoleError(`Failed to save query ${query.queryName}: ${errorMessage}`);
      return Promise.reject(errorMessage);
    }

    try {
      this.validateQuery(query);
    } catch (error) {
      const errorMessage: string = "Invalid query specified";
      NotificationConsoleUtils.logConsoleError(`Failed to save query ${query.queryName}: ${errorMessage}`);
      return Promise.reject(errorMessage);
    }

    const clearMessage = NotificationConsoleUtils.logConsoleProgress(`Saving query ${query.queryName}`);
    query.id = query.queryName;
    return createDocument(queriesCollection, query)
      .then(
        (savedQuery: DataModels.Query) => {
          NotificationConsoleUtils.logConsoleInfo(`Successfully saved query ${query.queryName}`);
          return Promise.resolve();
        },
        (error: any) => {
          if (error.code === HttpStatusCodes.Conflict.toString()) {
            error = `Query ${query.queryName} already exists`;
          }
          handleError(error, "saveQuery", `Failed to save query ${query.queryName}`);
          return Promise.reject(error);
        },
      )
      .finally(() => clearMessage());
  }

  public async getQueries(): Promise<DataModels.Query[]> {
    const queriesCollection = this.findQueriesCollection();
    if (!queriesCollection) {
      const errorMessage: string = "Account not set up to perform saved query operations";
      NotificationConsoleUtils.logConsoleError(`Failed to fetch saved queries: ${errorMessage}`);
      return Promise.reject(errorMessage);
    }

    const options: any = { enableCrossPartitionQuery: true };
    const retrySettings: RetryOptions = getQueryRetryOptions();
    const clearMessage = NotificationConsoleUtils.logConsoleProgress("Fetching saved queries");
    const results = await queryDocuments(
      SavedQueries.DatabaseName,
      SavedQueries.CollectionName,
      this.fetchQueriesQuery(),
      options,
      retrySettings,
    ).fetchAll();

    let queries: DataModels.Query[] = _.map(results.resources, (document: DataModels.Query) => {
      if (!document) {
        return undefined;
      }
      const { id, resourceId, query, queryName } = document;
      const parsedQuery: DataModels.Query = {
        resourceId: resourceId,
        queryName: queryName,
        query: query,
        id: id,
      };
      try {
        this.validateQuery(parsedQuery);
        return parsedQuery;
      } catch (error) {
        return undefined;
      }
    });
    queries = _.reject(queries, (parsedQuery: DataModels.Query) => !parsedQuery);
    NotificationConsoleUtils.logConsoleInfo("Successfully fetched saved queries");
    clearMessage();
    return queries;
  }

  public async deleteQuery(query: DataModels.Query): Promise<void> {
    const queriesCollection = this.findQueriesCollection();
    if (!queriesCollection) {
      const errorMessage: string = "Account not set up to perform saved query operations";
      NotificationConsoleUtils.logConsoleError(`Failed to fetch saved queries: ${errorMessage}`);
      return Promise.reject(errorMessage);
    }

    try {
      this.validateQuery(query);
    } catch (error) {
      const errorMessage: string = "Invalid query specified";
      NotificationConsoleUtils.logConsoleError(`Failed to delete query ${query.queryName}: ${errorMessage}`);
    }

    const clearMessage = NotificationConsoleUtils.logConsoleProgress(`Deleting query ${query.queryName}`);
    query.id = query.queryName;
    const documentId = new DocumentId(
      {
        partitionKey: QueriesClient.PartitionKey,
        partitionKeyProperties: ["id"],
      } as DocumentsTab,
      query,
      [query.queryName],
    ); // TODO: Remove DocumentId's dependency on DocumentsTab
    const options: any = { partitionKey: query.resourceId };
    return deleteDocument(queriesCollection, documentId)
      .then(
        () => {
          NotificationConsoleUtils.logConsoleInfo(`Successfully deleted query ${query.queryName}`);
          return Promise.resolve();
        },
        (error: any) => {
          handleError(error, "deleteQuery", `Failed to delete query ${query.queryName}`);
          return Promise.reject(error);
        },
      )
      .finally(() => clearMessage());
  }

  public getResourceId(): string {
    const { databaseAccount, subscriptionId = "", resourceGroup = "" } = userContext;
    const databaseAccountName = databaseAccount?.name || "";
    return `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.DocumentDb/databaseAccounts/${databaseAccountName}`;
  }

  private findQueriesCollection(): ViewModels.Collection {
    const queriesDatabase: ViewModels.Database = _.find(
      useDatabases.getState().databases,
      (database: ViewModels.Database) => database.id() === SavedQueries.DatabaseName,
    );
    if (!queriesDatabase) {
      return undefined;
    }
    return _.find(
      queriesDatabase.collections(),
      (collection: ViewModels.Collection) => collection.id() === SavedQueries.CollectionName,
    );
  }

  private validateQuery(query: DataModels.Query): void {
    if (!query || query.queryName == null || query.query == null || query.resourceId == null) {
      throw new Error("Invalid query specified");
    }
  }

  private fetchQueriesQuery(): string {
    if (userContext.apiType === "Mongo") {
      return QueriesClient.FetchMongoQuery;
    }
    return QueriesClient.FetchQuery;
  }
}
