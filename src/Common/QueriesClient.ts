import * as _ from "underscore";
import * as DataModels from "../Contracts/DataModels";
import * as ViewModels from "../Contracts/ViewModels";
import DocumentId from "../Explorer/Tree/DocumentId";
import * as ErrorParserUtility from "./ErrorParserUtility";
import { BackendDefaults, HttpStatusCodes, SavedQueries } from "./Constants";
import { ConsoleDataType } from "../Explorer/Menus/NotificationConsole/NotificationConsoleComponent";
import { CosmosClient } from "./CosmosClient";
import { ItemDefinition, QueryIterator, Resource } from "@azure/cosmos";
import { Logger } from "./Logger";
import { NotificationConsoleUtils } from "../Utils/NotificationConsoleUtils";
import { QueryUtils } from "../Utils/QueryUtils";

export class QueriesClient implements ViewModels.QueriesClient {
  private static readonly PartitionKey: DataModels.PartitionKey = {
    paths: [`/${SavedQueries.PartitionKeyProperty}`],
    kind: BackendDefaults.partitionKeyKind,
    version: BackendDefaults.partitionKeyVersion
  };
  private static readonly FetchQuery: string = "SELECT * FROM c";
  private static readonly FetchMongoQuery: string = "{}";

  public constructor(private container: ViewModels.Explorer) {}

  public async setupQueriesCollection(): Promise<DataModels.Collection> {
    const queriesCollection: ViewModels.Collection = this.findQueriesCollection();
    if (queriesCollection) {
      return Promise.resolve(queriesCollection.rawDataModel);
    }

    const id = NotificationConsoleUtils.logConsoleMessage(
      ConsoleDataType.InProgress,
      "Setting up account for saving queries"
    );
    return this.container.documentClientUtility
      .getOrCreateDatabaseAndCollection({
        collectionId: SavedQueries.CollectionName,
        databaseId: SavedQueries.DatabaseName,
        partitionKey: QueriesClient.PartitionKey,
        offerThroughput: SavedQueries.OfferThroughput,
        databaseLevelThroughput: undefined
      })
      .then(
        (collection: DataModels.Collection) => {
          NotificationConsoleUtils.logConsoleMessage(
            ConsoleDataType.Info,
            "Successfully set up account for saving queries"
          );
          return Promise.resolve(collection);
        },
        (error: any) => {
          const stringifiedError: string = JSON.stringify(error);
          NotificationConsoleUtils.logConsoleMessage(
            ConsoleDataType.Error,
            `Failed to set up account for saving queries: ${stringifiedError}`
          );
          Logger.logError(stringifiedError, "setupQueriesCollection");
          return Promise.reject(stringifiedError);
        }
      )
      .finally(() => NotificationConsoleUtils.clearInProgressMessageWithId(id));
  }

  public async saveQuery(query: DataModels.Query): Promise<void> {
    const queriesCollection = this.findQueriesCollection();
    if (!queriesCollection) {
      const errorMessage: string = "Account not set up to perform saved query operations";
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Error,
        `Failed to save query ${query.queryName}: ${errorMessage}`
      );
      return Promise.reject(errorMessage);
    }

    try {
      this.validateQuery(query);
    } catch (error) {
      const errorMessage: string = "Invalid query specified";
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Error,
        `Failed to save query ${query.queryName}: ${errorMessage}`
      );
      return Promise.reject(errorMessage);
    }

    const id = NotificationConsoleUtils.logConsoleMessage(
      ConsoleDataType.InProgress,
      `Saving query ${query.queryName}`
    );
    query.id = query.queryName;
    return this.container.documentClientUtility
      .createDocument(queriesCollection, query)
      .then(
        (savedQuery: DataModels.Query) => {
          NotificationConsoleUtils.logConsoleMessage(
            ConsoleDataType.Info,
            `Successfully saved query ${query.queryName}`
          );
          return Promise.resolve();
        },
        (error: any) => {
          let errorMessage: string;
          const parsedError: DataModels.ErrorDataModel = ErrorParserUtility.parse(error)[0];
          if (parsedError.code === HttpStatusCodes.Conflict.toString()) {
            errorMessage = `Query ${query.queryName} already exists`;
          } else {
            errorMessage = parsedError.message;
          }
          NotificationConsoleUtils.logConsoleMessage(
            ConsoleDataType.Error,
            `Failed to save query ${query.queryName}: ${errorMessage}`
          );
          Logger.logError(JSON.stringify(parsedError), "saveQuery");
          return Promise.reject(errorMessage);
        }
      )
      .finally(() => NotificationConsoleUtils.clearInProgressMessageWithId(id));
  }

  public async getQueries(): Promise<DataModels.Query[]> {
    const queriesCollection = this.findQueriesCollection();
    if (!queriesCollection) {
      const errorMessage: string = "Account not set up to perform saved query operations";
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Error,
        `Failed to fetch saved queries: ${errorMessage}`
      );
      return Promise.reject(errorMessage);
    }

    const options: any = { enableCrossPartitionQuery: true };
    const id = NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.InProgress, "Fetching saved queries");
    return this.container.documentClientUtility
      .queryDocuments(SavedQueries.DatabaseName, SavedQueries.CollectionName, this.fetchQueriesQuery(), options)
      .then(
        (queryIterator: QueryIterator<ItemDefinition & Resource>) => {
          const fetchQueries = (firstItemIndex: number): Q.Promise<ViewModels.QueryResults> =>
            this.container.documentClientUtility.queryDocumentsPage(
              queriesCollection.id(),
              queryIterator,
              firstItemIndex,
              options
            );
          return QueryUtils.queryAllPages(fetchQueries).then(
            (results: ViewModels.QueryResults) => {
              let queries: DataModels.Query[] = _.map(results.documents, (document: DataModels.Query) => {
                if (!document) {
                  return undefined;
                }
                const { id, resourceId, query, queryName } = document;
                const parsedQuery: DataModels.Query = {
                  resourceId: resourceId,
                  queryName: queryName,
                  query: query,
                  id: id
                };
                try {
                  this.validateQuery(parsedQuery);
                  return parsedQuery;
                } catch (error) {
                  return undefined;
                }
              });
              queries = _.reject(queries, (parsedQuery: DataModels.Query) => !parsedQuery);
              NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Info, "Successfully fetched saved queries");
              return Promise.resolve(queries);
            },
            (error: any) => {
              const stringifiedError: string = JSON.stringify(error);
              NotificationConsoleUtils.logConsoleMessage(
                ConsoleDataType.Error,
                `Failed to fetch saved queries: ${stringifiedError}`
              );
              Logger.logError(stringifiedError, "getSavedQueries");
              return Promise.reject(stringifiedError);
            }
          );
        },
        (error: any) => {
          // should never get into this state but we handle this regardless
          const stringifiedError: string = JSON.stringify(error);
          NotificationConsoleUtils.logConsoleMessage(
            ConsoleDataType.Error,
            `Failed to fetch saved queries: ${stringifiedError}`
          );
          Logger.logError(stringifiedError, "getSavedQueries");
          return Promise.reject(stringifiedError);
        }
      )
      .finally(() => NotificationConsoleUtils.clearInProgressMessageWithId(id));
  }

  public async deleteQuery(query: DataModels.Query): Promise<void> {
    const queriesCollection = this.findQueriesCollection();
    if (!queriesCollection) {
      const errorMessage: string = "Account not set up to perform saved query operations";
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Error,
        `Failed to fetch saved queries: ${errorMessage}`
      );
      return Promise.reject(errorMessage);
    }

    try {
      this.validateQuery(query);
    } catch (error) {
      const errorMessage: string = "Invalid query specified";
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Error,
        `Failed to delete query ${query.queryName}: ${errorMessage}`
      );
    }

    const id = NotificationConsoleUtils.logConsoleMessage(
      ConsoleDataType.InProgress,
      `Deleting query ${query.queryName}`
    );
    query.id = query.queryName;
    const documentId: ViewModels.DocumentId = new DocumentId(
      {
        partitionKey: QueriesClient.PartitionKey,
        partitionKeyProperty: "id"
      } as ViewModels.DocumentsTab,
      query,
      query.queryName
    ); // TODO: Remove DocumentId's dependency on DocumentsTab
    const options: any = { partitionKey: query.resourceId };
    return this.container.documentClientUtility
      .deleteDocument(queriesCollection, documentId)
      .then(
        () => {
          NotificationConsoleUtils.logConsoleMessage(
            ConsoleDataType.Info,
            `Successfully deleted query ${query.queryName}`
          );
          return Promise.resolve();
        },
        (error: any) => {
          const stringifiedError: string = JSON.stringify(error);
          NotificationConsoleUtils.logConsoleMessage(
            ConsoleDataType.Error,
            `Failed to delete query ${query.queryName}: ${stringifiedError}`
          );
          Logger.logError(stringifiedError, "deleteQuery");
          return Promise.reject(stringifiedError);
        }
      )
      .finally(() => NotificationConsoleUtils.clearInProgressMessageWithId(id));
  }

  public getResourceId(): string {
    const databaseAccount: ViewModels.DatabaseAccount = CosmosClient.databaseAccount();
    const databaseAccountName: string = (databaseAccount && databaseAccount.name) || "";
    const subscriptionId: string = CosmosClient.subscriptionId() || "";
    const resourceGroup: string = CosmosClient.resourceGroup() || "";

    return `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.DocumentDb/databaseAccounts/${databaseAccountName}`;
  }

  private findQueriesCollection(): ViewModels.Collection {
    const queriesDatabase: ViewModels.Database = _.find(
      this.container.databases(),
      (database: ViewModels.Database) => database.id() === SavedQueries.DatabaseName
    );
    if (!queriesDatabase) {
      return undefined;
    }
    return _.find(
      queriesDatabase.collections(),
      (collection: ViewModels.Collection) => collection.id() === SavedQueries.CollectionName
    );
  }

  private validateQuery(query: DataModels.Query): void {
    if (!query || query.queryName == null || query.query == null || query.resourceId == null) {
      throw new Error("Invalid query specified");
    }
  }

  private fetchQueriesQuery(): string {
    if (this.container.isPreferredApiMongoDB()) {
      return QueriesClient.FetchMongoQuery;
    }
    return QueriesClient.FetchQuery;
  }
}
