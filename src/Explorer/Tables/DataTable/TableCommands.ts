import Q from "q";
import { userContext } from "../../../UserContext";
import { useDialog } from "../../Controls/Dialog";
import Explorer from "../../Explorer";
import * as Entities from "../Entities";
import * as DataTableUtilities from "./DataTableUtilities";
import TableEntityListViewModel from "./TableEntityListViewModel";

export default class TableCommands {
  // Command Ids
  public static editEntityCommand: string = "edit";
  public static deleteEntitiesCommand: string = "delete";
  public static reorderColumnsCommand: string = "reorder";
  public static resetColumnsCommand: string = "reset";
  public static customizeColumnsCommand: string = "customizeColumns";

  private _container: Explorer;

  constructor(container: Explorer) {
    this._container = container;
  }

  public isEnabled(commandName: string, selectedEntites: Entities.ITableEntity[]): boolean {
    var singleItemSelected: boolean = DataTableUtilities.containSingleItem(selectedEntites);
    var atLeastOneItemSelected: boolean = DataTableUtilities.containItems(selectedEntites);
    switch (commandName) {
      case TableCommands.editEntityCommand:
        return singleItemSelected;
      case TableCommands.deleteEntitiesCommand:
      case TableCommands.reorderColumnsCommand:
        return atLeastOneItemSelected;
      default:
        break;
    }

    return false;
  }

  public tryOpenEntityEditor(viewModel: TableEntityListViewModel): boolean {
    if (this.isEnabled(TableCommands.editEntityCommand, viewModel.selected())) {
      this.editEntityCommand(viewModel);
      return true;
    }
    return false;
  }

  /**
   * Edit entity
   */
  public editEntityCommand(viewModel: TableEntityListViewModel): Q.Promise<any> {
    if (!viewModel) {
      return null; // Error
    }

    if (!DataTableUtilities.containSingleItem(viewModel.selected())) {
      return null; // Erorr
    }

    var entityToUpdate: Entities.ITableEntity = viewModel.selected()[0];
    var originalNumberOfProperties = entityToUpdate ? 0 : Object.keys(entityToUpdate).length - 1; // .metadata is always a property for etag

    return null;
  }

  public deleteEntitiesCommand(viewModel: TableEntityListViewModel): Q.Promise<any> {
    if (!viewModel) {
      return null; // Error
    }
    if (!DataTableUtilities.containItems(viewModel.selected())) {
      return null; // Error
    }
    var entitiesToDelete: Entities.ITableEntity[] = viewModel.selected();
    const deleteMessage: string =
      userContext.apiType === "Cassandra"
        ? "Are you sure you want to delete the selected rows?"
        : "Are you sure you want to delete the selected entities?";

    useDialog.getState().showOkCancelModalDialog(
      "Confirm delete",
      deleteMessage,
      "Delete",
      () => {
        viewModel.queryTablesTab.container.tableDataClient
          .deleteDocuments(viewModel.queryTablesTab.collection, entitiesToDelete)
          .then((results: any) => {
            return viewModel.removeEntitiesFromCache(entitiesToDelete).then(() => {
              viewModel.redrawTableThrottled();
            });
          });
      },
      "Cancel",
      undefined
    );

    return null;
  }
}
