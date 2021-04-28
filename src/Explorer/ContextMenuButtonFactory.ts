import AddCollectionIcon from "images/AddCollection.svg";
import AddSqlQueryIcon from "images/AddSqlQuery_16x16.svg";
import AddStoredProcedureIcon from "images/AddStoredProcedure.svg";
import AddTriggerIcon from "images/AddTrigger.svg";
import AddUdfIcon from "images/AddUdf.svg";
import DeleteCollectionIcon from "images/DeleteCollection.svg";
import DeleteDatabaseIcon from "images/DeleteDatabase.svg";
import DeleteSprocIcon from "images/DeleteSproc.svg";
import DeleteTriggerIcon from "images/DeleteTrigger.svg";
import DeleteUDFIcon from "images/DeleteUDF.svg";
import HostedTerminalIcon from "images/Hosted-Terminal.svg";
import * as ViewModels from "../Contracts/ViewModels";
import { DefaultAccountExperienceType } from "../DefaultAccountExperienceType";
import { userContext } from "../UserContext";
import { TreeNodeMenuItem } from "./Controls/TreeComponent/TreeComponent";
import Explorer from "./Explorer";
import StoredProcedure from "./Tree/StoredProcedure";
import Trigger from "./Tree/Trigger";
import UserDefinedFunction from "./Tree/UserDefinedFunction";

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
        label: container.addCollectionText(),
      },
    ];

    if (userContext.defaultExperience !== DefaultAccountExperienceType.Table) {
      items.push({
        iconSrc: DeleteDatabaseIcon,
        onClick: () => container.openDeleteDatabaseConfirmationPane(),
        label: container.deleteDatabaseText(),
        styleClass: "deleteDatabaseMenuItem",
      });
    }
    return items;
  }

  public static createCollectionContextMenuButton(
    container: Explorer,
    selectedCollection: ViewModels.Collection
  ): TreeNodeMenuItem[] {
    const items: TreeNodeMenuItem[] = [];
    if (userContext.apiType === "SQL" || userContext.apiType === "Gremlin") {
      items.push({
        iconSrc: AddSqlQueryIcon,
        onClick: () => selectedCollection && selectedCollection.onNewQueryClick(selectedCollection, null),
        label: "New SQL Query",
      });
    }

    if (userContext.apiType === "Mongo") {
      items.push({
        iconSrc: AddSqlQueryIcon,
        onClick: () => selectedCollection && selectedCollection.onNewMongoQueryClick(selectedCollection, null),
        label: "New Query",
      });

      items.push({
        iconSrc: HostedTerminalIcon,
        onClick: () => {
          const selectedCollection: ViewModels.Collection = container.findSelectedCollection();
          selectedCollection && selectedCollection.onNewMongoShellClick();
        },
        label: "New Shell",
      });
    }

    if (userContext.apiType === "SQL" || userContext.apiType === "Gremlin") {
      items.push({
        iconSrc: AddStoredProcedureIcon,
        onClick: () => {
          const selectedCollection: ViewModels.Collection = container.findSelectedCollection();
          selectedCollection && selectedCollection.onNewStoredProcedureClick(selectedCollection, null);
        },
        label: "New Stored Procedure",
      });

      items.push({
        iconSrc: AddUdfIcon,
        onClick: () => {
          const selectedCollection: ViewModels.Collection = container.findSelectedCollection();
          selectedCollection && selectedCollection.onNewUserDefinedFunctionClick(selectedCollection, null);
        },
        label: "New UDF",
      });

      items.push({
        iconSrc: AddTriggerIcon,
        onClick: () => {
          const selectedCollection: ViewModels.Collection = container.findSelectedCollection();
          selectedCollection && selectedCollection.onNewTriggerClick(selectedCollection, null);
        },
        label: "New Trigger",
      });
    }

    items.push({
      iconSrc: DeleteCollectionIcon,
      onClick: () => container.openDeleteCollectionConfirmationPane(),
      label: container.deleteCollectionText(),
      styleClass: "deleteCollectionMenuItem",
    });

    return items;
  }

  public static createStoreProcedureContextMenuItems(
    container: Explorer,
    storedProcedure: StoredProcedure
  ): TreeNodeMenuItem[] {
    if (userContext.apiType === "Cassandra") {
      return [];
    }

    return [
      {
        iconSrc: DeleteSprocIcon,
        onClick: () => storedProcedure.delete(),
        label: "Delete Store Procedure",
      },
    ];
  }

  public static createTriggerContextMenuItems(container: Explorer, trigger: Trigger): TreeNodeMenuItem[] {
    if (userContext.apiType === "Cassandra") {
      return [];
    }

    return [
      {
        iconSrc: DeleteTriggerIcon,
        onClick: () => trigger.delete(),
        label: "Delete Trigger",
      },
    ];
  }

  public static createUserDefinedFunctionContextMenuItems(
    container: Explorer,
    userDefinedFunction: UserDefinedFunction
  ): TreeNodeMenuItem[] {
    if (userContext.apiType === "Cassandra") {
      return [];
    }

    return [
      {
        iconSrc: DeleteUDFIcon,
        onClick: () => userDefinedFunction.delete(),
        label: "Delete User Defined Function",
      },
    ];
  }
}
