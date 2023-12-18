import * as ko from "knockout";
import * as _ from "underscore";

import { ItemDefinition, QueryIterator, Resource } from "@azure/cosmos";
import * as DataTables from "datatables.net";
import * as CommonConstants from "../../../Common/Constants";
import { Action } from "../../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";
import QueryTablesTab from "../../Tabs/QueryTablesTab";
import * as Constants from "../Constants";
import * as Entities from "../Entities";
import CacheBase from "./CacheBase";

// This is the format of the data we will have to pass to Datatable render callback,
// and property names are defined by Datatable as well.
export interface IDataTableRenderData {
  draw: number;
  aaData: any;
  recordsTotal: number;
  recordsFiltered: number;
}

abstract class DataTableViewModel {
  private static lastPageLabel = ">>"; // Localize
  private static loadMoreLabel = "Load more"; // Localize

  /* Observables */
  public items = ko.observableArray<Entities.ITableEntity>();
  public selected = ko.observableArray<Entities.ITableEntity>();

  public table: DataTables.Api<HTMLElement>;

  // The anchor item is for shift selection. i.e., select all items between anchor item and a give item.
  public lastSelectedAnchorItem: Entities.ITableEntity;
  public lastSelectedItem: Entities.ITableEntity;

  public cache: CacheBase<Entities.ITableEntity>;

  protected continuationToken: any;
  protected allDownloaded: boolean;
  protected lastPrefetchTime: number;
  protected downloadSize = 300;
  protected _documentIterator: QueryIterator<ItemDefinition & Resource>;

  // Used by table redraw throttling
  protected pollingInterval = 1000;
  private redrawInterval = 500;
  private pendingRedraw = false;
  private lastRedrawTime = new Date().getTime();

  private dataTableOperationManager: IDataTableOperation;

  public queryTablesTab: QueryTablesTab;

  constructor() {
    this.items([]);
    this.selected([]);
    // Late bound
    this.dataTableOperationManager = null;
  }

  public bind(dataTableOperationManager: IDataTableOperation): void {
    this.dataTableOperationManager = dataTableOperationManager;
  }

  public clearLastSelected(): void {
    this.lastSelectedItem = null;
    this.lastSelectedAnchorItem = null;
  }

  public clearCache(): void {
    this.cache.clear();
    this._documentIterator = null;
    this.continuationToken = null;
    this.allDownloaded = false;
  }

  public clearSelection(): void {
    this.selected.removeAll();
  }

  // Redraws the table, but guarantees that multiple sequential calls will not incur
  // another redraw until a certain time interval has passed.
  public redrawTableThrottled() {
    if (!this.pendingRedraw) {
      this.pendingRedraw = true;

      var current = new Date().getTime();
      var timeSinceLastRedraw = current - this.lastRedrawTime;
      var redraw = () => {
        this.table.draw(false /*reset*/);
        this.lastRedrawTime = new Date().getTime();
        this.pendingRedraw = false;
      };

      if (timeSinceLastRedraw > this.redrawInterval) {
        redraw();
      } else {
        var timeUntilNextRedraw = this.redrawInterval - timeSinceLastRedraw;
        setTimeout(() => redraw(), timeUntilNextRedraw);
      }
    }
  }

  public focusDataTable(): void {
    this.dataTableOperationManager.focusTable();
  }

  public getItemFromSelectedItems(itemKeys: Entities.IProperty[]): Entities.ITableEntity {
    return _.find(this.selected(), (item: Entities.ITableEntity) => {
      return this.matchesKeys(item, itemKeys);
    });
  }

  public getItemFromCurrentPage(itemKeys: Entities.IProperty[]): Entities.ITableEntity {
    return _.find(this.items(), (item: Entities.ITableEntity) => {
      return this.matchesKeys(item, itemKeys);
    });
  }

  public getItemIndexFromCurrentPage(itemKeys: Entities.IProperty[]): number {
    return _.findIndex(this.items(), (item: Entities.ITableEntity) => {
      return this.matchesKeys(item, itemKeys);
    });
  }

  public getItemIndexFromAllPages(itemKeys: Entities.IProperty[]): number {
    return _.findIndex(this.cache.data, (item: Entities.ITableEntity) => {
      return this.matchesKeys(item, itemKeys);
    });
  }

  public getItemsFromAllPagesWithinRange(start: number, end: number): Entities.ITableEntity[] {
    return this.cache.data.slice(start, end);
  }

  public isItemSelected(itemKeys: Entities.IProperty[]): boolean {
    return _.some(this.selected(), (item: Entities.ITableEntity) => {
      return this.matchesKeys(item, itemKeys);
    });
  }

  public isItemCached(itemKeys: Entities.IProperty[]): boolean {
    return _.some(this.cache.data, (item: Entities.ITableEntity) => {
      return this.matchesKeys(item, itemKeys);
    });
  }

  public getAllItemsInCurrentPage(): Entities.ITableEntity[] {
    return this.items();
  }

  public getAllItemsInCache(): Entities.ITableEntity[] {
    return this.cache.data;
  }

  protected abstract dataComparer(
    item1: Entities.ITableEntity,
    item2: Entities.ITableEntity,
    sortOrder: any,
    oSettings: any,
  ): number;
  protected abstract isCacheValid(validator: any): boolean;

  protected sortColumns(sortOrder: any, oSettings: any) {
    var self = this;
    this.clearSelection();
    this.cache.data.sort(function (a: any, b: any) {
      return self.dataComparer(a, b, sortOrder, oSettings);
    });
    this.cache.sortOrder = sortOrder;
  }

  protected renderPage(
    renderCallBack: any,
    draw: number,
    startIndex: number,
    pageSize: number,
    oSettings: any,
    postRenderTasks: (startIndex: number, pageSize: number) => Promise<void> = null,
  ) {
    this.updatePaginationControls(oSettings);

    // pageSize < 0 means to show all data
    var endIndex = pageSize < 0 ? this.cache.length : startIndex + pageSize;
    var renderData = this.cache.data.slice(startIndex, endIndex);

    this.items(renderData);

    var render: IDataTableRenderData = {
      draw: draw,
      aaData: renderData,
      recordsTotal: this.cache.length,
      recordsFiltered: this.cache.length,
    };

    if (!!postRenderTasks) {
      postRenderTasks(startIndex, pageSize).then(() => {
        this.table.rows().invalidate();
      });
    }
    renderCallBack(render);
    if (this.queryTablesTab.onLoadStartKey != null && this.queryTablesTab.onLoadStartKey != undefined) {
      TelemetryProcessor.traceSuccess(
        Action.Tab,
        {
          databaseName: this.queryTablesTab.collection.databaseId,
          collectionName: this.queryTablesTab.collection.id(),
          dataExplorerArea: CommonConstants.Areas.Tab,
          tabTitle: this.queryTablesTab.tabTitle(),
        },
        this.queryTablesTab.onLoadStartKey,
      );
      this.queryTablesTab.onLoadStartKey = null;
    }
  }

  protected matchesKeys(item: Entities.ITableEntity, itemKeys: Entities.IProperty[]): boolean {
    return itemKeys.every((property: Entities.IProperty) => {
      var itemValue = item[property.key];

      // if (itemValue && property.subkey) {
      //     itemValue = itemValue._[property.subkey];
      //     if (!itemValue) {
      //         itemValue = "";
      //     }
      // } else if (property.subkey) {
      //     itemValue = "";
      // }

      return this.stringCompare(itemValue._, property.value);
    });
  }

  /**
   * Default string comparison is case sensitive as most Azure resources' names are case sensitive.
   * Override this if a name, i.e., Azure File/Directory name, is case insensitive.
   */
  protected stringCompare(s1: string, s2: string): boolean {
    return s1 === s2;
  }

  private updatePaginationControls(oSettings: any) {
    var pageInfo = this.table.page.info();
    var pageSize = pageInfo.length;
    var paginateElement = $(oSettings.nTableWrapper).find(Constants.htmlSelectors.paginateSelector);

    if (this.allDownloaded) {
      if (this.cache.length <= pageSize) {
        // Hide pagination controls if everything fits in one page!.
        paginateElement.hide();
      } else {
        // Enable pagination controls.
        paginateElement.show();
        oSettings.oLanguage.oPaginate.sLast = DataTableViewModel.lastPageLabel;
      }
    } else {
      // Enable pagination controls and show load more button.
      paginateElement.show();
      oSettings.oLanguage.oPaginate.sLast = DataTableViewModel.loadMoreLabel;
    }
  }
}

interface IDataTableOperation {
  focusTable(): void;
}

export default DataTableViewModel;
