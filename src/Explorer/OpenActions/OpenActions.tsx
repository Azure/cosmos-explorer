// TODO convert this file to an action registry in order to have actions and their handlers be more tightly coupled.
import { useDatabases } from "Explorer/useDatabases";
import { isFabricMirrored } from "Platform/Fabric/FabricUtil";
import React from "react";
import { ActionContracts } from "../../Contracts/ExplorerContracts";
import * as ViewModels from "../../Contracts/ViewModels";
import { useSidePanel } from "../../hooks/useSidePanel";
import Explorer from "../Explorer";
import { CassandraAddCollectionPane } from "../Panes/CassandraAddCollectionPane/CassandraAddCollectionPane";
import { SettingsPane } from "../Panes/SettingsPane/SettingsPane";
import { CassandraAPIDataClient } from "../Tables/TableDataClient";

function generateQueryText(action: ActionContracts.OpenQueryTab, partitionKeyProperties: string[]): string {
  if (!action.query) {
    return "SELECT * FROM c";
  } else if (action.query.text) {
    return action.query.text;
  } else if (action.query.partitionKeys?.length > 0 && partitionKeyProperties?.length > 0) {
    let query = "SELECT * FROM c WHERE";
    for (let i = 0; i < action.query.partitionKeys.length; i++) {
      const partitionKey = action.query.partitionKeys[i];
      if (!partitionKey) {
        // null partition key case
        query = query.concat(` c.${partitionKeyProperties[i]} = ${action.query.partitionKeys[i]}`);
      } else if (typeof partitionKey !== "string") {
        // Undefined partition key case
        query = query.concat(` NOT IS_DEFINED(c.${partitionKeyProperties[i]})`);
      } else {
        query = query.concat(` c.${partitionKeyProperties[i]} = "${action.query.partitionKeys[i]}"`);
      }
      if (i !== action.query.partitionKeys.length - 1) {
        query = query.concat(" OR");
      }
    }
    return query;
  }
  return "SELECT * FROM c";
}

function openCollectionTab(
  action: ActionContracts.OpenCollectionTab,
  databases: ViewModels.Database[],
  initialDatabaseIndex = 0,
) {
  //if databases are not yet loaded, wait until loaded
  if (!databases || databases.length === 0) {
    const databaseActionHandler = (databases: ViewModels.Database[]) => {
      databasesUnsubscription();
      openCollectionTab(action, databases, 0);
      return;
    };
    const databasesUnsubscription = useDatabases.subscribe(databaseActionHandler, (state) => state.databases);
  } else {
    for (let i = initialDatabaseIndex; i < databases.length; i++) {
      const database: ViewModels.Database = databases[i];
      if (!!action.databaseResourceId && database.id() !== action.databaseResourceId) {
        continue;
      }

      if (
        isFabricMirrored() &&
        !(
          // whitelist the tab kinds that are allowed to be opened in Fabric mirrored
          (
            action.tabKind === ActionContracts.TabKind.SQLDocuments ||
            action.tabKind === ActionContracts.TabKind.SQLQuery
          )
        )
      ) {
        continue;
      }

      //expand database first if not expanded to load the collections
      if (!database.isDatabaseExpanded?.()) {
        database.expandDatabase?.();
      }

      const collectionActionHandler = (collections: ViewModels.Collection[]) => {
        if (!action.collectionResourceId && collections.length === 0) {
          subscription.dispose();
          openCollectionTab(action, databases, ++i);
          return;
        }

        for (let j = 0; j < collections.length; j++) {
          const collection: ViewModels.Collection = collections[j];
          if (!!action.collectionResourceId && collection.id() !== action.collectionResourceId) {
            continue;
          }

          // select the collection
          collection.expandCollection();

          if (
            action.tabKind === ActionContracts.TabKind.SQLDocuments ||
            action.tabKind === ActionContracts.TabKind[ActionContracts.TabKind.SQLDocuments]
          ) {
            collection.onDocumentDBDocumentsClick();
            break;
          }

          if (
            action.tabKind === ActionContracts.TabKind.MongoDocuments ||
            action.tabKind === ActionContracts.TabKind[ActionContracts.TabKind.MongoDocuments]
          ) {
            collection.onMongoDBDocumentsClick();
            break;
          }

          if (
            action.tabKind === ActionContracts.TabKind.SchemaAnalyzer ||
            action.tabKind === ActionContracts.TabKind[ActionContracts.TabKind.SchemaAnalyzer]
          ) {
            collection.onSchemaAnalyzerClick();
            break;
          }

          if (
            action.tabKind === ActionContracts.TabKind.TableEntities ||
            action.tabKind === ActionContracts.TabKind[ActionContracts.TabKind.TableEntities]
          ) {
            collection.onTableEntitiesClick();
            break;
          }

          if (
            action.tabKind === ActionContracts.TabKind.Graph ||
            action.tabKind === ActionContracts.TabKind[ActionContracts.TabKind.Graph]
          ) {
            collection.onGraphDocumentsClick();
            break;
          }

          if (
            action.tabKind === ActionContracts.TabKind.SQLQuery ||
            action.tabKind === ActionContracts.TabKind[ActionContracts.TabKind.SQLQuery]
          ) {
            const openQueryTabAction = action as ActionContracts.OpenQueryTab;
            collection.onNewQueryClick(
              collection,
              undefined,
              generateQueryText(openQueryTabAction, collection.partitionKeyProperties),
              openQueryTabAction.splitterDirection,
              openQueryTabAction.queryViewSizePercent,
            );
            break;
          }

          if (
            action.tabKind === ActionContracts.TabKind.MongoQuery ||
            action.tabKind === ActionContracts.TabKind[ActionContracts.TabKind.MongoQuery]
          ) {
            const openQueryTabAction = action as ActionContracts.OpenQueryTab;
            collection.onNewMongoQueryClick(
              collection,
              undefined,
              generateQueryText(openQueryTabAction, collection.partitionKeyProperties),
              openQueryTabAction.splitterDirection,
              openQueryTabAction.queryViewSizePercent,
            );
            break;
          }

          if (
            action.tabKind === ActionContracts.TabKind.ScaleSettings ||
            action.tabKind === ActionContracts.TabKind[ActionContracts.TabKind.ScaleSettings]
          ) {
            collection.onSettingsClick();
            break;
          }
        }
        subscription.dispose();
      };

      const subscription = database.collections.subscribe((collections) => collectionActionHandler(collections));
      if (database.collections && database.collections() && database.collections().length) {
        collectionActionHandler(database.collections());
      }

      break;
    }
  }
}

function openPane(action: ActionContracts.OpenPane, explorer: Explorer) {
  if (
    action.paneKind === ActionContracts.PaneKind.AddCollection ||
    action.paneKind === ActionContracts.PaneKind[ActionContracts.PaneKind.AddCollection]
  ) {
    explorer.onNewCollectionClicked();
  } else if (
    action.paneKind === ActionContracts.PaneKind.QuickStart ||
    action.paneKind === ActionContracts.PaneKind[ActionContracts.PaneKind.QuickStart]
  ) {
    explorer.onNewCollectionClicked({ isQuickstart: true });
  } else if (
    action.paneKind === ActionContracts.PaneKind.CassandraAddCollection ||
    action.paneKind === ActionContracts.PaneKind[ActionContracts.PaneKind.CassandraAddCollection]
  ) {
    useSidePanel
      .getState()
      .openSidePanel(
        "Add Table",
        <CassandraAddCollectionPane explorer={explorer} cassandraApiClient={new CassandraAPIDataClient()} />,
      );
  } else if (
    action.paneKind === ActionContracts.PaneKind.GlobalSettings ||
    action.paneKind === ActionContracts.PaneKind[ActionContracts.PaneKind.GlobalSettings]
  ) {
    useSidePanel.getState().openSidePanel("Settings", <SettingsPane explorer={explorer} />);
  }
}

export function handleOpenAction(
  action: ActionContracts.DataExplorerAction,
  databases: ViewModels.Database[],
  explorer: Explorer,
): boolean {
  if (
    action.actionType === ActionContracts.ActionType.OpenCollectionTab ||
    action.actionType === ActionContracts.ActionType[ActionContracts.ActionType.OpenCollectionTab]
  ) {
    openCollectionTab(action as ActionContracts.OpenCollectionTab, databases);
    return true;
  }

  if (
    action.actionType === ActionContracts.ActionType.OpenPane ||
    action.actionType === ActionContracts.ActionType[ActionContracts.ActionType.OpenPane]
  ) {
    openPane(action as ActionContracts.OpenPane, explorer);
    return true;
  }

  if (
    action.actionType === ActionContracts.ActionType.OpenSampleNotebook ||
    action.actionType === ActionContracts.ActionType[ActionContracts.ActionType.OpenSampleNotebook]
  ) {
    openFile(action as ActionContracts.OpenSampleNotebook, explorer);
    return true;
  }

  return false;
}

function openFile(action: ActionContracts.OpenSampleNotebook, explorer: Explorer) {
  explorer.handleOpenFileAction(decodeURIComponent(action.path));
}
