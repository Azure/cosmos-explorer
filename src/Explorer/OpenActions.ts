// TODO convert this file to an action registry in order to have actions and their handlers be more tightly coupled.

import { ActionContracts } from "../Contracts/ExplorerContracts";
import * as ViewModels from "../Contracts/ViewModels";
import Explorer from "./Explorer";

export function handleOpenAction(
  action: ActionContracts.DataExplorerAction,
  databases: ViewModels.Database[],
  explorer: Explorer
): boolean {
  if (
    action.actionType === ActionContracts.ActionType.OpenCollectionTab ||
    (<any>action).actionType === ActionContracts.ActionType[ActionContracts.ActionType.OpenCollectionTab]
  ) {
    openCollectionTab(<ActionContracts.OpenCollectionTab>action, databases);
    return true;
  }

  if (
    action.actionType === ActionContracts.ActionType.OpenPane ||
    (<any>action).actionType === ActionContracts.ActionType[ActionContracts.ActionType.OpenPane]
  ) {
    openPane(<ActionContracts.OpenPane>action, explorer);
    return true;
  }

  if (
    action.actionType === ActionContracts.ActionType.OpenSampleNotebook ||
    (<any>action).actionType === ActionContracts.ActionType[ActionContracts.ActionType.OpenSampleNotebook]
  ) {
    openFile(<ActionContracts.OpenSampleNotebook>action, explorer);
    return true;
  }

  return false;
}

function openCollectionTab(
  action: ActionContracts.OpenCollectionTab,
  databases: ViewModels.Database[],
  initialDatabaseIndex = 0
) {
  for (let i = initialDatabaseIndex; i < databases.length; i++) {
    const database: ViewModels.Database = databases[i];
    if (!!action.databaseResourceId && database.id() !== action.databaseResourceId) {
      continue;
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
          (<any>action).tabKind === ActionContracts.TabKind[ActionContracts.TabKind.SQLDocuments]
        ) {
          collection.onDocumentDBDocumentsClick();
          break;
        }

        if (
          action.tabKind === ActionContracts.TabKind.MongoDocuments ||
          (<any>action).tabKind === ActionContracts.TabKind[ActionContracts.TabKind.MongoDocuments]
        ) {
          collection.onMongoDBDocumentsClick();
          break;
        }

        if (
          action.tabKind === ActionContracts.TabKind.SchemaAnalyzer ||
          (<any>action).tabKind === ActionContracts.TabKind[ActionContracts.TabKind.SchemaAnalyzer]
        ) {
          collection.onSchemaAnalyzerClick();
          break;
        }

        if (
          action.tabKind === ActionContracts.TabKind.TableEntities ||
          (<any>action).tabKind === ActionContracts.TabKind[ActionContracts.TabKind.TableEntities]
        ) {
          collection.onTableEntitiesClick();
          break;
        }

        if (
          action.tabKind === ActionContracts.TabKind.Graph ||
          (<any>action).tabKind === ActionContracts.TabKind[ActionContracts.TabKind.Graph]
        ) {
          collection.onGraphDocumentsClick();
          break;
        }

        if (
          action.tabKind === ActionContracts.TabKind.SQLQuery ||
          (<any>action).tabKind === ActionContracts.TabKind[ActionContracts.TabKind.SQLQuery]
        ) {
          collection.onNewQueryClick(
            collection,
            null,
            generateQueryText(<ActionContracts.OpenQueryTab>action, collection.partitionKeyProperty)
          );
          break;
        }

        if (
          action.tabKind === ActionContracts.TabKind.ScaleSettings ||
          (<any>action).tabKind === ActionContracts.TabKind[ActionContracts.TabKind.ScaleSettings]
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

function openPane(action: ActionContracts.OpenPane, explorer: Explorer) {
  if (
    action.paneKind === ActionContracts.PaneKind.AddCollection ||
    (<any>action).paneKind === ActionContracts.PaneKind[ActionContracts.PaneKind.AddCollection]
  ) {
    explorer.onNewCollectionClicked();
  } else if (
    action.paneKind === ActionContracts.PaneKind.CassandraAddCollection ||
    (<any>action).paneKind === ActionContracts.PaneKind[ActionContracts.PaneKind.CassandraAddCollection]
  ) {
    explorer.cassandraAddCollectionPane.open();
  } else if (
    action.paneKind === ActionContracts.PaneKind.GlobalSettings ||
    (<any>action).paneKind === ActionContracts.PaneKind[ActionContracts.PaneKind.GlobalSettings]
  ) {
    explorer.openSettingPane();
  }
}

function openFile(action: ActionContracts.OpenSampleNotebook, explorer: Explorer) {
  explorer.handleOpenFileAction(decodeURIComponent(action.path));
}

function generateQueryText(action: ActionContracts.OpenQueryTab, partitionKeyProperty: string): string {
  if (!action.query) {
    return "SELECT * FROM c";
  } else if (!!action.query.text) {
    return action.query.text;
  } else if (!!action.query.partitionKeys && action.query.partitionKeys.length > 0) {
    let query = "SELECT * FROM c WHERE";
    for (let i = 0; i < action.query.partitionKeys.length; i++) {
      let partitionKey = action.query.partitionKeys[i];
      if (!partitionKey) {
        // null partition key case
        query = query.concat(` c.${partitionKeyProperty} = ${action.query.partitionKeys[i]}`);
      } else if (typeof partitionKey !== "string") {
        // Undefined partition key case
        query = query.concat(` NOT IS_DEFINED(c.${partitionKeyProperty})`);
      } else {
        query = query.concat(` c.${partitionKeyProperty} = "${action.query.partitionKeys[i]}"`);
      }
      if (i !== action.query.partitionKeys.length - 1) {
        query = query.concat(" OR");
      }
    }
    return query;
  }
  return "SELECT * FROM c";
}
