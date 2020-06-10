import * as ko from "knockout";
import * as ViewModels from "../Contracts/ViewModels";
import { CommandButtonOptions } from "./Controls/CommandButton/CommandButton";
import { TreeNodeMenuItem } from "./Controls/TreeComponent/TreeComponent";
import AddCollectionIcon from "../../images/AddCollection.svg";
import AddSqlQueryIcon from "../../images/AddSqlQuery_16x16.svg";
import HostedTerminalIcon from "../../images/Hosted-Terminal.svg";
import AddStoredProcedureIcon from "../../images/AddStoredProcedure.svg";
import DeleteCollectionIcon from "../../images/DeleteCollection.svg";
import DeleteDatabaseIcon from "../../images/DeleteDatabase.svg";
import AddUdfIcon from "../../images/AddUdf.svg";
import AddTriggerIcon from "../../images/AddTrigger.svg";
import DeleteTriggerIcon from "../../images/DeleteTrigger.svg";
import DeleteUDFIcon from "../../images/DeleteUDF.svg";
import DeleteSprocIcon from "../../images/DeleteSproc.svg";

export interface CollectionContextMenuButtonParams {
  databaseId: string;
  collectionId: string;
}

export interface DatabaseContextMenuButtonParams {
  databaseId: string;
}
/**
 * New resource tree (in ReactJS)
 */
export class ResourceTreeContextMenuButtonFactory {
  public static createDatabaseContextMenu(
    container: ViewModels.Explorer,
    selectedDatabase: ViewModels.Database
  ): TreeNodeMenuItem[] {
    const newCollectionMenuItem: TreeNodeMenuItem = {
      iconSrc: AddCollectionIcon,
      onClick: () => container.onNewCollectionClicked(),
      label: container.addCollectionText()
    };

    const deleteDatabaseMenuItem = {
      iconSrc: DeleteDatabaseIcon,
      onClick: () => container.deleteDatabaseConfirmationPane.open(),
      label: container.deleteDatabaseText()
    };
    return [newCollectionMenuItem, deleteDatabaseMenuItem];
  }

  public static createCollectionContextMenuButton(
    container: ViewModels.Explorer,
    selectedCollection: ViewModels.Collection
  ): TreeNodeMenuItem[] {
    const items: TreeNodeMenuItem[] = [];
    if (container.isPreferredApiDocumentDB() || container.isPreferredApiGraph()) {
      items.push({
        iconSrc: AddSqlQueryIcon,
        onClick: () => selectedCollection && selectedCollection.onNewQueryClick(selectedCollection, null),
        label: "New SQL Query"
      });
    }

    if (container.isPreferredApiMongoDB()) {
      items.push({
        iconSrc: AddSqlQueryIcon,
        onClick: () => selectedCollection && selectedCollection.onNewMongoQueryClick(selectedCollection, null),
        label: "New Query"
      });

      items.push({
        iconSrc: HostedTerminalIcon,
        onClick: () => {
          const selectedCollection: ViewModels.Collection = container.findSelectedCollection();
          selectedCollection && selectedCollection.onNewMongoShellClick();
        },
        label: "New Shell"
      });
    }

    if (container.isPreferredApiDocumentDB() || container.isPreferredApiGraph()) {
      items.push({
        iconSrc: AddStoredProcedureIcon,
        onClick: () => {
          const selectedCollection: ViewModels.Collection = container.findSelectedCollection();
          selectedCollection && selectedCollection.onNewStoredProcedureClick(selectedCollection, null);
        },
        label: "New Stored Procedure"
      });

      items.push({
        iconSrc: AddUdfIcon,
        onClick: () => {
          const selectedCollection: ViewModels.Collection = container.findSelectedCollection();
          selectedCollection && selectedCollection.onNewUserDefinedFunctionClick(selectedCollection, null);
        },
        label: "New UDF"
      });

      items.push({
        iconSrc: AddTriggerIcon,
        onClick: () => {
          const selectedCollection: ViewModels.Collection = container.findSelectedCollection();
          selectedCollection && selectedCollection.onNewTriggerClick(selectedCollection, null);
        },
        label: "New Trigger"
      });
    }

    items.push({
      iconSrc: DeleteCollectionIcon,
      onClick: () => {
        const selectedCollection: ViewModels.Collection = container.findSelectedCollection();
        selectedCollection && selectedCollection.onDeleteCollectionContextMenuClick(selectedCollection, null);
      },
      label: container.deleteCollectionText()
    });

    return items;
  }

  public static createStoreProcedureContextMenuItems(container: ViewModels.Explorer): TreeNodeMenuItem[] {
    if (container.isPreferredApiCassandra()) {
      return [];
    }

    return [
      {
        iconSrc: DeleteSprocIcon,
        onClick: () => {
          const selectedStoreProcedure: ViewModels.StoredProcedure = container.findSelectedStoredProcedure();
          selectedStoreProcedure && selectedStoreProcedure.delete(selectedStoreProcedure, null);
        },
        label: "Delete Store Procedure"
      }
    ];
  }

  public static createTriggerContextMenuItems(container: ViewModels.Explorer): TreeNodeMenuItem[] {
    if (container.isPreferredApiCassandra()) {
      return [];
    }

    return [
      {
        iconSrc: DeleteTriggerIcon,
        onClick: () => {
          const selectedTrigger: ViewModels.Trigger = container.findSelectedTrigger();
          selectedTrigger && selectedTrigger.delete(selectedTrigger, null);
        },
        label: "Delete Trigger"
      }
    ];
  }

  public static createUserDefinedFunctionContextMenuItems(container: ViewModels.Explorer): TreeNodeMenuItem[] {
    if (container.isPreferredApiCassandra()) {
      return [];
    }

    return [
      {
        iconSrc: DeleteUDFIcon,
        onClick: () => {
          const selectedUDF: ViewModels.UserDefinedFunction = container.findSelectedUDF();
          selectedUDF && selectedUDF.delete(selectedUDF, null);
        },
        label: "Delete User Defined Function"
      }
    ];
  }
}
