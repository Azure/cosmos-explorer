import * as ko from "knockout";
import * as _ from "underscore";
import Q from "q";

import { Action } from "../../../Shared/Telemetry/TelemetryConstants";
import { CassandraTableKey, CassandraAPIDataClient } from "../TableDataClient";
import DataTableViewModel from "./DataTableViewModel";
import DataTableContextMenu from "./DataTableContextMenu";
import * as DataTableUtilities from "./DataTableUtilities";
import TableCommands from "./TableCommands";
import TableEntityCache from "./TableEntityCache";
import * as Constants from "../Constants";
import { Areas } from "../../../Common/Constants";
import * as Utilities from "../Utilities";
import * as Entities from "../Entities";
import QueryTablesTab from "../../Tabs/QueryTablesTab";
import * as TableEntityProcessor from "../TableEntityProcessor";
import * as TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";
import * as ErrorParserUtility from "../../../Common/ErrorParserUtility";
import * as DataModels from "../../../Contracts/DataModels";
import * as ViewModels from "../../../Contracts/ViewModels";

interface IListTableEntitiesSegmentedResult extends Entities.IListTableEntitiesResult {
  ExceedMaximumRetries?: boolean;
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
  public notifyColumnChanges: (enablePrompt: boolean, queryTablesTab: QueryTablesTab) => void;
  public tablePageStartIndex: number;
  public tableQuery: Entities.ITableQuery = {};
  public cqlQuery: ko.Observable<string>;
  public oDataQuery: ko.Observable<string>;
  public sqlQuery: ko.Observable<string>;
  public cache: TableEntityCache;
  public isCancelled: boolean = false;
  public queryErrorMessage: ko.Observable<string>;
  public id: string;

  constructor(tableCommands: TableCommands, queryTablesTab: QueryTablesTab) {
    super();
    this.cache = new TableEntityCache();
    this.queryErrorMessage = ko.observable<string>();
    this.queryTablesTab = queryTablesTab;
    // Enable Context menu for the data table.
    DataTableContextMenu.contextMenuFactory(this, tableCommands);
    this.id = `tableEntityListViewModel${this.queryTablesTab.tabId}`;
    this.cqlQuery = ko.observable<string>(
      `SELECT * FROM ${this.queryTablesTab.collection.databaseId}.${this.queryTablesTab.collection.id()}`
    );
    this.oDataQuery = ko.observable<string>();
    this.sqlQuery = ko.observable<string>("SELECT * FROM c");
  }

  public getTableEntityKeys(rowKey: string): Entities.IProperty[] {
    return [{ key: Constants.EntityKeyNames.RowKey, value: rowKey }];
  }

  public reloadTable(useSetting: boolean = true, resetHeaders: boolean = true): DataTables.DataTable {
    this.clearCache();
    this.clearSelection();
    this.isCancelled = false;

    this.useSetting = useSetting;
    if (resetHeaders) {
      this.updateHeaders([Constants.defaultHeader]);
    }
    return this.table.ajax.reload();
  }

  public updateHeaders(newHeaders: string[], notifyColumnChanges: boolean = false, enablePrompt: boolean = true): void {
    this.headers = newHeaders;
    if (notifyColumnChanges) {
      this.clearSelection();
      this.notifyColumnChanges(enablePrompt, this.queryTablesTab);
    }
  }

  /**
   * This callback function called by datatable to fetch the next page of data and render.
   * sSource - ajax URL of data source, ignored in our case as we are not using ajax.
   * aoData - details about the next page of data datatable expected to render.
   * fnCallback - is the render callback with data to render.
   * oSetting: current settings used for table initialization.
   */
  public renderNextPageAndupdateCache(sSource: any, aoData: any, fnCallback: any, oSettings: any) {
    var tablePageSize: number;
    var draw: number;
    var prefetchNeeded = true;
    var columnSortOrder: any;
    // Threshold(pages) for triggering cache prefetch.
    // If number remaining pages in cache falls below prefetchThreshold prefetch will be triggered.
    var prefetchThreshold = 10;
    var tableQuery = this.tableQuery;

    for (var index in aoData) {
      var data = aoData[index];
      if (data.name === "length") {
        tablePageSize = data.value;
      }
      if (data.name === "start") {
        this.tablePageStartIndex = data.value;
      }
      if (data.name === "draw") {
        draw = data.value;
      }
      if (data.name === "order") {
        columnSortOrder = data.value;
      }
    }
    // Try cache if valid.
    if (this.isCacheValid(tableQuery)) {
      // Check if prefetch needed.
      if (this.tablePageStartIndex + tablePageSize <= this.cache.length || this.allDownloaded) {
        prefetchNeeded = false;
        if (columnSortOrder && (!this.cache.sortOrder || !_.isEqual(this.cache.sortOrder, columnSortOrder))) {
          this.sortColumns(columnSortOrder, oSettings);
        }
        this.renderPage(fnCallback, draw, this.tablePageStartIndex, tablePageSize, oSettings);
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
      this.prefetchAndRender(
        tableQuery,
        this.tablePageStartIndex,
        tablePageSize,
        downloadSize,
        draw,
        fnCallback,
        oSettings,
        columnSortOrder
      );
    }
  }

  public addEntityToCache(entity: Entities.ITableEntity): Q.Promise<any> {
    // Delay the add operation if we are fetching data from server, so as to avoid race condition.
    if (this.cache.serverCallInProgress) {
      return Utilities.delay(this.pollingInterval).then(() => {
        return this.updateCachedEntity(entity);
      });
    }

    // Find the first item which is greater than the added entity.
    var oSettings: any = (<any>this.table).context[0];
    var index: number = _.findIndex(this.cache.data, (data: any) => {
      return this.dataComparer(data, entity, this.cache.sortOrder, oSettings) > 0;
    });

    // If no such item, then insert at last.
    var insertIndex: number = Utilities.ensureBetweenBounds(
      index < 0 ? this.cache.length : index,
      0,
      this.cache.length
    );

    this.cache.data.splice(insertIndex, 0, entity);

    // Finally, select newly added entity
    this.clearSelection();
    this.selected.push(entity);

    return Q.resolve(null);
  }

  public updateCachedEntity(entity: Entities.ITableEntity): Q.Promise<any> {
    // Delay the add operation if we are fetching data from server, so as to avoid race condition.
    if (this.cache.serverCallInProgress) {
      return Utilities.delay(this.pollingInterval).then(() => {
        return this.updateCachedEntity(entity);
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
      return Utilities.delay(this.pollingInterval).then(() => {
        return this.removeEntitiesFromCache(entities);
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

    // Show last available page if there is not enough data
    var pageInfo = this.table.page.info();
    if (this.cache.length <= pageInfo.start) {
      var availablePages = Math.ceil(this.cache.length / pageInfo.length);
      var pageToShow = availablePages > 0 ? availablePages - 1 : 0;
      this.table.page(pageToShow);
    }

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
          itemA = <string>(<any>rowA[col])._.toLowerCase();
          itemB = <string>(<any>rowB[col])._.toLowerCase();
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

  private prefetchAndRender(
    tableQuery: Entities.ITableQuery,
    tablePageStartIndex: number,
    tablePageSize: number,
    downloadSize: number,
    draw: number,
    renderCallBack: Function,
    oSettings: any,
    columnSortOrder: any
  ): void {
    this.queryErrorMessage(null);
    if (this.cache.serverCallInProgress) {
      return;
    }
    this.prefetchData(tableQuery, downloadSize, /* currentRetry */ 0)
      .then((result: IListTableEntitiesSegmentedResult) => {
        if (!result) {
          return;
        }

        var entities = this.cache.data;
        if (
          this.queryTablesTab.container.isPreferredApiCassandra() &&
          DataTableUtilities.checkForDefaultHeader(this.headers)
        ) {
          (<CassandraAPIDataClient>this.queryTablesTab.container.tableDataClient)
            .getTableSchema(this.queryTablesTab.collection)
            .then((headers: CassandraTableKey[]) => {
              this.updateHeaders(
                headers.map(header => header.property),
                true
              );
            });
        } else {
          var selectedHeadersUnion: string[] = DataTableUtilities.getPropertyIntersectionFromTableEntities(
            entities,
            this.queryTablesTab.container.isPreferredApiCassandra()
          );
          var newHeaders: string[] = _.difference(selectedHeadersUnion, this.headers);
          if (newHeaders.length > 0) {
            // Any new columns found will be added into headers array, which will trigger a re-render of the DataTable.
            // So there is no need to call it here.
            this.updateHeaders(newHeaders, /* notifyColumnChanges */ true);
          } else {
            if (columnSortOrder) {
              this.sortColumns(columnSortOrder, oSettings);
            }
            this.renderPage(renderCallBack, draw, tablePageStartIndex, tablePageSize, oSettings);
          }
        }

        if (result.ExceedMaximumRetries) {
          var message: string = "We are having trouble getting your data. Please try again."; // localize
        }
      })
      .catch((error: any) => {
        const parsedErrors = ErrorParserUtility.parse(error);
        var errors = parsedErrors.map((error: DataModels.ErrorDataModel) => {
          return <ViewModels.QueryError>{
            message: error.message,
            start: error.location ? error.location.start : undefined,
            end: error.location ? error.location.end : undefined,
            code: error.code,
            severity: error.severity
          };
        });
        this.queryErrorMessage(errors[0].message);
        if (this.queryTablesTab.onLoadStartKey != null && this.queryTablesTab.onLoadStartKey != undefined) {
          TelemetryProcessor.traceFailure(
            Action.Tab,
            {
              databaseAccountName: this.queryTablesTab.collection.container.databaseAccount().name,
              databaseName: this.queryTablesTab.collection.databaseId,
              collectionName: this.queryTablesTab.collection.id(),
              defaultExperience: this.queryTablesTab.collection.container.defaultExperience(),
              dataExplorerArea: Areas.Tab,
              tabTitle: this.queryTablesTab.tabTitle(),
              error: error
            },
            this.queryTablesTab.onLoadStartKey
          );
          this.queryTablesTab.onLoadStartKey = null;
        }
        DataTableUtilities.turnOffProgressIndicator();
      });
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
  private prefetchData(
    tableQuery: Entities.ITableQuery,
    downloadSize: number,
    currentRetry: number = 0
  ): Q.Promise<any> {
    if (!this.cache.serverCallInProgress) {
      this.cache.serverCallInProgress = true;
      this.allDownloaded = false;
      this.lastPrefetchTime = new Date().getTime();
      var time = this.lastPrefetchTime;

      var promise: Q.Promise<IListTableEntitiesSegmentedResult>;
      if (this._documentIterator && this.continuationToken) {
        // TODO handle Cassandra case

        promise = Q(this._documentIterator.fetchNext().then(response => response.resources)).then(
          (documents: any[]) => {
            let entities: Entities.ITableEntity[] = TableEntityProcessor.convertDocumentsToEntities(documents);
            let finalEntities: IListTableEntitiesSegmentedResult = <IListTableEntitiesSegmentedResult>{
              Results: entities,
              ContinuationToken: this._documentIterator.hasMoreResults()
            };
            return Q.resolve(finalEntities);
          }
        );
      } else if (this.continuationToken && this.queryTablesTab.container.isPreferredApiCassandra()) {
        promise = this.queryTablesTab.container.tableDataClient.queryDocuments(
          this.queryTablesTab.collection,
          this.cqlQuery(),
          true,
          this.continuationToken
        );
      } else {
        let query = this.sqlQuery();
        if (this.queryTablesTab.container.isPreferredApiCassandra()) {
          query = this.cqlQuery();
        }
        promise = this.queryTablesTab.container.tableDataClient.queryDocuments(
          this.queryTablesTab.collection,
          query,
          true
        );
      }
      return promise
        .then((result: IListTableEntitiesSegmentedResult) => {
          if (!this._documentIterator) {
            this._documentIterator = result.iterator;
          }
          var actualDownloadSize: number = 0;

          // If we hit this, it means another service call is triggered. We only handle the latest call.
          // And as another service call is during process, we don't set serverCallInProgress to false here.
          // Thus, end the prefetch.
          if (this.lastPrefetchTime !== time) {
            return Q.resolve(null);
          }

          var entities = result.Results;
          actualDownloadSize = entities.length;

          // Queries can fetch no results and still return a continuation header. See prefetchAndRender() method.
          this.continuationToken = this.isCancelled ? null : result.ContinuationToken;

          if (!this.continuationToken) {
            this.allDownloaded = true;
          }

          if (this.isCacheValid(tableQuery)) {
            // Append to cache.
            this.cache.data = this.cache.data.concat(entities.slice(0));
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

          // There are three possible results for a prefetch:
          // 1. Continuation token is null or fetched items' size reaches predefined.
          // 2. Continuation token is not null and fetched items' size hasn't reach predefined.
          //  2.1 Retry times has reached predefined maximum.
          //  2.2 Retry times hasn't reached predefined maximum.
          // Correspondingly,
          // For #1, end prefetch.
          // For #2.1, set prefetch exceeds maximum retry number and end prefetch.
          // For #2.2, go to next round prefetch.
          if (this.allDownloaded || nextDownloadSize === 0) {
            return Q.resolve(result);
          }

          if (currentRetry >= TableEntityListViewModel._maximumNumberOfPrefetchRetries) {
            result.ExceedMaximumRetries = true;
            return Q.resolve(result);
          }
          return this.prefetchData(tableQuery, nextDownloadSize, currentRetry + 1);
        })
        .catch((error: Error) => {
          this.cache.serverCallInProgress = false;
          return Q.reject(error);
        });
    }
    return null;
  }
}
