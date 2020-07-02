import * as ko from "knockout";
import { handleOpenAction } from "./OpenActions";
import * as ViewModels from "../Contracts/ViewModels";
import {
  ExplorerStub,
  DatabaseStub,
  CollectionStub,
  AddCollectionPaneStub,
  CassandraAddCollectionPane,
} from "./OpenActionsStubs";
import { ActionContracts } from "../Contracts/ExplorerContracts";

describe("OpenActions", () => {
  describe("handleOpenAction", () => {
    let explorer: ViewModels.Explorer;
    let database: ViewModels.Database;
    let collection: ViewModels.Collection;
    let databases: ViewModels.Database[];

    let expandCollection: jasmine.Spy;
    let onDocumentDBDocumentsClick: jasmine.Spy;
    let onMongoDBDocumentsClick: jasmine.Spy;
    let onTableEntitiesClick: jasmine.Spy;
    let onGraphDocumentsClick: jasmine.Spy;
    let onNewQueryClick: jasmine.Spy;
    let onSettingsClick: jasmine.Spy;
    let openAddCollectionPane: jasmine.Spy;
    let openCassandraAddCollectionPane: jasmine.Spy;

    beforeEach(() => {
      explorer = new ExplorerStub();
      explorer.addCollectionPane = new AddCollectionPaneStub();
      explorer.cassandraAddCollectionPane = new CassandraAddCollectionPane();

      database = new DatabaseStub({
        id: ko.observable("db"),
        collections: ko.observableArray<ViewModels.Collection>([]),
      });
      databases = [database];
      collection = new CollectionStub({
        id: ko.observable("coll"),
      });

      expandCollection = spyOn(collection, "expandCollection");
      onDocumentDBDocumentsClick = spyOn(collection, "onDocumentDBDocumentsClick");
      onMongoDBDocumentsClick = spyOn(collection, "onMongoDBDocumentsClick");
      onTableEntitiesClick = spyOn(collection, "onTableEntitiesClick");
      onGraphDocumentsClick = spyOn(collection, "onGraphDocumentsClick");
      onNewQueryClick = spyOn(collection, "onNewQueryClick");
      onSettingsClick = spyOn(collection, "onSettingsClick");
      openAddCollectionPane = spyOn(explorer.addCollectionPane, "open");
      openCassandraAddCollectionPane = spyOn(explorer.cassandraAddCollectionPane, "open");
    });

    describe("unknown action type", () => {
      it("should not be handled", () => {
        const action = {
          actionType: "foo",
        };
        const actionHandled = handleOpenAction(action, [], explorer);
        expect(actionHandled).toBe(false);
      });
    });

    describe("OpenPane action type", () => {
      it("should handle enum value", () => {
        const action = {
          actionType: ActionContracts.ActionType.OpenPane,
        };
        const actionHandled = handleOpenAction(action, [], explorer);
        expect(actionHandled).toBe(true);
      });

      it("should handle string value", () => {
        const action = {
          actionType: "OpenPane",
        };
        const actionHandled = handleOpenAction(action, [], explorer);
        expect(actionHandled).toBe(true);
      });

      describe("CassandraAddCollection pane kind", () => {
        it("string value should call cassandraAddCollectionPane.open", () => {
          const action = {
            actionType: "OpenPane",
            paneKind: "CassandraAddCollection",
          };

          const actionHandled = handleOpenAction(action, [], explorer);
          expect(openCassandraAddCollectionPane).toHaveBeenCalled();
        });

        it("enum value should call cassandraAddCollectionPane.open", () => {
          const action = {
            actionType: "OpenPane",
            paneKind: ActionContracts.PaneKind.CassandraAddCollection,
          };

          const actionHandled = handleOpenAction(action, [], explorer);
          expect(openCassandraAddCollectionPane).toHaveBeenCalled();
        });
      });

      describe("AddCollection pane kind", () => {
        it("string value should call addCollectionPane.open", () => {
          const action = {
            actionType: "OpenPane",
            paneKind: "AddCollection",
          };

          const actionHandled = handleOpenAction(action, [], explorer);
          expect(openAddCollectionPane).toHaveBeenCalled();
        });

        it("enum value should call addCollectionPane.open", () => {
          const action = {
            actionType: "OpenPane",
            paneKind: ActionContracts.PaneKind.AddCollection,
          };

          const actionHandled = handleOpenAction(action, [], explorer);
          expect(openAddCollectionPane).toHaveBeenCalled();
        });
      });
    });

    describe("OpenCollectionTab action type", () => {
      it("should handle string value", () => {
        const action = {
          actionType: "OpenCollectionTab",
        };
        const actionHandled = handleOpenAction(action, [], explorer);
        expect(actionHandled).toBe(true);
      });

      it("should handle enum value", () => {
        const action = {
          actionType: ActionContracts.ActionType.OpenCollectionTab,
        };
        const actionHandled = handleOpenAction(action, [], explorer);
        expect(actionHandled).toBe(true);
      });

      it("should expand collection node when handleOpenAction is called before collections are fetched", () => {
        const action = {
          actionType: "OpenCollectionTab",
          databaseResourceId: "db",
          collectionResourceId: "coll",
        };

        handleOpenAction(action, [database], explorer);
        expect(expandCollection).not.toHaveBeenCalled();

        database.collections([collection]);
        expect(expandCollection).toHaveBeenCalled();
      });

      it("should expand collection node when handleOpenAction is called", () => {
        const action = {
          actionType: "OpenCollectionTab",
          databaseResourceId: "db",
          collectionResourceId: "coll",
        };

        database.collections([collection]);
        handleOpenAction(action, [database], explorer);
        expect(expandCollection).toHaveBeenCalled();
      });

      describe("SQLDocuments tab kind", () => {
        it("string value should call onDocumentDBDocumentsClick before collections are fetched", () => {
          const action = {
            actionType: "OpenCollectionTab",
            tabKind: "SQLDocuments",
            databaseResourceId: "db",
            collectionResourceId: "coll",
          };

          handleOpenAction(action, [database], explorer);
          expect(onDocumentDBDocumentsClick).not.toHaveBeenCalled();

          database.collections([collection]);
          expect(onDocumentDBDocumentsClick).toHaveBeenCalled();
        });

        it("string value should call onDocumentDBDocumentsClick", () => {
          const action = {
            actionType: "OpenCollectionTab",
            tabKind: "SQLDocuments",
            databaseResourceId: "db",
            collectionResourceId: "coll",
          };

          database.collections([collection]);
          handleOpenAction(action, [database], explorer);
          expect(onDocumentDBDocumentsClick).toHaveBeenCalled();
        });

        it("enum value should call onDocumentDBDocumentsClick before collections are fetched", () => {
          const action = {
            actionType: "OpenCollectionTab",
            tabKind: ActionContracts.TabKind.SQLDocuments,
            databaseResourceId: "db",
            collectionResourceId: "coll",
          };

          handleOpenAction(action, [database], explorer);
          expect(onDocumentDBDocumentsClick).not.toHaveBeenCalled();

          database.collections([collection]);
          expect(onDocumentDBDocumentsClick).toHaveBeenCalled();
        });

        it("enum value should call onDocumentDBDocumentsClick", () => {
          const action = {
            actionType: "OpenCollectionTab",
            tabKind: ActionContracts.TabKind.SQLDocuments,
            databaseResourceId: "db",
            collectionResourceId: "coll",
          };

          database.collections([collection]);
          handleOpenAction(action, [database], explorer);
          expect(onDocumentDBDocumentsClick).toHaveBeenCalled();
        });
      });

      describe("MongoDocuments tab kind", () => {
        it("string value should call onMongoDBDocumentsClick before collections are fetched", () => {
          const action = {
            actionType: "OpenCollectionTab",
            tabKind: "MongoDocuments",
            databaseResourceId: "db",
            collectionResourceId: "coll",
          };

          handleOpenAction(action, [database], explorer);
          expect(onMongoDBDocumentsClick).not.toHaveBeenCalled();

          database.collections([collection]);
          expect(onMongoDBDocumentsClick).toHaveBeenCalled();
        });

        it("string value should call onMongoDBDocumentsClick", () => {
          const action = {
            actionType: "OpenCollectionTab",
            tabKind: "MongoDocuments",
            databaseResourceId: "db",
            collectionResourceId: "coll",
          };

          database.collections([collection]);
          handleOpenAction(action, [database], explorer);
          expect(onMongoDBDocumentsClick).toHaveBeenCalled();
        });

        it("enum value should call onMongoDBDocumentsClick before collections are fetched", () => {
          const action = {
            actionType: "OpenCollectionTab",
            tabKind: ActionContracts.TabKind.MongoDocuments,
            databaseResourceId: "db",
            collectionResourceId: "coll",
          };

          handleOpenAction(action, [database], explorer);
          expect(onMongoDBDocumentsClick).not.toHaveBeenCalled();

          database.collections([collection]);
          expect(onMongoDBDocumentsClick).toHaveBeenCalled();
        });

        it("enum value should call onMongoDBDocumentsClick", () => {
          const action = {
            actionType: "OpenCollectionTab",
            tabKind: ActionContracts.TabKind.MongoDocuments,
            databaseResourceId: "db",
            collectionResourceId: "coll",
          };

          database.collections([collection]);
          handleOpenAction(action, [database], explorer);
          expect(onMongoDBDocumentsClick).toHaveBeenCalled();
        });
      });

      describe("TableEntities tab kind", () => {
        it("string value should call onTableEntitiesClick before collections are fetched", () => {
          const action = {
            actionType: "OpenCollectionTab",
            tabKind: "TableEntities",
            databaseResourceId: "db",
            collectionResourceId: "coll",
          };

          handleOpenAction(action, [database], explorer);
          expect(onTableEntitiesClick).not.toHaveBeenCalled();

          database.collections([collection]);
          expect(onTableEntitiesClick).toHaveBeenCalled();
        });

        it("string value should call onTableEntitiesClick", () => {
          const action = {
            actionType: "OpenCollectionTab",
            tabKind: "TableEntities",
            databaseResourceId: "db",
            collectionResourceId: "coll",
          };

          database.collections([collection]);
          handleOpenAction(action, [database], explorer);
          expect(onTableEntitiesClick).toHaveBeenCalled();
        });

        it("enum value should call onTableEntitiesClick before collections are fetched", () => {
          const action = {
            actionType: "OpenCollectionTab",
            tabKind: ActionContracts.TabKind.TableEntities,
            databaseResourceId: "db",
            collectionResourceId: "coll",
          };

          database.collections([collection]);
          handleOpenAction(action, [database], explorer);
          expect(onTableEntitiesClick).toHaveBeenCalled();
        });

        it("enum value should call onTableEntitiesClick", () => {
          const action = {
            actionType: "OpenCollectionTab",
            tabKind: ActionContracts.TabKind.TableEntities,
            databaseResourceId: "db",
            collectionResourceId: "coll",
          };

          handleOpenAction(action, [database], explorer);
          expect(onTableEntitiesClick).not.toHaveBeenCalled();

          database.collections([collection]);
          expect(onTableEntitiesClick).toHaveBeenCalled();
        });
      });

      describe("Graph tab kind", () => {
        it("string value should call onGraphDocumentsClick before collections are fetched", () => {
          const action = {
            actionType: "OpenCollectionTab",
            tabKind: "Graph",
            databaseResourceId: "db",
            collectionResourceId: "coll",
          };

          handleOpenAction(action, [database], explorer);
          expect(onGraphDocumentsClick).not.toHaveBeenCalled();

          database.collections([collection]);
          expect(onGraphDocumentsClick).toHaveBeenCalled();
        });

        it("string value should call onGraphDocumentsClick", () => {
          const action = {
            actionType: "OpenCollectionTab",
            tabKind: "Graph",
            databaseResourceId: "db",
            collectionResourceId: "coll",
          };

          database.collections([collection]);
          handleOpenAction(action, [database], explorer);
          expect(onGraphDocumentsClick).toHaveBeenCalled();
        });

        it("enum value should call onGraphDocumentsClick before collections are fetched", () => {
          const action = {
            actionType: "OpenCollectionTab",
            tabKind: ActionContracts.TabKind.Graph,
            databaseResourceId: "db",
            collectionResourceId: "coll",
          };

          handleOpenAction(action, [database], explorer);
          expect(onGraphDocumentsClick).not.toHaveBeenCalled();

          database.collections([collection]);
          expect(onGraphDocumentsClick).toHaveBeenCalled();
        });

        it("enum value should call onGraphDocumentsClick", () => {
          const action = {
            actionType: "OpenCollectionTab",
            tabKind: ActionContracts.TabKind.Graph,
            databaseResourceId: "db",
            collectionResourceId: "coll",
          };

          database.collections([collection]);
          handleOpenAction(action, [database], explorer);
          expect(onGraphDocumentsClick).toHaveBeenCalled();
        });
      });

      describe("SQLQuery tab kind", () => {
        it("string value should call onNewQueryClick before collections are fetched", () => {
          const action = {
            actionType: "OpenCollectionTab",
            tabKind: "SQLQuery",
            databaseResourceId: "db",
            collectionResourceId: "coll",
          };

          handleOpenAction(action, [database], explorer);
          expect(onNewQueryClick).not.toHaveBeenCalled();

          database.collections([collection]);
          expect(onNewQueryClick).toHaveBeenCalled();
        });

        it("string value should call onNewQueryClick", () => {
          const action = {
            actionType: "OpenCollectionTab",
            tabKind: "SQLQuery",
            databaseResourceId: "db",
            collectionResourceId: "coll",
          };

          database.collections([collection]);
          handleOpenAction(action, [database], explorer);
          expect(onNewQueryClick).toHaveBeenCalled();
        });

        it("enum value should call onNewQueryClick before collections are fetched", () => {
          const action = {
            actionType: "OpenCollectionTab",
            tabKind: ActionContracts.TabKind.SQLQuery,
            databaseResourceId: "db",
            collectionResourceId: "coll",
          };

          handleOpenAction(action, [database], explorer);
          expect(onNewQueryClick).not.toHaveBeenCalled();

          database.collections([collection]);
          expect(onNewQueryClick).toHaveBeenCalled();
        });

        it("enum value should call onNewQueryClick", () => {
          const action = {
            actionType: "OpenCollectionTab",
            tabKind: ActionContracts.TabKind.SQLQuery,
            databaseResourceId: "db",
            collectionResourceId: "coll",
          };

          database.collections([collection]);
          handleOpenAction(action, [database], explorer);
          expect(onNewQueryClick).toHaveBeenCalled();
        });
      });

      describe("ScaleSettings tab kind", () => {
        it("string value should call onSettingsClick before collections are fetched", () => {
          const action = {
            actionType: "OpenCollectionTab",
            tabKind: "ScaleSettings",
            databaseResourceId: "db",
            collectionResourceId: "coll",
          };

          handleOpenAction(action, [database], explorer);
          expect(onSettingsClick).not.toHaveBeenCalled();

          database.collections([collection]);
          expect(onSettingsClick).toHaveBeenCalled();
        });

        it("string value should call onSettingsClick", () => {
          const action = {
            actionType: "OpenCollectionTab",
            tabKind: "ScaleSettings",
            databaseResourceId: "db",
            collectionResourceId: "coll",
          };

          database.collections([collection]);
          handleOpenAction(action, [database], explorer);
          expect(onSettingsClick).toHaveBeenCalled();
        });

        it("enum value should call onSettingsClick before collections are fetched", () => {
          const action = {
            actionType: "OpenCollectionTab",
            tabKind: ActionContracts.TabKind.ScaleSettings,
            databaseResourceId: "db",
            collectionResourceId: "coll",
          };

          handleOpenAction(action, [database], explorer);
          expect(onSettingsClick).not.toHaveBeenCalled();

          database.collections([collection]);
          expect(onSettingsClick).toHaveBeenCalled();
        });

        it("enum value should call onSettingsClick", () => {
          const action = {
            actionType: "OpenCollectionTab",
            tabKind: ActionContracts.TabKind.ScaleSettings,
            databaseResourceId: "db",
            collectionResourceId: "coll",
          };

          database.collections([collection]);
          handleOpenAction(action, [database], explorer);
          expect(onSettingsClick).toHaveBeenCalled();
        });
      });
    });
  });
});
