import * as ko from "knockout";
import * as ViewModels from "../Contracts/ViewModels";
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
import Explorer from "./Explorer";
import UserDefinedFunction from "./Tree/UserDefinedFunction";
import StoredProcedure from "./Tree/StoredProcedure";
import Trigger from "./Tree/Trigger";
import { userContext } from "../UserContext";
import { DefaultAccountExperienceType } from "../DefaultAccountExperienceType";

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
  public static createDatabaseContextMenu(container: Explorer): TreeNodeMenuItem[] {
    const items: TreeNodeMenuItem[] = [
      {
        iconSrc: AddCollectionIcon,
        onClick: () => container.onNewCollectionClicked(),
        label: container.addCollectionText()
      }
    ];

    if (userContext.defaultExperience !== DefaultAccountExperienceType.Table) {
      items.push({
        iconSrc: DeleteDatabaseIcon,
        onClick: () => container.deleteDatabaseConfirmationPane.open(),
        label: container.deleteDatabaseText(),
        styleClass: "deleteDatabaseMenuItem"
      });
    }
    return items;
  }

  public static createCollectionContextMenuButton(
    container: Explorer,
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
      label: container.deleteCollectionText(),
      styleClass: "deleteCollectionMenuItem"
    });

    return items;
  }

  public static createStoreProcedureContextMenuItems(
    container: Explorer,
    storedProcedure: StoredProcedure
  ): TreeNodeMenuItem[] {
    if (container.isPreferredApiCassandra()) {
      return [];
    }

    return [
      {
        iconSrc: DeleteSprocIcon,
        onClick: () => storedProcedure.delete(),
        label: "Delete Store Procedure"
      }
    ];
  }

  public static createTriggerContextMenuItems(container: Explorer, trigger: Trigger): TreeNodeMenuItem[] {
    if (container.isPreferredApiCassandra()) {
      return [];
    }

    return [
      {
        iconSrc: DeleteTriggerIcon,
        onClick: () => trigger.delete(),
        label: "Delete Trigger"
      }
    ];
  }

  public static createUserDefinedFunctionContextMenuItems(
    container: Explorer,
    userDefinedFunction: UserDefinedFunction
  ): TreeNodeMenuItem[] {
    if (container.isPreferredApiCassandra()) {
      return [];
    }

    return [
      {
        iconSrc: DeleteUDFIcon,
        onClick: () => userDefinedFunction.delete(),
        label: "Delete User Defined Function"
      }
    ];
  }
}
