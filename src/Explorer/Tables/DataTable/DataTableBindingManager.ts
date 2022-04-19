import * as ko from "knockout";
import * as _ from "underscore";
import QueryTablesTab from "../../Tabs/QueryTablesTab";
import * as Constants from "../Constants";
import * as Entities from "../Entities";
import * as Utilities from "../Utilities";
import * as DataTableBuilder from "./DataTableBuilder";
import DataTableOperationManager from "./DataTableOperationManager";
import * as DataTableOperations from "./DataTableOperations";
import TableEntityListViewModel from "./TableEntityListViewModel";

/**
 * Custom binding manager of datatable
 */
const tableEntityListViewModelMap: {
  [key: string]: {
    tableViewModel: TableEntityListViewModel;
    operationManager: DataTableOperationManager;
    $dataTable: JQuery;
  };
} = {};

//eslint-disable-next-line
function bindDataTable(element: any, bindingContext: any) {
  const tableEntityListViewModel = bindingContext.$data;
  tableEntityListViewModel.notifyColumnChanges = onTableColumnChange;
  const $dataTable = $(element);
  const queryTablesTab = bindingContext.$parent;
  const operationManager = new DataTableOperationManager(
    $dataTable,
    tableEntityListViewModel,
    queryTablesTab.tableCommands
  );

  tableEntityListViewModelMap[queryTablesTab.tabId] = {
    tableViewModel: tableEntityListViewModel,
    operationManager: operationManager,
    $dataTable: $dataTable,
  };

  createDataTable(0, tableEntityListViewModel, queryTablesTab); // Fake a DataTable to start.
  $(window).resize(updateTableScrollableRegionMetrics);
  operationManager.focusTable(); // Also selects the first row if needed.
}

function onTableColumnChange(queryTablesTab: QueryTablesTab) {
  const columnsFilter: boolean[] = null;
  const tableEntityListViewModel = tableEntityListViewModelMap[queryTablesTab.tabId].tableViewModel;
  if (queryTablesTab.queryViewModel()) {
    queryTablesTab.queryViewModel().queryBuilderViewModel().updateColumnOptions();
  }
  createDataTable(
    tableEntityListViewModel.tablePageStartIndex,
    tableEntityListViewModel,
    queryTablesTab,
    true,
    columnsFilter
  );
}

function createDataTable(
  startIndex: number,
  tableEntityListViewModel: TableEntityListViewModel,
  queryTablesTab: QueryTablesTab,
  destroy = false,
  columnsFilter: boolean[] = null
): void {
  const $dataTable = tableEntityListViewModelMap[queryTablesTab.tabId].$dataTable;
  if (destroy) {
    // Find currently displayed columns.
    const currentColumns: string[] = tableEntityListViewModel.headers;

    // Calculate how many more columns need to added to the current table.
    const columnsToAdd: number = _.difference(tableEntityListViewModel.headers, currentColumns).length;

    // This is needed as current solution of adding column is more like a workaround
    // The official support for dynamically add column is not yet there
    // Please track github issue https://github.com/DataTables/DataTables/issues/273 for its offical support
    for (let i = 0; i < columnsToAdd; i++) {
      $(".dataTables_scrollHead table thead tr th").eq(0).after("<th></th>");
    }
    tableEntityListViewModel.table.destroy();
    $dataTable.empty();
  }

  const jsonColTable = [];

  for (let i = 0; i < tableEntityListViewModel.headers.length; i++) {
    jsonColTable.push({
      sTitle: tableEntityListViewModel.headers[i],
      data: tableEntityListViewModel.headers[i],
      aTargets: [i],
      mRender: bindColumn,
      // eslint-disable-next-line no-extra-boolean-cast
      visible: !!columnsFilter ? columnsFilter[i] : true,
    });
  }

  tableEntityListViewModel.table = DataTableBuilder.createDataTable($dataTable, <DataTables.Settings>{
    // WARNING!!! SECURITY: If you add new columns, make sure you encode them if they are user strings from Azure (see encodeText)
    // so that they don't get interpreted as HTML in our page.
    colReorder: true,
    aoColumnDefs: jsonColTable,
    stateSave: false,
    dom: "RZlfrtip",
    oColReorder: {
      iFixedColumns: 1,
    },
    displayStart: startIndex,
    bPaginate: true,
    pagingType: "full_numbers",
    bProcessing: true,
    oLanguage: {
      sInfo: "Results _START_ - _END_ of _TOTAL_",
      oPaginate: {
        sFirst: "<<",
        sNext: ">",
        sPrevious: "<",
        sLast: ">>",
      },
      sProcessing: '<img style="width: 28px; height: 6px; " src="images/LoadingIndicator_3Squares.gif">',
      oAria: {
        sSortAscending: "",
        sSortDescending: "",
      },
    },
    destroy: destroy,
    bInfo: true,
    bLength: false,
    bLengthChange: false,
    scrollX: true,
    scrollCollapse: true,
    iDisplayLength: 100,
    serverSide: true,
    ajax: queryTablesTab.tabId, // Using this settings to make sure for getServerData we update the table based on the appropriate tab
    fnServerData: getServerData,
    fnRowCallback: bindClientId,
    fnInitComplete: initializeTable,
    fnDrawCallback: updateSelectionStatus,
  });

  (tableEntityListViewModel.table.table(0).container() as Element)
    .querySelectorAll(Constants.htmlSelectors.dataTableHeaderTableSelector)
    .forEach((table) => {
      table.setAttribute(
        "summary",
        `Header for sorting results for container ${tableEntityListViewModel.queryTablesTab.collection.id()}`
      );
    });

  (tableEntityListViewModel.table.table(0).container() as Element)
    .querySelectorAll(Constants.htmlSelectors.dataTableBodyTableSelector)
    .forEach((table) => {
      table.setAttribute("summary", `Results for container ${tableEntityListViewModel.queryTablesTab.collection.id()}`);
    });
}
//eslint-disable-next-line
function bindColumn(data: any) {
  //eslint-disable-next-line
  let displayedValue: any = null;
  if (data) {
    displayedValue = data._;

    // SECURITY: Make sure we don't allow cross-site scripting by interpreting the values as HTML
    displayedValue = Utilities.htmlEncode(displayedValue);

    // Css' empty psuedo class can only tell the difference of whether a cell has values.
    // A cell has no values no matter it's empty or it has no such a property.
    // To distinguish between an empty cell and a non-existing property cell,
    // we add a whitespace to the empty cell so that css will treat it as a cell with values.
    if (displayedValue === "" && data.$ === Constants.TableType.String) {
      displayedValue = " ";
    }
  }
  return displayedValue;
}
//eslint-disable-next-line
function getServerData(sSource: any, aoData: any, fnCallback: any, oSettings: any) {
  tableEntityListViewModelMap[oSettings.ajax].tableViewModel.renderNextPageAndupdateCache(
    sSource,
    aoData,
    fnCallback,
    oSettings
  );
}

/**
 * Bind table data information to row element so that we can track back to the table data
 * from UI elements.
 */
function bindClientId(nRow: Node, aData: Entities.ITableEntity) {
  $(nRow).attr(Constants.htmlAttributeNames.dataTableRowKeyAttr, aData.RowKey._);
  return nRow;
}
//eslint-disable-next-line
function selectionChanged(bindingContext: any) {
  $(".dataTable tr.selected").attr("tabindex", "-1").removeClass("selected");

  const selected =
    bindingContext && bindingContext.$data && bindingContext.$data.selected && bindingContext.$data.selected();
  selected &&
    selected.forEach((b: Entities.ITableEntity) => {
      const sel = DataTableOperations.getRowSelector([
        {
          key: Constants.htmlAttributeNames.dataTableRowKeyAttr,
          value: b.RowKey && b.RowKey._ && b.RowKey._.toString(),
        },
      ]);

      $(sel).attr("tabindex", "0").focus().addClass("selected");
    });
  //selected = bindingContext.$data.selected();
}

function dataChanged() {
  // do nothing for now
}

function initializeTable(): void {
  updateTableScrollableRegionMetrics();
  initializeEventHandlers();
}

function updateTableScrollableRegionMetrics(): void {
  updateTableScrollableRegionHeight();
  updateTableScrollableRegionWidth();
}

/*
 * Update the table's scrollable region height. So the pagination control is always shown at the bottom of the page.
 */
function updateTableScrollableRegionHeight(): void {
  $(".tab-pane").each((index, tabElement) => {
    if (!$(tabElement).hasClass("tableContainer")) {
      return;
    }

    // Add some padding to the table so it doesn't get too close to the container border.
    const dataTablePaddingBottom = 10;
    const bodyHeight = $(window).height();
    const dataTablesScrollBodyPosY = $(tabElement).find(Constants.htmlSelectors.dataTableScrollBodySelector).offset()
      .top;
    const dataTablesInfoElem = $(tabElement).find(".dataTables_info");
    const dataTablesPaginateElem = $(tabElement).find(".dataTables_paginate");
    const notificationConsoleHeight = 32; /** Header height **/

    let scrollHeight =
      bodyHeight -
      dataTablesScrollBodyPosY -
      dataTablesPaginateElem.outerHeight(true) -
      dataTablePaddingBottom -
      notificationConsoleHeight;

    //info and paginate control are stacked
    if (dataTablesInfoElem.offset().top < dataTablesPaginateElem.offset().top) {
      scrollHeight -= dataTablesInfoElem.outerHeight(true);
    }

    // TODO This is a work around for setting the outerheight since we don't have access to the JQuery.outerheight(numberValue)
    // in the current version of JQuery we are using.  Ideally, we would upgrade JQuery and use this line instead:
    // $(Constants.htmlSelectors.dataTableScrollBodySelector).outerHeight(scrollHeight);
    const element = $(tabElement).find(Constants.htmlSelectors.dataTableScrollBodySelector)[0];
    const style = getComputedStyle(element);
    const actualHeight = parseInt(style.height);
    const change = element.offsetHeight - scrollHeight;
    $(tabElement)
      .find(Constants.htmlSelectors.dataTableScrollBodySelector)
      .height(actualHeight - change);
  });
}

/*
 * Update the table's scrollable region width to make efficient use of the remaining space.
 */
function updateTableScrollableRegionWidth(): void {
  $(".tab-pane").each((index, tabElement) => {
    if (!$(tabElement).hasClass("tableContainer")) {
      return;
    }

    const bodyWidth = $(window).width();
    const dataTablesScrollBodyPosLeft = $(tabElement).find(Constants.htmlSelectors.dataTableScrollBodySelector).offset()
      .left;
    const scrollWidth = bodyWidth - dataTablesScrollBodyPosLeft;

    // jquery datatables automatically sets width:100% to both the header and the body when we use it's column autoWidth feature.
    // We work around that by setting the height for it's container instead.
    $(tabElement).find(Constants.htmlSelectors.dataTableScrollContainerSelector).width(scrollWidth);
  });
}

function initializeEventHandlers(): void {
  const $headers: JQuery = $(Constants.htmlSelectors.dataTableHeaderTypeSelector);
  const $firstHeader: JQuery = $headers.first();
  const firstIndex: string = $firstHeader.attr(Constants.htmlAttributeNames.dataTableHeaderIndex);

  $headers
    .on("keydown", (event: JQueryEventObject) => {
      Utilities.onEnter(event, ($sourceElement: JQuery) => {
        $sourceElement.css("background-color", Constants.cssColors.commonControlsButtonActive);
      });

      // Bind shift+tab from first header back to search input field
      Utilities.onTab(
        event,
        ($sourceElement: JQuery) => {
          const sourceIndex: string = $sourceElement.attr(Constants.htmlAttributeNames.dataTableHeaderIndex);

          if (sourceIndex === firstIndex) {
            event.preventDefault();
          }
        },
        /* metaKey */ null,
        /* shiftKey */ true,
        /* altKey */ null
      );

      // Also reset color if [shift-] tabbing away from button while holding down 'enter'
      Utilities.onTab(event, ($sourceElement: JQuery) => {
        $sourceElement.css("background-color", "");
      });
    })
    .on("keyup", (event: JQueryEventObject) => {
      Utilities.onEnter(event, ($sourceElement: JQuery) => {
        $sourceElement.css("background-color", "");
      });
    });
}
//eslint-disable-next-line
function updateSelectionStatus(oSettings: any): void {
  const $dataTableRows: JQuery = $(Constants.htmlSelectors.dataTableAllRowsSelector);
  if ($dataTableRows) {
    for (let i = 0; i < $dataTableRows.length; i++) {
      const $row: JQuery = $dataTableRows.eq(i);
      const rowKey: string = $row.attr(Constants.htmlAttributeNames.dataTableRowKeyAttr);
      const table = tableEntityListViewModelMap[oSettings.ajax].tableViewModel;
      if (table.isItemSelected(table.getTableEntityKeys(rowKey))) {
        $row.attr("tabindex", "0");
      }
    }
  }

  updateDataTableFocus(oSettings.ajax);

  DataTableOperations.setPaginationButtonEventHandlers();
}

// TODO consider centralizing this "post-command" logic into some sort of Command Manager entity.
// See VSO:166520: "[Storage Explorer] Consider adding a 'command manager' to track command post-effects."
function updateDataTableFocus(queryTablesTabId: string): void {
  const $activeElement: JQuery = $(document.activeElement);
  const isFocusLost: boolean = $activeElement.is("body"); // When focus is lost, "body" becomes the active element.
  const storageExplorerFrameHasFocus: boolean = document.hasFocus();
  const operationManager = tableEntityListViewModelMap[queryTablesTabId].operationManager;
  if (operationManager) {
    if (isFocusLost && storageExplorerFrameHasFocus) {
      // We get here when no control is active, meaning that the table update was triggered
      // from a dialog, the context menu or by clicking on a toolbar control or header.
      // Note that giving focus to the table also selects the first row if needed.
      // The document.hasFocus() ensures that the table will only get focus when the
      // focus was lost (i.e. "body has the focus") within the Storage Explorer frame
      // i.e. not when the focus is lost because it is in another frame
      // e.g. a daytona dialog or in the Activity Log.
      operationManager.focusTable();
    }
    if ($activeElement.is(".sorting_asc") || $activeElement.is(".sorting_desc")) {
      // If table header is selected, focus is shifted to the selected element as part of accessibility
      $activeElement && $activeElement.focus();
    } else {
      // If some control is active, we don't give focus back to the table,
      // just select the first row if needed (empty selection).
      operationManager.selectFirstIfNeeded();
    }
  }
}
//eslint-disable-next-line
(<any>ko.bindingHandlers).tableSource = {
  init: bindDataTable,
  update: dataChanged,
};
//eslint-disable-next-line
(<any>ko.bindingHandlers).tableSelection = {
  update: selectionChanged,
};
//eslint-disable-next-line
(<any>ko.bindingHandlers).readOnly = {
  //eslint-disable-next-line
  update: (element: any, valueAccessor: any) => {
    const value = ko.utils.unwrapObservable(valueAccessor());
    if (value) {
      element.setAttribute("readOnly", true);
    } else {
      element.removeAttribute("readOnly");
    }
  },
};
