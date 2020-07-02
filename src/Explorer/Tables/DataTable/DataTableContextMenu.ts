import Q from "q";

import * as Constants from "../Constants";
import TableCommands from "./TableCommands";
import TableEntityListViewModel from "./TableEntityListViewModel";

/*
 * ContextMenu view representation
 */
export default class DataTableContextMenu {
  public viewModel: TableEntityListViewModel;

  // There is one context menu for each selector on each tab and they should all be registered here.
  // Once the context menus are registered, we should access them through this instance.
  public static Instance: { [key: string]: { contextMenu: DataTableContextMenu } } = {};

  private _tableCommands: TableCommands;

  constructor(viewModel: TableEntityListViewModel, tableCommands: TableCommands) {
    this.viewModel = viewModel;
    this._tableCommands = tableCommands;

    this.registerTableBodyContextMenu();
    this.registerTableHeaderContextMenu();

    DataTableContextMenu.Instance[viewModel.queryTablesTab.tabId] = { contextMenu: this };
  }

  public unregisterContextMenu(selector: string): void {
    $.contextMenu("destroy", "div#" + this.viewModel.queryTablesTab.tabId + ".tab-pane " + selector);
  }

  public registerTableBodyContextMenu(): void {
    // Localize
    $.contextMenu({
      selector:
        "div#" + this.viewModel.queryTablesTab.tabId + ".tab-pane " + Constants.htmlSelectors.dataTableBodyRowSelector,
      callback: this.bodyContextMenuSelect,
      items: {
        edit: {
          name: "Edit",
          cmd: TableCommands.editEntityCommand,
          icon: "edit-entity",
          disabled: () => !this.isEnabled(TableCommands.editEntityCommand),
        },
        delete: {
          name: "Delete",
          cmd: TableCommands.deleteEntitiesCommand,
          icon: "delete-entity",
          disabled: () => !this.isEnabled(TableCommands.deleteEntitiesCommand),
        },
        reorder: {
          name: "Reorder Columns Based on Schema",
          cmd: TableCommands.reorderColumnsCommand,
          icon: "shift-non-empty-columns-left",
          disabled: () => !this.isEnabled(TableCommands.reorderColumnsCommand),
        },
        reset: {
          name: "Reset Columns",
          cmd: TableCommands.resetColumnsCommand,
          icon: "reset-column-order",
        },
      },
    });
  }

  public registerTableHeaderContextMenu(): void {
    // Localize
    $.contextMenu({
      selector:
        "div#" + this.viewModel.queryTablesTab.tabId + ".tab-pane " + Constants.htmlSelectors.dataTableHeadRowSelector,
      callback: this.headerContextMenuSelect,
      items: {
        customizeColumns: {
          name: "Column Options",
          cmd: TableCommands.customizeColumnsCommand,
          icon: "customize-columns",
        },
        reset: {
          name: "Reset Columns",
          cmd: TableCommands.resetColumnsCommand,
          icon: "reset-column-order",
        },
      },
    });
  }

  private isEnabled(commandName: string): boolean {
    return this._tableCommands.isEnabled(commandName, this.viewModel.selected());
  }

  private headerContextMenuSelect = (key: any, options: any): void => {
    var promise: Q.Promise<any> = null;

    switch (key) {
      case TableCommands.customizeColumnsCommand:
        promise = this._tableCommands.customizeColumnsCommand(this.viewModel);
        break;
      case TableCommands.resetColumnsCommand:
        promise = Q.resolve(this._tableCommands.resetColumns(this.viewModel));
        break;
      default:
        break;
    }

    if (promise) {
      promise.then(() => {
        this.viewModel.focusDataTable();
      });
    }
  };

  private bodyContextMenuSelect = (key: any, options: any): void => {
    var promise: Q.Promise<any> = null;

    switch (key) {
      case TableCommands.editEntityCommand:
        promise = this._tableCommands.editEntityCommand(this.viewModel);
        break;
      case TableCommands.deleteEntitiesCommand:
        promise = this._tableCommands.deleteEntitiesCommand(this.viewModel);
        break;
      case TableCommands.reorderColumnsCommand:
        promise = this._tableCommands.reorderColumnsBasedOnSelectedEntities(this.viewModel);
        break;
      case TableCommands.resetColumnsCommand:
        promise = Q.resolve(this._tableCommands.resetColumns(this.viewModel));
        break;
      default:
        break;
    }

    if (promise) {
      promise.then(() => {
        this.viewModel.focusDataTable();
      });
    }
  };

  /**
   * A context menu factory to construct the one context menu for each tab/table view model.
   */
  public static contextMenuFactory(viewModel: TableEntityListViewModel, tableCommands: TableCommands) {
    if (!DataTableContextMenu.Instance[viewModel.queryTablesTab.tabId]) {
      DataTableContextMenu.Instance[viewModel.queryTablesTab.tabId] = {
        contextMenu: new DataTableContextMenu(viewModel, tableCommands),
      };
    }
  }
}
