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

/**
 * Current resource tree (in KO)
 * TODO: Remove when switching to new resource tree
 */
export class ContextMenuButtonFactory {
  public static createDatabaseContextMenuButton(
    container: ViewModels.Explorer,
    btnParams: DatabaseContextMenuButtonParams
  ): CommandButtonOptions[] {
    const addCollectionId = `${btnParams.databaseId}-${container.addCollectionText()}`;
    const deleteDatabaseId = `${btnParams.databaseId}-${container.deleteDatabaseText()}`;
    const newCollectionButtonOptions: CommandButtonOptions = {
      iconSrc: AddCollectionIcon,
      id: addCollectionId,
      onCommandClick: () => {
        if (container.isPreferredApiCassandra()) {
          container.cassandraAddCollectionPane.open();
        } else {
          container.addCollectionPane.open(container.selectedDatabaseId());
        }

        const selectedDatabase: ViewModels.Database = container.findSelectedDatabase();
        selectedDatabase && selectedDatabase.contextMenu.hide(selectedDatabase, null);
      },
      commandButtonLabel: container.addCollectionText(),
      hasPopup: true
    };

    const deleteDatabaseButtonOptions: CommandButtonOptions = {
      iconSrc: DeleteDatabaseIcon,
      id: deleteDatabaseId,
      onCommandClick: () => {
        const database: ViewModels.Database = container.findSelectedDatabase();
        database.onDeleteDatabaseContextMenuClick(database, null);
      },
      commandButtonLabel: container.deleteDatabaseText(),
      hasPopup: true,
      disabled: ko.computed<boolean>(() => container.isNoneSelected()),
      visible: ko.computed<boolean>(() => !container.isNoneSelected())
    };

    return [newCollectionButtonOptions, deleteDatabaseButtonOptions];
  }

  public static createCollectionContextMenuButton(
    container: ViewModels.Explorer,
    btnParams: CollectionContextMenuButtonParams
  ): CommandButtonOptions[] {
    const newSqlQueryId = `${btnParams.databaseId}-${btnParams.collectionId}-newSqlQuery`;
    const newSqlQueryForGraphId = `${btnParams.databaseId}-${btnParams.collectionId}-newSqlQueryForGraph`;
    const newQueryForMongoId = `${btnParams.databaseId}-${btnParams.collectionId}-newQuery`;
    const newShellForMongoId = `${btnParams.databaseId}-${btnParams.collectionId}-newShell`;
    const newStoredProcedureId = `${btnParams.databaseId}-${btnParams.collectionId}-newStoredProcedure`;
    const udfId = `${btnParams.databaseId}-${btnParams.collectionId}-udf`;
    const newTriggerId = `${btnParams.databaseId}-${btnParams.collectionId}-newTrigger`;
    const deleteCollectionId = `${btnParams.databaseId}-${btnParams.collectionId}-${container.deleteCollectionText()}`;

    const newSQLQueryButtonOptions: CommandButtonOptions = {
      iconSrc: AddSqlQueryIcon,
      id: newSqlQueryId,
      onCommandClick: () => {
        const selectedCollection: ViewModels.Collection = container.findSelectedCollection();
        selectedCollection && selectedCollection.onNewQueryClick(selectedCollection, null);
      },
      commandButtonLabel: "New SQL Query",
      hasPopup: true,
      disabled: ko.computed<boolean>(
        () => container.isDatabaseNodeOrNoneSelected() && container.isPreferredApiDocumentDB()
      ),
      visible: ko.computed<boolean>(
        () => !container.isDatabaseNodeOrNoneSelected() && container.isPreferredApiDocumentDB()
      )
      //TODO: Merge with add query logic below, same goes for CommandBarButtonFactory
    };

    const newSQLQueryButtonOptionsForGraph: CommandButtonOptions = {
      iconSrc: AddSqlQueryIcon,
      id: newSqlQueryForGraphId,
      onCommandClick: () => {
        const selectedCollection: ViewModels.Collection = container.findSelectedCollection();
        selectedCollection && selectedCollection.onNewQueryClick(selectedCollection, null);
      },
      commandButtonLabel: "New SQL Query",
      hasPopup: true,
      disabled: ko.computed<boolean>(() => container.isDatabaseNodeOrNoneSelected() && container.isPreferredApiGraph()),
      visible: ko.computed<boolean>(() => !container.isDatabaseNodeOrNoneSelected() && container.isPreferredApiGraph())
    };

    const newMongoQueryButtonOptions: CommandButtonOptions = {
      iconSrc: AddSqlQueryIcon,
      id: newQueryForMongoId,
      onCommandClick: () => {
        const selectedCollection: ViewModels.Collection = container.findSelectedCollection();
        selectedCollection && selectedCollection.onNewMongoQueryClick(selectedCollection, null);
      },
      commandButtonLabel: "New Query",
      hasPopup: true,
      disabled: ko.computed<boolean>(
        () => container.isDatabaseNodeOrNoneSelected() && container.isPreferredApiMongoDB()
      ),
      visible: ko.computed<boolean>(
        () => !container.isDatabaseNodeOrNoneSelected() && container.isPreferredApiMongoDB()
      )
    };

    const newMongoShellButtonOptions: CommandButtonOptions = {
      iconSrc: HostedTerminalIcon,
      id: newShellForMongoId,
      onCommandClick: () => {
        const selectedCollection: ViewModels.Collection = container.findSelectedCollection();
        selectedCollection && selectedCollection.onNewMongoShellClick();
      },
      commandButtonLabel: "New Shell",
      hasPopup: true,
      disabled: ko.computed<boolean>(
        () => container.isDatabaseNodeOrNoneSelected() && container.isPreferredApiMongoDB()
      ),
      visible: ko.computed<boolean>(
        () => !container.isDatabaseNodeOrNoneSelected() && container.isPreferredApiMongoDB()
      )
    };

    const newStoredProcedureButtonOptions: CommandButtonOptions = {
      iconSrc: AddStoredProcedureIcon,
      id: newStoredProcedureId,
      onCommandClick: () => {
        const selectedCollection: ViewModels.Collection = container.findSelectedCollection();
        selectedCollection && selectedCollection.onNewStoredProcedureClick(selectedCollection, null);
      },
      commandButtonLabel: "New Stored Procedure",
      hasPopup: true,
      disabled: ko.computed<boolean>(() => container.isDatabaseNodeOrNoneSelected()),
      visible: ko.computed<boolean>(
        () => !container.isDatabaseNodeOrNoneSelected() && !container.isPreferredApiCassandra()
      )
    };

    const newUserDefinedFunctionButtonOptions: CommandButtonOptions = {
      iconSrc: AddUdfIcon,
      id: udfId,
      onCommandClick: () => {
        const selectedCollection: ViewModels.Collection = container.findSelectedCollection();
        selectedCollection && selectedCollection.onNewUserDefinedFunctionClick(selectedCollection, null);
      },
      commandButtonLabel: "New UDF",
      hasPopup: true,
      disabled: ko.computed<boolean>(() => container.isDatabaseNodeOrNoneSelected()),
      visible: ko.computed<boolean>(
        () => !container.isDatabaseNodeOrNoneSelected() && !container.isPreferredApiCassandra()
      )
    };

    const newTriggerButtonOptions: CommandButtonOptions = {
      iconSrc: AddTriggerIcon,
      id: newTriggerId,
      onCommandClick: () => {
        const selectedCollection: ViewModels.Collection = container.findSelectedCollection();
        selectedCollection && selectedCollection.onNewTriggerClick(selectedCollection, null);
      },
      commandButtonLabel: "New Trigger",
      hasPopup: true,
      disabled: ko.computed<boolean>(() => container.isDatabaseNodeOrNoneSelected()),
      visible: ko.computed<boolean>(
        () => !container.isDatabaseNodeOrNoneSelected() && !container.isPreferredApiCassandra()
      )
    };

    const deleteCollectionButtonOptions: CommandButtonOptions = {
      iconSrc: DeleteCollectionIcon,
      id: deleteCollectionId,
      onCommandClick: () => {
        const selectedCollection: ViewModels.Collection = container.findSelectedCollection();
        selectedCollection && selectedCollection.onDeleteCollectionContextMenuClick(selectedCollection, null);
      },
      commandButtonLabel: container.deleteCollectionText(),
      hasPopup: true,
      disabled: ko.computed<boolean>(() => container.isDatabaseNodeOrNoneSelected()),
      visible: ko.computed<boolean>(() => !container.isDatabaseNodeOrNoneSelected())
      //TODO: Change to isCollectionNodeorNoneSelected and same in CommandBarButtonFactory
    };

    return [
      newSQLQueryButtonOptions,
      newSQLQueryButtonOptionsForGraph,
      newMongoQueryButtonOptions,
      newMongoShellButtonOptions,
      newStoredProcedureButtonOptions,
      newUserDefinedFunctionButtonOptions,
      newTriggerButtonOptions,
      deleteCollectionButtonOptions
    ];
  }

  public static createStoreProcedureContextMenuButton(container: ViewModels.Explorer): CommandButtonOptions[] {
    const deleteStoredProcedureId = "Context Menu - Delete Stored Procedure";
    const deleteStoreProcedureButtonOptions: CommandButtonOptions = {
      iconSrc: DeleteSprocIcon,
      id: deleteStoredProcedureId,
      onCommandClick: () => {
        const selectedStoreProcedure: ViewModels.StoredProcedure = container.findSelectedStoredProcedure();
        selectedStoreProcedure && selectedStoreProcedure.delete(selectedStoreProcedure, null);
      },
      commandButtonLabel: "Delete Stored Procedure",
      hasPopup: false,
      disabled: ko.computed<boolean>(() => container.isDatabaseNodeOrNoneSelected()),
      visible: ko.computed<boolean>(
        () => !container.isDatabaseNodeOrNoneSelected() && !container.isPreferredApiCassandra()
      )
    };

    return [deleteStoreProcedureButtonOptions];
  }

  public static createTriggerContextMenuButton(container: ViewModels.Explorer): CommandButtonOptions[] {
    const deleteTriggerId = "Context Menu - Delete Trigger";
    const deleteTriggerButtonOptions: CommandButtonOptions = {
      iconSrc: DeleteTriggerIcon,
      id: deleteTriggerId,
      onCommandClick: () => {
        const selectedTrigger: ViewModels.Trigger = container.findSelectedTrigger();
        selectedTrigger && selectedTrigger.delete(selectedTrigger, null);
      },
      commandButtonLabel: "Delete Trigger",
      hasPopup: false,
      disabled: ko.computed<boolean>(() => container.isDatabaseNodeOrNoneSelected()),
      visible: ko.computed<boolean>(
        () => !container.isDatabaseNodeOrNoneSelected() && !container.isPreferredApiCassandra()
      )
    };

    return [deleteTriggerButtonOptions];
  }

  public static createUserDefinedFunctionContextMenuButton(container: ViewModels.Explorer): CommandButtonOptions[] {
    const deleteUserDefinedFunctionId = "Context Menu - Delete User Defined Function";
    const deleteUserDefinedFunctionButtonOptions: CommandButtonOptions = {
      iconSrc: DeleteUDFIcon,
      id: deleteUserDefinedFunctionId,
      onCommandClick: () => {
        const selectedUDF: ViewModels.UserDefinedFunction = container.findSelectedUDF();
        selectedUDF && selectedUDF.delete(selectedUDF, null);
      },
      commandButtonLabel: "Delete User Defined Function",
      hasPopup: false,
      disabled: ko.computed<boolean>(() => container.isDatabaseNodeOrNoneSelected()),
      visible: ko.computed<boolean>(
        () => !container.isDatabaseNodeOrNoneSelected() && !container.isPreferredApiCassandra()
      )
    };

    return [deleteUserDefinedFunctionButtonOptions];
  }
}
