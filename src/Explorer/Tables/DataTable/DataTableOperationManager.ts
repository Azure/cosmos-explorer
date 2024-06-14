import ko from "knockout";

import { isEnvironmentAltPressed, isEnvironmentCtrlPressed, isEnvironmentShiftPressed } from "Utils/KeyboardUtils";
import * as Constants from "../Constants";
import * as Entities from "../Entities";
import * as Utilities from "../Utilities";
import * as DataTableOperations from "./DataTableOperations";
import TableCommands from "./TableCommands";
import TableEntityListViewModel from "./TableEntityListViewModel";

/*
 * Base class for data table row selection.
 */
export default class DataTableOperationManager {
  private _tableEntityListViewModel: TableEntityListViewModel;
  private _tableCommands: TableCommands;
  private dataTable: JQuery<Element>;

  constructor(table: JQuery<Element>, viewModel: TableEntityListViewModel, tableCommands: TableCommands) {
    this.dataTable = table;
    this._tableEntityListViewModel = viewModel;
    this._tableCommands = tableCommands;

    this.bind();
    this._tableEntityListViewModel.bind(this);
  }

  private click = (event: JQueryEventObject) => {
    var elem: JQuery<Element> = $(event.currentTarget);
    this.updateLastSelectedItem(elem, event.shiftKey);

    if (isEnvironmentCtrlPressed(event)) {
      this.applyCtrlSelection(elem);
    } else if (event.shiftKey) {
      this.applyShiftSelection(elem);
    } else {
      this.applySingleSelection(elem);
    }
  };

  private doubleClick = (event: JQueryEventObject) => {
    this.tryOpenEditor();
  };

  private keyDown = (event: JQueryEventObject): boolean => {
    var isUpArrowKey: boolean = event.keyCode === Constants.keyCodes.UpArrow,
      isDownArrowKey: boolean = event.keyCode === Constants.keyCodes.DownArrow,
      handled: boolean = false;

    if (isUpArrowKey || isDownArrowKey) {
      var lastSelectedItem: Entities.ITableEntity = this._tableEntityListViewModel.lastSelectedItem;
      var dataTableRows: JQuery<Element> = $(Constants.htmlSelectors.dataTableAllRowsSelector);
      var maximumIndex = dataTableRows.length - 1;

      // If can't find an index for lastSelectedItem, then either no item is previously selected or it goes across page.
      // Simply select the first item in this case.
      var lastSelectedItemIndex = lastSelectedItem
        ? this._tableEntityListViewModel.getItemIndexFromCurrentPage(
            this._tableEntityListViewModel.getTableEntityKeys(lastSelectedItem.RowKey._),
          )
        : -1;
      var nextIndex: number = isUpArrowKey ? lastSelectedItemIndex - 1 : lastSelectedItemIndex + 1;
      var safeIndex: number = Utilities.ensureBetweenBounds(nextIndex, 0, maximumIndex);
      var selectedRowElement: JQuery<Element> = dataTableRows.eq(safeIndex);

      if (selectedRowElement) {
        if (event.shiftKey) {
          this.applyShiftSelection(selectedRowElement);
        } else {
          this.applySingleSelection(selectedRowElement);
        }

        this.updateLastSelectedItem(selectedRowElement, event.shiftKey);
        handled = true;
        DataTableOperations.scrollToRowIfNeeded(dataTableRows, safeIndex, isUpArrowKey);
      }
    } else if (
      isEnvironmentCtrlPressed(event) &&
      !isEnvironmentShiftPressed(event) &&
      !isEnvironmentAltPressed(event) &&
      event.keyCode === Constants.keyCodes.A
    ) {
      this.applySelectAll();
      handled = true;
    }

    return !handled;
  };

  // Note: There is one key up event each time a key is pressed;
  // in contrast, there may be more than one key down and key
  // pressed events.
  private keyUp = (event: JQueryEventObject): boolean => {
    var handled: boolean = false;

    switch (event.keyCode) {
      case Constants.keyCodes.Enter:
        handled = this.tryOpenEditor();
        break;
      case Constants.keyCodes.Delete:
        handled = this.tryHandleDeleteSelected();
        break;
    }

    return !handled;
  };

  private itemDropped = (event: JQueryEventObject): boolean => {
    var handled: boolean = false;
    var items = (<any>event.originalEvent).dataTransfer.items;

    if (!items) {
      // On browsers outside of Chromium
      // we can't discern between dirs and files
      // so we will disable drag & drop for now
      return null;
    }

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var entry = item.webkitGetAsEntry();

      if (entry.isFile) {
        // TODO: parse the file and insert content as entities
      }
    }

    return !handled;
  };

  private tryOpenEditor(): boolean {
    return this._tableCommands.tryOpenEntityEditor(this._tableEntityListViewModel);
  }

  private tryHandleDeleteSelected(): boolean {
    var selectedEntities: Entities.ITableEntity[] = this._tableEntityListViewModel.selected();
    var handled: boolean = false;

    if (selectedEntities && selectedEntities.length) {
      this._tableCommands.deleteEntitiesCommand(this._tableEntityListViewModel);
      handled = true;
    }

    return handled;
  }

  private getEntityIdentity($elem: JQuery<Element>): Entities.ITableEntityIdentity {
    return {
      RowKey: $elem.attr(Constants.htmlAttributeNames.dataTableRowKeyAttr),
    };
  }

  private updateLastSelectedItem($elem: JQuery<Element>, isShiftSelect: boolean) {
    var entityIdentity: Entities.ITableEntityIdentity = this.getEntityIdentity($elem);
    var entity = this._tableEntityListViewModel.getItemFromCurrentPage(
      this._tableEntityListViewModel.getTableEntityKeys(entityIdentity.RowKey),
    );

    this._tableEntityListViewModel.lastSelectedItem = entity;

    if (!isShiftSelect) {
      this._tableEntityListViewModel.lastSelectedAnchorItem = entity;
    }
  }

  private applySingleSelection($elem: JQuery<Element>) {
    if ($elem) {
      var entityIdentity: Entities.ITableEntityIdentity = this.getEntityIdentity($elem);

      this._tableEntityListViewModel.clearSelection();
      this.addToSelection(entityIdentity.RowKey);
    }
  }

  private applySelectAll() {
    this._tableEntityListViewModel.clearSelection();
    ko.utils.arrayPushAll<Entities.ITableEntity>(
      this._tableEntityListViewModel.selected,
      this._tableEntityListViewModel.getAllItemsInCurrentPage(),
    );
  }

  private applyCtrlSelection($elem: JQuery<Element>): void {
    var koSelected: ko.ObservableArray<Entities.ITableEntity> = this._tableEntityListViewModel
      ? this._tableEntityListViewModel.selected
      : null;

    if (koSelected) {
      var entityIdentity: Entities.ITableEntityIdentity = this.getEntityIdentity($elem);

      if (
        !this._tableEntityListViewModel.isItemSelected(
          this._tableEntityListViewModel.getTableEntityKeys(entityIdentity.RowKey),
        )
      ) {
        // Adding item not previously in selection
        this.addToSelection(entityIdentity.RowKey);
      } else {
        koSelected.remove((item: Entities.ITableEntity) => item.RowKey._ === entityIdentity.RowKey);
      }
    }
  }

  private applyShiftSelection($elem: JQuery<Element>): void {
    var anchorItem = this._tableEntityListViewModel.lastSelectedAnchorItem;

    // If anchor item doesn't exist, use the first available item of current page instead
    if (!anchorItem && this._tableEntityListViewModel.items().length > 0) {
      anchorItem = this._tableEntityListViewModel.items()[0];
    }

    if (anchorItem) {
      var entityIdentity: Entities.ITableEntityIdentity = this.getEntityIdentity($elem);
      var elementIndex = this._tableEntityListViewModel.getItemIndexFromAllPages(
        this._tableEntityListViewModel.getTableEntityKeys(entityIdentity.RowKey),
      );
      var anchorIndex = this._tableEntityListViewModel.getItemIndexFromAllPages(
        this._tableEntityListViewModel.getTableEntityKeys(anchorItem.RowKey._),
      );

      var startIndex = Math.min(elementIndex, anchorIndex);
      var endIndex = Math.max(elementIndex, anchorIndex);

      this._tableEntityListViewModel.clearSelection();
      ko.utils.arrayPushAll<Entities.ITableEntity>(
        this._tableEntityListViewModel.selected,
        this._tableEntityListViewModel.getItemsFromAllPagesWithinRange(startIndex, endIndex + 1),
      );
    }
  }

  private applyContextMenuSelection($elem: JQuery<Element>) {
    var entityIdentity: Entities.ITableEntityIdentity = this.getEntityIdentity($elem);

    if (
      !this._tableEntityListViewModel.isItemSelected(
        this._tableEntityListViewModel.getTableEntityKeys(entityIdentity.RowKey),
      )
    ) {
      if (this._tableEntityListViewModel.selected().length) {
        this._tableEntityListViewModel.clearSelection();
      }
      this.addToSelection(entityIdentity.RowKey);
    }
  }

  private addToSelection(rowKey: string) {
    var selectedEntity: Entities.ITableEntity = this._tableEntityListViewModel.getItemFromCurrentPage(
      this._tableEntityListViewModel.getTableEntityKeys(rowKey),
    );

    if (selectedEntity != null) {
      this._tableEntityListViewModel.selected.push(selectedEntity);
    }
  }

  // Selecting first row if the selection is empty.
  public selectFirstIfNeeded(): void {
    var koSelected: ko.ObservableArray<Entities.ITableEntity> = this._tableEntityListViewModel
      ? this._tableEntityListViewModel.selected
      : null;
    var koEntities: ko.ObservableArray<Entities.ITableEntity> = this._tableEntityListViewModel
      ? this._tableEntityListViewModel.items
      : null;

    if (!koSelected().length && koEntities().length) {
      var firstEntity: Entities.ITableEntity = koEntities()[0];

      // Clear last selection: lastSelectedItem and lastSelectedAnchorItem
      this._tableEntityListViewModel.clearLastSelected();

      this.addToSelection(firstEntity.RowKey._);

      // Update last selection
      this._tableEntityListViewModel.lastSelectedItem = firstEntity;

      // Finally, make sure first row is visible
      DataTableOperations.scrollToTopIfNeeded();
    }
  }

  public bind() {
    this.dataTable.on("click", "tr", this.click);
    this.dataTable.on("dblclick", "tr", this.doubleClick);
    this.dataTable.on("keydown", "td", this.keyDown);
    this.dataTable.on("keyup", "td", this.keyUp);

    // Keyboard navigation - selecting first row if the selection is empty when the table gains focus.
    this.dataTable.on("focus", () => {
      this.selectFirstIfNeeded();
      return true;
    });

    // Bind drag & drop behavior
    $("body").on("drop", this.itemDropped);
  }

  public focusTable(): void {
    this.dataTable.focus();
  }
}
