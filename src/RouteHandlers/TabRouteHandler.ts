import crossroads from "crossroads";
import hasher from "hasher";
import * as _ from "underscore";
import * as Constants from "../Common/Constants";
import * as ViewModels from "../Contracts/ViewModels";
import ScriptTabBase from "../Explorer/Tabs/ScriptTabBase";
import TabsBase from "../Explorer/Tabs/TabsBase";
import { userContext } from "../UserContext";

export class TabRouteHandler {
  private _tabRouter: any;

  constructor() {}

  public initRouteHandler(
    onMatch?: (request: string, data: { route: any; params: string[]; isFirst: boolean }) => void
  ): void {
    this._initRouter();
    const parseHash = (newHash: string, oldHash: string) => this._tabRouter.parse(newHash);
    const defaultRoutedCallback = (request: string, data: { route: any; params: string[]; isFirst: boolean }) => {};
    this._tabRouter.routed.add(onMatch || defaultRoutedCallback);
    hasher.initialized.add(parseHash);
    hasher.changed.add(parseHash);
    hasher.init();
  }

  public parseHash(hash: string): void {
    this._tabRouter.parse(hash);
  }

  private _initRouter() {
    this._tabRouter = crossroads.create();
    this._setupTabRoutesForRouter();
  }

  private _setupTabRoutesForRouter(): void {
    this._tabRouter.addRoute(
      `${Constants.HashRoutePrefixes.collections}/documents`,
      (db_id: string, coll_id: string) => {
        this._openDocumentsTabForResource(db_id, coll_id);
      }
    );

    this._tabRouter.addRoute(
      `${Constants.HashRoutePrefixes.collections}/entities`,
      (db_id: string, coll_id: string) => {
        this._openEntitiesTabForResource(db_id, coll_id);
      }
    );

    this._tabRouter.addRoute(`${Constants.HashRoutePrefixes.collections}/graphs`, (db_id: string, coll_id: string) => {
      this._openGraphTabForResource(db_id, coll_id);
    });

    this._tabRouter.addRoute(
      `${Constants.HashRoutePrefixes.collections}/mongoDocuments`,
      (db_id: string, coll_id: string) => {
        this._openMongoDocumentsTabForResource(db_id, coll_id);
      }
    );

    this._tabRouter.addRoute(
      `${Constants.HashRoutePrefixes.collections}/mongoQuery`,
      (db_id: string, coll_id: string) => {
        this._openMongoQueryTabForResource(db_id, coll_id);
      }
    );

    this._tabRouter.addRoute(
      `${Constants.HashRoutePrefixes.collections}/mongoShell`,
      (db_id: string, coll_id: string) => {
        this._openMongoShellTabForResource(db_id, coll_id);
      }
    );

    this._tabRouter.addRoute(`${Constants.HashRoutePrefixes.collections}/query`, (db_id: string, coll_id: string) => {
      this._openQueryTabForResource(db_id, coll_id);
    });

    this._tabRouter.addRoute(`${Constants.HashRoutePrefixes.databases}/settings`, (db_id: string) => {
      this._openDatabaseSettingsTabForResource(db_id);
    });

    this._tabRouter.addRoute(
      `${Constants.HashRoutePrefixes.collections}/settings`,
      (db_id: string, coll_id: string) => {
        this._openSettingsTabForResource(db_id, coll_id);
      }
    );

    this._tabRouter.addRoute(`${Constants.HashRoutePrefixes.collections}/sproc`, (db_id: string, coll_id: string) => {
      this._openNewSprocTabForResource(db_id, coll_id);
    });

    this._tabRouter.addRoute(
      `${Constants.HashRoutePrefixes.collections}/sprocs/{sproc_id}`,
      (db_id: string, coll_id: string, sproc_id: string) => {
        this._openSprocTabForResource(db_id, coll_id, sproc_id);
      }
    );

    this._tabRouter.addRoute(`${Constants.HashRoutePrefixes.collections}/trigger`, (db_id: string, coll_id: string) => {
      this._openNewTriggerTabForResource(db_id, coll_id);
    });

    this._tabRouter.addRoute(
      `${Constants.HashRoutePrefixes.collections}/triggers/{trigger_id}`,
      (db_id: string, coll_id: string, trigger_id: string) => {
        this._openTriggerTabForResource(db_id, coll_id, trigger_id);
      }
    );

    this._tabRouter.addRoute(`${Constants.HashRoutePrefixes.collections}/udf`, (db_id: string, coll_id: string) => {
      this._openNewUserDefinedFunctionTabForResource(db_id, coll_id);
    });

    this._tabRouter.addRoute(
      `${Constants.HashRoutePrefixes.collections}/udfs/{udf_id}`,
      (db_id: string, coll_id: string, udf_id: string) => {
        this._openUserDefinedFunctionTabForResource(db_id, coll_id, udf_id);
      }
    );

    this._tabRouter.addRoute(
      `${Constants.HashRoutePrefixes.collections}/conflicts`,
      (db_id: string, coll_id: string) => {
        this._openConflictsTabForResource(db_id, coll_id);
      }
    );
  }

  private _openDocumentsTabForResource(databaseId: string, collectionId: string): void {
    this._executeActionHelper(() => {
      const collection: ViewModels.Collection = this._findAndExpandMatchingCollectionForResource(
        databaseId,
        collectionId
      );
      userContext.apiType === "SQL" && collection.onDocumentDBDocumentsClick();
    });
  }

  private _openEntitiesTabForResource(databaseId: string, collectionId: string): void {
    this._executeActionHelper(() => {
      const collection: ViewModels.Collection = this._findAndExpandMatchingCollectionForResource(
        databaseId,
        collectionId
      );
      collection &&
        collection.container &&
        (userContext.apiType === "Tables" || userContext.apiType === "Cassandra") &&
        collection.onTableEntitiesClick();
    });
  }

  private _openGraphTabForResource(databaseId: string, collectionId: string): void {
    this._executeActionHelper(() => {
      const collection: ViewModels.Collection = this._findAndExpandMatchingCollectionForResource(
        databaseId,
        collectionId
      );
      userContext.apiType === "Gremlin" && collection.onGraphDocumentsClick();
    });
  }

  private _openMongoDocumentsTabForResource(databaseId: string, collectionId: string): void {
    this._executeActionHelper(() => {
      const collection: ViewModels.Collection = this._findAndExpandMatchingCollectionForResource(
        databaseId,
        collectionId
      );
      userContext.apiType === "Mongo" && collection.onMongoDBDocumentsClick();
    });
  }

  private _openQueryTabForResource(databaseId: string, collectionId: string): void {
    this._executeActionHelper(() => {
      const collection: ViewModels.Collection = this._findAndExpandMatchingCollectionForResource(
        databaseId,
        collectionId
      );
      const matchingTab: TabsBase = this._findMatchingTabByTabKind(
        databaseId,
        collectionId,
        ViewModels.CollectionTabKind.Query
      );
      if (!!matchingTab) {
        matchingTab.onTabClick();
      } else {
        collection && collection.onNewQueryClick(collection, null);
      }
    });
  }

  private _openMongoQueryTabForResource(databaseId: string, collectionId: string): void {
    this._executeActionHelper(() => {
      const collection: ViewModels.Collection = this._findAndExpandMatchingCollectionForResource(
        databaseId,
        collectionId
      );
      const matchingTab: TabsBase = this._findMatchingTabByTabKind(
        databaseId,
        collectionId,
        ViewModels.CollectionTabKind.Query
      );
      if (!!matchingTab) {
        matchingTab.onTabClick();
      } else {
        userContext.apiType === "Mongo" && collection.onNewMongoQueryClick(collection, null);
      }
    });
  }

  private _openMongoShellTabForResource(databaseId: string, collectionId: string): void {
    this._executeActionHelper(() => {
      const collection: ViewModels.Collection = this._findAndExpandMatchingCollectionForResource(
        databaseId,
        collectionId
      );
      const matchingTab: TabsBase = this._findMatchingTabByTabKind(
        databaseId,
        collectionId,
        ViewModels.CollectionTabKind.MongoShell
      );
      if (!!matchingTab) {
        matchingTab.onTabClick();
      } else {
        userContext.apiType === "Mongo" && collection.onNewMongoShellClick();
      }
    });
  }

  private _openDatabaseSettingsTabForResource(databaseId: string): void {
    this._executeActionHelper(() => {
      const explorer = window.dataExplorer;
      const database: ViewModels.Database = _.find(
        explorer.databases(),
        (database: ViewModels.Database) => database.id() === databaseId
      );
      database && database.onSettingsClick();
    });
  }

  private _openSettingsTabForResource(databaseId: string, collectionId: string): void {
    this._executeActionHelper(() => {
      const collection: ViewModels.Collection = this._findAndExpandMatchingCollectionForResource(
        databaseId,
        collectionId
      );
      collection && collection.onSettingsClick();
    });
  }

  private _openNewSprocTabForResource(databaseId: string, collectionId: string): void {
    this._executeActionHelper(() => {
      const collection: ViewModels.Collection = this._findAndExpandMatchingCollectionForResource(
        databaseId,
        collectionId
      );
      const matchingTab: TabsBase = this._findMatchingTabByTabKind(
        databaseId,
        collectionId,
        ViewModels.CollectionTabKind.StoredProcedures,
        true
      );
      if (!!matchingTab) {
        matchingTab.onTabClick();
      } else {
        collection && collection.onNewStoredProcedureClick(collection, null);
      }
    });
  }

  private _openSprocTabForResource(databaseId: string, collectionId: string, sprocId: string): void {
    this._executeActionHelper(() => {
      const collection: ViewModels.Collection = this._findMatchingCollectionForResource(databaseId, collectionId);
      collection && collection.expandCollection();
      const storedProcedure = collection && collection.findStoredProcedureWithId(sprocId);
      storedProcedure && storedProcedure.open();
    });
  }

  private _openNewTriggerTabForResource(databaseId: string, collectionId: string): void {
    this._executeActionHelper(() => {
      const collection: ViewModels.Collection = this._findAndExpandMatchingCollectionForResource(
        databaseId,
        collectionId
      );
      const matchingTab: TabsBase = this._findMatchingTabByTabKind(
        databaseId,
        collectionId,
        ViewModels.CollectionTabKind.Triggers,
        true
      );
      if (!!matchingTab) {
        matchingTab.onTabClick();
      } else {
        collection && collection.onNewTriggerClick(collection, null);
      }
    });
  }

  private _openTriggerTabForResource(databaseId: string, collectionId: string, triggerId: string): void {
    this._executeActionHelper(() => {
      const collection: ViewModels.Collection = this._findMatchingCollectionForResource(databaseId, collectionId);
      collection && collection.expandCollection();
      const trigger = collection && collection.findTriggerWithId(triggerId);
      trigger && trigger.open();
    });
  }

  private _openNewUserDefinedFunctionTabForResource(databaseId: string, collectionId: string): void {
    this._executeActionHelper(() => {
      const collection: ViewModels.Collection = this._findAndExpandMatchingCollectionForResource(
        databaseId,
        collectionId
      );
      const matchingTab: TabsBase = this._findMatchingTabByTabKind(
        databaseId,
        collectionId,
        ViewModels.CollectionTabKind.UserDefinedFunctions,
        true
      );
      if (!!matchingTab) {
        matchingTab.onTabClick();
      } else {
        collection && collection.onNewUserDefinedFunctionClick(collection, null);
      }
    });
  }

  private _openUserDefinedFunctionTabForResource(databaseId: string, collectionId: string, udfId: string): void {
    this._executeActionHelper(() => {
      const collection: ViewModels.Collection = this._findMatchingCollectionForResource(databaseId, collectionId);
      collection && collection.expandCollection();
      const userDefinedFunction = collection && collection.findUserDefinedFunctionWithId(udfId);
      userDefinedFunction && userDefinedFunction.open();
    });
  }

  private _openConflictsTabForResource(databaseId: string, collectionId: string): void {
    this._executeActionHelper(() => {
      const collection: ViewModels.Collection = this._findAndExpandMatchingCollectionForResource(
        databaseId,
        collectionId
      );
      collection && collection.container && collection.onConflictsClick();
    });
  }

  private _findAndExpandMatchingCollectionForResource(databaseId: string, collectionId: string): ViewModels.Collection {
    const matchedCollection: ViewModels.Collection = this._findMatchingCollectionForResource(databaseId, collectionId);
    matchedCollection && matchedCollection.expandCollection();

    return matchedCollection;
  }

  private _findMatchingTabByTabKind(
    databaseId: string,
    collectionId: string,
    tabKind: ViewModels.CollectionTabKind,
    isNewScriptTab?: boolean
  ): TabsBase {
    const explorer = window.dataExplorer;
    const matchingTabs: TabsBase[] = explorer.tabsManager.getTabs(
      tabKind,
      (tab: TabsBase) =>
        tab.collection &&
        tab.collection.databaseId === databaseId &&
        tab.collection.id() === collectionId &&
        (!isNewScriptTab || (tab as ScriptTabBase).isNew())
    );
    return matchingTabs && matchingTabs[0];
  }

  private _findMatchingCollectionForResource(databaseId: string, collectionId: string): ViewModels.Collection {
    const explorer = window.dataExplorer;
    const matchedDatabase: ViewModels.Database = explorer.findDatabaseWithId(databaseId);
    const matchedCollection: ViewModels.Collection =
      matchedDatabase && matchedDatabase.findCollectionWithId(collectionId);

    return matchedCollection;
  }

  private _executeActionHelper(action: () => void): void {
    const explorer = window.dataExplorer;
    if (explorer && explorer.isAccountReady()) {
      action();
    }
  }
}
