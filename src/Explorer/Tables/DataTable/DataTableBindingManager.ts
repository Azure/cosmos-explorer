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
var tableEntityListViewModelMap: {
  [key: string]: {
    tableViewModel: TableEntityListViewModel;
    operationManager: DataTableOperationManager;
    $dataTable: JQuery;
  };
} = {};

function bindDataTable(element: any, valueAccessor: any, allBindings: any, viewModel: any, bindingContext: any) {
  var tableEntityListViewModel = bindingContext.$data;
  tableEntityListViewModel.notifyColumnChanges = onTableColumnChange;
  var $dataTable = $(element);
  var queryTablesTab = bindingContext.$parent;
  var operationManager = new DataTableOperationManager(
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
  // Attach the arrow key event handler to the table element
  $dataTable.on("keydown", (event: JQueryEventObject) => {
    handlearrowkey(element, valueAccessor, allBindings, viewModel, bindingContext, event);
  });
}

function onTableColumnChange(enablePrompt: boolean = true, queryTablesTab: QueryTablesTab) {
  var columnsFilter: boolean[] = null;
  var tableEntityListViewModel = tableEntityListViewModelMap[queryTablesTab.tabId].tableViewModel;
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
  destroy: boolean = false,
  columnsFilter: boolean[] = null
): void {
  var $dataTable = tableEntityListViewModelMap[queryTablesTab.tabId].$dataTable;
  if (destroy) {
    // Find currently displayed columns.
    var currentColumns: string[] = tableEntityListViewModel.headers;

    // Calculate how many more columns need to added to the current table.
    var columnsToAdd: number = _.difference(tableEntityListViewModel.headers, currentColumns).length;

    // This is needed as current solution of adding column is more like a workaround
    // The official support for dynamically add column is not yet there
    // Please track github issue https://github.com/DataTables/DataTables/issues/273 for its offical support
    for (var i = 0; i < columnsToAdd; i++) {
      $(".dataTables_scrollHead table thead tr th").eq(0).after("<th></th>");
    }
    tableEntityListViewModel.table.destroy();
    $dataTable.empty();
  }

  var jsonColTable = [];

  for (var i = 0; i < tableEntityListViewModel.headers.length; i++) {
    jsonColTable.push({
      sTitle: tableEntityListViewModel.headers[i],
      data: tableEntityListViewModel.headers[i],
      aTargets: [i],
      mRender: bindColumn,
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

function bindColumn(data: any, type: string, full: any) {
  var displayedValue: any = null;
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

function selectionChanged(element: any, valueAccessor: any, allBindings: any, viewModel: any, bindingContext: any) {
  $(".dataTable tr.selected").attr("tabindex", "-1").removeClass("selected");

  const selected =
    bindingContext && bindingContext.$data && bindingContext.$data.selected && bindingContext.$data.selected();
  selected &&
    selected.forEach((b: Entities.ITableEntity) => {
      var sel = DataTableOperations.getRowSelector([
        {
          key: Constants.htmlAttributeNames.dataTableRowKeyAttr,
          value: b.RowKey && b.RowKey._ && b.RowKey._.toString(),
        },
      ]);

      $(sel).attr("tabindex", "0").focus().addClass("selected");
    });
  //selected = bindingContext.$data.selected();
}
function handleArrowKey(
  element: any,
  valueAccessor: any,
  allBindings: any,
  viewModel: any,
  bindingContext: any,
  event: JQueryEventObject
) {
  let isUpArrowKey: boolean = event.keyCode === Constants.keyCodes.UpArrow;
  let isDownArrowKey: boolean = event.keyCode === Constants.keyCodes.DownArrow;

  if (isUpArrowKey || isDownArrowKey) {
    let $dataTable = $(element);
    let $selectedRow = $dataTable.find("tr.selected");

    if ($selectedRow.length === 0) {
      // No row is currently selected, select the first row
      $selectedRow = $dataTable.find("tr:first");
      $selectedRow.addClass("selected");
    } else {
      let $targetRow = isUpArrowKey ? $selectedRow.prev("tr") : $selectedRow.next("tr");

      if ($targetRow.length > 0) {
        // Remove the selected class from the current row and add it to the target row
        $selectedRow.removeClass("selected").attr("tabindex", "-1");
        $targetRow.addClass("selected").attr("tabindex", "0");
        $targetRow.focus();
      }
    }

    event.preventDefault();
  }
}

function dataChanged(element: any, valueAccessor: any, allBindings: any, viewModel: any, bindingContext: any) {
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
  $(".tab-pane").each(function (index, tabElement) {
    if (!$(tabElement).hasClass("tableContainer")) {
      return;
    }

    // Add some padding to the table so it doesn't get too close to the container border.
    var dataTablePaddingBottom = 10;
    var bodyHeight = $(window).height();
    var dataTablesScrollBodyPosY = $(tabElement).find(Constants.htmlSelectors.dataTableScrollBodySelector).offset().top;
    var dataTablesInfoElem = $(tabElement).find(".dataTables_info");
    var dataTablesPaginateElem = $(tabElement).find(".dataTables_paginate");
    const notificationConsoleHeight = 32; /** Header height **/

    var scrollHeight =
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
    var element = $(tabElement).find(Constants.htmlSelectors.dataTableScrollBodySelector)[0];
    var style = getComputedStyle(element);
    var actualHeight = parseInt(style.height);
    var change = element.offsetHeight - scrollHeight;
    $(tabElement)
      .find(Constants.htmlSelectors.dataTableScrollBodySelector)
      .height(actualHeight - change);
  });
}

/*
 * Update the table's scrollable region width to make efficient use of the remaining space.
 */
function updateTableScrollableRegionWidth(): void {
  $(".tab-pane").each(function (index, tabElement) {
    if (!$(tabElement).hasClass("tableContainer")) {
      return;
    }

    var bodyWidth = $(window).width();
    var dataTablesScrollBodyPosLeft = $(tabElement).find(Constants.htmlSelectors.dataTableScrollBodySelector).offset()
      .left;
    var scrollWidth = bodyWidth - dataTablesScrollBodyPosLeft;

    // jquery datatables automatically sets width:100% to both the header and the body when we use it's column autoWidth feature.
    // We work around that by setting the height for it's container instead.
    $(tabElement).find(Constants.htmlSelectors.dataTableScrollContainerSelector).width(scrollWidth);
  });
}

function initializeEventHandlers(): void {
  var $headers: JQuery = $(Constants.htmlSelectors.dataTableHeaderTypeSelector);
  var $firstHeader: JQuery = $headers.first();
  var firstIndex: string = $firstHeader.attr(Constants.htmlAttributeNames.dataTableHeaderIndex);

  $headers
    .on("keydown", (event: JQueryEventObject) => {
      Utilities.onEnter(event, ($sourceElement: JQuery) => {
        $sourceElement.css("background-color", Constants.cssColors.commonControlsButtonActive);
      });

      // Bind shift+tab from first header back to search input field
      Utilities.onTab(
        event,
        ($sourceElement: JQuery) => {
          var sourceIndex: string = $sourceElement.attr(Constants.htmlAttributeNames.dataTableHeaderIndex);

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

function updateSelectionStatus(oSettings: any): void {
  var $dataTableRows: JQuery = $(Constants.htmlSelectors.dataTableAllRowsSelector);
  if ($dataTableRows) {
    for (var i = 0; i < $dataTableRows.length; i++) {
      var $row: JQuery = $dataTableRows.eq(i);
      var rowKey: string = $row.attr(Constants.htmlAttributeNames.dataTableRowKeyAttr);
      var table = tableEntityListViewModelMap[oSettings.ajax].tableViewModel;
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
  var $activeElement: JQuery = $(document.activeElement);
  var isFocusLost: boolean = $activeElement.is("body"); // When focus is lost, "body" becomes the active element.
  var storageExplorerFrameHasFocus: boolean = document.hasFocus();
  var operationManager = tableEntityListViewModelMap[queryTablesTabId].operationManager;
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
    }
  }
}

(<any>ko.bindingHandlers).tableSource = {
  init: bindDataTable,
  update: dataChanged,
};

(<any>ko.bindingHandlers).tableSelection = {
  update: selectionChanged,
};

(<any>ko.bindingHandlers).readOnly = {
  update: function (element: any, valueAccessor: any) {
    var value = ko.utils.unwrapObservable(valueAccessor());
    if (value) {
      element.setAttribute("readOnly", true);
    } else {
      element.removeAttribute("readOnly");
    }
  },
};
