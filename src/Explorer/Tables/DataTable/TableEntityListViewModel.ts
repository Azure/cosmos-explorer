import * as ko from "knockout";
import Q from "q";
import * as _ from "underscore";
import { Areas } from "../../../Common/Constants";
import * as ViewModels from "../../../Contracts/ViewModels";
import { Action } from "../../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../../UserContext";
import NewQueryTablesTab from "../../Tabs/QueryTablesTab/QueryTablesTab";
import * as Constants from "../Constants";
import { getQuotedCqlIdentifier } from "../CqlUtilities";
import * as Entities from "../Entities";
import { CassandraAPIDataClient, CassandraTableKey } from "../TableDataClient";
import * as TableEntityProcessor from "../TableEntityProcessor";
import * as Utilities from "../Utilities";
import * as DataTableUtilities from "./DataTableUtilities";
import DataTableViewModel from "./DataTableViewModel";
import TableCommands from "./TableCommands";
import TableEntityCache from "./TableEntityCache";

interface IListTableEntitiesSegmentedResult extends Entities.IListTableEntitiesResult {
  ExceedMaximumRetries?: boolean;
}

export interface ErrorDataModel {
  message: string;
  severity?: string;
  location?: {
    start: string;
    end: string;
  };
  code?: string;
}

function parseError(err: any): ErrorDataModel[] {
  try {
    return _parse(err);
  } catch (e) {
    return [<ErrorDataModel>{ message: JSON.stringify(err) }];
  }
}

function _parse(err: any): ErrorDataModel[] {
  var normalizedErrors: ErrorDataModel[] = [];
  if (err.message && !err.code) {
    normalizedErrors.push(err);
  } else {
    const innerErrors: any[] = _getInnerErrors(err.message);
    normalizedErrors = innerErrors.map((innerError) =>
      typeof innerError === "string" ? { message: innerError } : innerError
    );
  }

  return normalizedErrors;
}

function _getInnerErrors(message: string): any[] {
  /*
            The backend error message has an inner-message which is a stringified object. 
            For SQL errors, the "errors" property is an array of SqlErrorDataModel.
            Example:
                "Message: {"Errors":["Resource with specified id or name already exists"]}\r\nActivityId: 80005000008d40b6a, Request URI: /apps/19000c000c0a0005/services/mctestdocdbprod-MasterService-0-00066ab9937/partitions/900005f9000e676fb8/replicas/13000000000955p"
            For non-SQL errors the "Errors" propery is an array of string.
            Example:
                "Message: {"errors":[{"severity":"Error","location":{"start":7,"end":8},"code":"SC1001","message":"Syntax error, incorrect syntax near '.'."}]}\r\nActivityId: d3300016d4084e310a, Request URI: /apps/12401f9e1df77/services/dc100232b1f44545/partitions/f86f3bc0001a2f78/replicas/13085003638s"
        */

  let innerMessage: any = null;

  const singleLineMessage = message.replace(/[\r\n]|\r|\n/g, "");
  try {
    // Multi-Partition error flavor
    const regExp = /^(.*)ActivityId: (.*)/g;
    const regString = regExp.exec(singleLineMessage);
    const innerMessageString = regString[1];
    innerMessage = JSON.parse(innerMessageString);
  } catch (e) {
    // Single-partition error flavor
    const regExp = /^Message: (.*)ActivityId: (.*), Request URI: (.*)/g;
    const regString = regExp.exec(singleLineMessage);
    const innerMessageString = regString[1];
    innerMessage = JSON.parse(innerMessageString);
  }

  return innerMessage.errors ? innerMessage.errors : innerMessage.Errors;
}

/**
 * Storage Table Entity List ViewModel
 */
export default class TableEntityListViewModel extends DataTableViewModel {
  // This is the number of retry attempts to fetch entities when the Azure Table service returns no results with a continuation token.
  // This number should ideally accommodate the service default timeout for queries of 30s, where each individual query execution can
  // take *up* to 5s (see https://msdn.microsoft.com/en-us/library/azure/dd135718.aspx).
  // To be on the safe side, we are setting the total number of attempts to 120, assuming up to 4 queries per second (120q = 30s * 4q/s).
  // Experimentation also validates this "safe number": queries against a 10 million entity table took up to 13 fetch attempts.
  private static _maximumNumberOfPrefetchRetries = 120 - 1;

  /* Observables */
  public headers: string[] = [Constants.defaultHeader];
  public useSetting: boolean = true;

  //public tableExplorerContext: TableExplorerContext;
  public notifyColumnChanges: (enablePrompt: boolean, queryTablesTab: NewQueryTablesTab) => void;

  public tablePageStartIndex: number;
  public tableQuery: Entities.ITableQuery = {};
  public cqlQuery: ko.Observable<string>;
  public oDataQuery: ko.Observable<string>;
  public sqlQuery: ko.Observable<string>;
  public cache: TableEntityCache;
  public isCancelled: boolean = false;
  public queryErrorMessage: ko.Observable<string>;
  public id: string;

  constructor(tableCommands: TableCommands, queryTablesTab: NewQueryTablesTab) {
    super();
    this.cache = new TableEntityCache();
    this.queryErrorMessage = ko.observable<string>();
    this.queryTablesTab = queryTablesTab;
    this.id = `tableEntityListViewModel${this.queryTablesTab.tabId}`;
    this.cqlQuery = ko.observable<string>(
      `SELECT * FROM ${getQuotedCqlIdentifier(this.queryTablesTab.collection.databaseId)}.${getQuotedCqlIdentifier(
        this.queryTablesTab.collection.id()
      )}`
    );
    this.oDataQuery = ko.observable<string>();
    this.sqlQuery = ko.observable<string>("SELECT * FROM c");
  }

  public getTableEntityKeys(rowKey: string): Entities.IProperty[] {
    return [{ key: Constants.EntityKeyNames.RowKey, value: rowKey }];
  }

  public updateHeaders(newHeaders: string[], notifyColumnChanges: boolean = false, enablePrompt: boolean = true): void {
    this.headers = newHeaders;
  }

  /**
   * This callback function called by datatable to fetch the next page of data and render.
   * sSource - ajax URL of data source, ignored in our case as we are not using ajax.
   * aoData - details about the next page of data datatable expected to render.
   * fnCallback - is the render callback with data to render.
   * oSetting: current settings used for table initialization.
   */

  public async renderNextPageAndupdateCache(): Promise<Entities.ITableEntity[]> {
    var tablePageSize: number;
    var prefetchNeeded = true;
    // Threshold(pages) for triggering cache prefetch.
    // If number remaining pages in cache falls below prefetchThreshold prefetch will be triggered.
    var prefetchThreshold = 10;
    var tableQuery = this.tableQuery;

    // Try cache if valid.
    if (this.isCacheValid(tableQuery)) {
      // Check if prefetch needed.
      if (this.tablePageStartIndex + tablePageSize <= this.cache.length || this.allDownloaded) {
        prefetchNeeded = false;
        this.tablePageStartIndex = 0;
        this.renderPage(this.tablePageStartIndex, this.cache.length);
        if (
          !this.allDownloaded &&
          this.tablePageStartIndex > 0 && // This is a case now that we can hit this as we re-construct table when we update column
          this.cache.length - this.tablePageStartIndex + tablePageSize < prefetchThreshold * tablePageSize
        ) {
          prefetchNeeded = true;
        }
      } else {
        prefetchNeeded = true;
      }
    } else {
      this.clearCache();
    }

    if (prefetchNeeded) {
      var downloadSize = tableQuery.top || this.downloadSize;
      return await this.prefetchAndRender(tableQuery, 0, tablePageSize, downloadSize);
    } else {
      return this.cache.data;
    }
  }

  public addEntityToCache(entity: Entities.ITableEntity): Q.Promise<any> {
    // Delay the add operation if we are fetching data from server, so as to avoid race condition.
    if (this.cache.serverCallInProgress) {
      Utilities.delay(this.pollingInterval).then(() => {
        this.updateCachedEntity(entity);
      });
    }

    this.cache.data.splice(this.cache.length, 0, entity);

    // Finally, select newly added entity
    this.clearSelection();
    this.selected.push(entity);

    return Q.resolve(null);
  }

  public updateCachedEntity(entity: Entities.ITableEntity): Q.Promise<any> {
    // Delay the add operation if we are fetching data from server, so as to avoid race condition.
    if (this.cache.serverCallInProgress) {
      Utilities.delay(this.pollingInterval).then(() => {
        this.updateCachedEntity(entity);
      });
    }
    var oldEntityIndex: number = _.findIndex(
      this.cache.data,
      (data: Entities.ITableEntity) => data.RowKey._ === entity.RowKey._
    );

    this.cache.data.splice(oldEntityIndex, 1, entity);

    return Q.resolve(null);
  }

  public removeEntitiesFromCache(entities: Entities.ITableEntity[]): Q.Promise<any> {
    if (!entities) {
      return Q.resolve(null);
    }

    // Delay the remove operation if we are fetching data from server, so as to avoid race condition.
    if (this.cache.serverCallInProgress) {
      Utilities.delay(this.pollingInterval).then(() => {
        this.removeEntitiesFromCache(entities);
      });
    }

    entities &&
      entities.forEach((entity: Entities.ITableEntity) => {
        var cachedIndex: number = _.findIndex(
          this.cache.data,
          (e: Entities.ITableEntity) => e.RowKey._ === entity.RowKey._
        );
        if (cachedIndex >= 0) {
          this.cache.data.splice(cachedIndex, 1);
        }
      });
    this.clearSelection();

    return Q.resolve(null);
  }

  protected dataComparer(
    item1: Entities.ITableEntity,
    item2: Entities.ITableEntity,
    sortOrder: any[],
    oSettings: any
  ): number {
    var sort: any;
    var itemA: any;
    var itemB: any;
    var length: number = $.isArray(sortOrder) ? sortOrder.length : 0; // sortOrder can be null
    var rowA: Entities.ITableEntity = item1;
    var rowB: Entities.ITableEntity = item2;

    for (var k = 0; k < length; k++) {
      sort = sortOrder[k];
      var col = oSettings.aoColumns[sort.column].mData;

      // If the value is null or undefined, show them at last
      var isItem1NullOrUndefined = _.isNull(rowA[col]) || _.isUndefined(rowA[col]);
      var isItem2NullOrUndefined = _.isNull(rowB[col]) || _.isUndefined(rowB[col]);

      if (isItem1NullOrUndefined || isItem2NullOrUndefined) {
        if (isItem1NullOrUndefined && isItem2NullOrUndefined) {
          return 0;
        }
        return isItem1NullOrUndefined ? 1 : -1;
      }

      switch ((<any>rowA[col]).$) {
        case Constants.TableType.Int32:
        case Constants.TableType.Int64:
        case Constants.CassandraType.Int:
        case Constants.CassandraType.Bigint:
        case Constants.CassandraType.Smallint:
        case Constants.CassandraType.Varint:
        case Constants.CassandraType.Tinyint:
          itemA = parseInt(<string>(<any>rowA[col])._, 0);
          itemB = parseInt(<string>(<any>rowB[col])._, 0);
          break;
        case Constants.TableType.Double:
        case Constants.CassandraType.Double:
        case Constants.CassandraType.Float:
        case Constants.CassandraType.Decimal:
          itemA = parseFloat(<string>(<any>rowA[col])._);
          itemB = parseFloat(<string>(<any>rowB[col])._);
          break;
        case Constants.TableType.DateTime:
          itemA = new Date(<string>(<any>rowA[col])._);
          itemB = new Date(<string>(<any>rowB[col])._);
          break;
        default:
          itemA = <string>(<any>rowA[col])._?.toLowerCase();
          itemB = <string>(<any>rowB[col])._?.toLowerCase();
      }
      var compareResult: number = itemA < itemB ? -1 : itemA > itemB ? 1 : 0;
      if (compareResult !== 0) {
        return sort.dir === "asc" ? compareResult : -compareResult;
      }
    }
    return 0;
  }

  protected isCacheValid(tableQuery: Entities.ITableQuery): boolean {
    // Return false if either cache has no data or the search criteria don't match!
    if (!this.cache || !this.cache.data || this.cache.length === 0) {
      return false;
    }

    if (!tableQuery && !this.cache.tableQuery) {
      return true;
    }

    // Compare by value using JSON representation
    if (JSON.stringify(this.cache.tableQuery) !== JSON.stringify(tableQuery)) {
      return false;
    }
    return true;
  }

  // Override as table entity has special keys for a Data Table row.
  /**
   * @override
   */
  protected matchesKeys(item: Entities.ITableEntity, itemKeys: Entities.IProperty[]): boolean {
    return itemKeys.every((property: Entities.IProperty) => {
      return this.stringCompare(item[property.key]._, property.value);
    });
  }

  private async prefetchAndRender(
    tableQuery: Entities.ITableQuery,
    tablePageStartIndex: number,
    tablePageSize: number,
    downloadSize: number
  ): Promise<Entities.ITableEntity[]> {
    this.queryErrorMessage(null);
    if (this.cache.serverCallInProgress) {
      return undefined;
    }
    try {
      const result = await this.prefetchData(tableQuery, downloadSize, /* currentRetry */ 0);
      if (!result) {
        return undefined;
      }
      // Cache is assigned using prefetchData
      var entities = this.cache.data;
      if (userContext.apiType === "Cassandra" && DataTableUtilities.checkForDefaultHeader(this.headers)) {
        (<CassandraAPIDataClient>this.queryTablesTab.container.tableDataClient)
          .getTableSchema(this.queryTablesTab.collection)
          .then((headers: CassandraTableKey[]) => {
            this.updateHeaders(
              headers.map((header) => header.property),
              true
            );
          });
      } else {
        var selectedHeadersUnion: string[] = DataTableUtilities.getPropertyIntersectionFromTableEntities(
          entities,
          userContext.apiType === "Cassandra"
        );
        var newHeaders: string[] = _.difference(selectedHeadersUnion, this.headers);
        if (newHeaders.length > 0) {
          // Any new columns found will be added into headers array, which will trigger a re-render of the DataTable.
          // So there is no need to call it here.
          this.updateHeaders(newHeaders, /* notifyColumnChanges */ true);
        }
      }
      this.renderPage(tablePageStartIndex, entities.length);

      return result;
    } catch (error) {
      const parsedErrors = parseError(error);
      var errors = parsedErrors.map((error) => {
        return <ViewModels.QueryError>{
          message: error.message,
          start: error.location ? error.location.start : undefined,
          end: error.location ? error.location.end : undefined,
          code: error.code,
          severity: error.severity,
        };
      });
      this.queryErrorMessage(errors[0].message);
      if (this.queryTablesTab.onLoadStartKey != null && this.queryTablesTab.onLoadStartKey != undefined) {
        TelemetryProcessor.traceFailure(
          Action.Tab,
          {
            databaseName: this.queryTablesTab.collection.databaseId,
            collectionName: this.queryTablesTab.collection.id(),
            dataExplorerArea: Areas.Tab,
            tabTitle: this.queryTablesTab.tabTitle(),
            error: error,
          },
          this.queryTablesTab.onLoadStartKey
        );
        this.queryTablesTab.onLoadStartKey = null;
      }
    }
    return undefined;
  }

  /**
   * Keep recursively prefetching items if:
   *  1. Continuation token is not null
   *  2. And prefetched items hasn't reach predefined cache size.
   *  3. And retry times hasn't reach the predefined maximum retry number.
   *
   * It is possible for a query to return no results but still return a continuation header (e.g. if the query takes too long).
   * If this is the case, we try to fetch entities again.
   * Note that this also means that we can get less entities than the requested download size in a successful call.
   * See Microsoft Azure API Documentation at: https://msdn.microsoft.com/en-us/library/azure/dd135718.aspx
   */

  private async prefetchData(
    tableQuery: Entities.ITableQuery,
    downloadSize: number,
    currentRetry: number = 0
  ): Promise<any> {
    var entities: any;
    if (!this.cache.serverCallInProgress) {
      this.cache.serverCallInProgress = true;
      this.allDownloaded = false;
      this.lastPrefetchTime = new Date().getTime();
      var time = this.lastPrefetchTime;

      try {
        if (this._documentIterator && this.continuationToken) {
          // TODO handle Cassandra case
          const fetchNext = await this._documentIterator.fetchNext();
          let fetchNextEntities: Entities.ITableEntity[] = TableEntityProcessor.convertDocumentsToEntities(
            fetchNext.resources
          );
          let finalEntities: IListTableEntitiesSegmentedResult = <IListTableEntitiesSegmentedResult>{
            Results: fetchNextEntities,
            ContinuationToken: this._documentIterator.hasMoreResults(),
          };
          entities = finalEntities;
        } else if (this.continuationToken && userContext.apiType === "Cassandra") {
          entities = await this.queryTablesTab.container.tableDataClient.queryDocuments(
            this.queryTablesTab.collection,
            this.cqlQuery(),
            true,
            this.continuationToken
          );
        } else {
          let query = this.sqlQuery();
          if (userContext.apiType === "Cassandra") {
            query = this.cqlQuery();
          }
          entities = await this.queryTablesTab.container.tableDataClient.queryDocuments(
            this.queryTablesTab.collection,
            query,
            true
          );
        }

        const result = entities;
        if (result) {
          if (!this._documentIterator) {
            this._documentIterator = result.iterator;
          }
          var actualDownloadSize: number = 0;

          // If we hit this, it means another service call is triggered. We only handle the latest call.
          // And as another service call is during process, we don't set serverCallInProgress to false here.
          // Thus, end the prefetch.
          if (this.lastPrefetchTime !== time) {
            return Promise.resolve(undefined);
          }

          var entities = result.Results;
          actualDownloadSize = entities.length;

          // Queries can fetch no results and still return a continuation header. See prefetchAndRender() method.
          this.continuationToken = this.isCancelled ? undefined : result.ContinuationToken;

          if (!this.continuationToken) {
            this.allDownloaded = true;
          }

          if (this.isCacheValid(tableQuery)) {
            // Append to cache.
            this.cache.data = this.cache.data.concat(entities.slice(0));
            var p = new Promise<Entities.ITableEntity[]>((resolve) => {
              if (this.cache.data) {
                resolve(this.cache.data);
              }
            });
            return p;
          } else {
            // Create cache.
            this.cache.data = entities;
          }

          this.cache.tableQuery = tableQuery;
          this.cache.serverCallInProgress = false;

          var nextDownloadSize: number = downloadSize - actualDownloadSize;
          if (nextDownloadSize === 0 && tableQuery.top) {
            this.allDownloaded = true;
          }

          if (this.allDownloaded || nextDownloadSize === 0) {
            return Promise.resolve(result);
          }

          if (currentRetry >= TableEntityListViewModel._maximumNumberOfPrefetchRetries) {
            result.ExceedMaximumRetries = true;
            return Promise.resolve(result);
          }
          return this.prefetchData(tableQuery, nextDownloadSize, currentRetry + 1);
        }
      } catch (error) {
        this.cache.serverCallInProgress = false;
        return Promise.reject(error);
      }
    }
  }
}
