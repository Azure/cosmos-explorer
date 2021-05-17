import * as ko from "knockout";
import { ActionContracts } from "../Contracts/ExplorerContracts";
import * as ViewModels from "../Contracts/ViewModels";
import Explorer from "./Explorer";
import { handleOpenAction } from "./OpenActions";
import CassandraAddCollectionPane from "./Panes/CassandraAddCollectionPane";

describe("OpenActions", () => {
  describe("handleOpenAction", () => {
    let explorer: Explorer;
    let database: ViewModels.Database;
    let collection: ViewModels.Collection;
    let databases: ViewModels.Database[];

    beforeEach(() => {
      explorer = {} as Explorer;
      explorer.onNewCollectionClicked = jest.fn();
      explorer.cassandraAddCollectionPane = {} as CassandraAddCollectionPane;
      explorer.cassandraAddCollectionPane.open = jest.fn();

      database = {
        id: ko.observable("db"),
        collections: ko.observableArray<ViewModels.Collection>([]),
      } as ViewModels.Database;
      databases = [database];
      collection = {
        id: ko.observable("coll"),
      } as ViewModels.Collection;

      collection.expandCollection = jest.fn();
      collection.onDocumentDBDocumentsClick = jest.fn();
      collection.onMongoDBDocumentsClick = jest.fn();
      collection.onSchemaAnalyzerClick = jest.fn();
      collection.onTableEntitiesClick = jest.fn();
      collection.onGraphDocumentsClick = jest.fn();
      collection.onNewQueryClick = jest.fn();
      collection.onSettingsClick = jest.fn();
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
          expect(explorer.cassandraAddCollectionPane.open).toHaveBeenCalled();
        });

        it("enum value should call cassandraAddCollectionPane.open", () => {
          const action = {
            actionType: "OpenPane",
            paneKind: ActionContracts.PaneKind.CassandraAddCollection,
          };

          const actionHandled = handleOpenAction(action, [], explorer);
          expect(explorer.cassandraAddCollectionPane.open).toHaveBeenCalled();
        });
      });

      describe("AddCollection pane kind", () => {
        it("string value should call explorer.onNewCollectionClicked", () => {
          const action = {
            actionType: "OpenPane",
            paneKind: "AddCollection",
          };

          const actionHandled = handleOpenAction(action, [], explorer);
          expect(explorer.onNewCollectionClicked).toHaveBeenCalled();
        });

        it("enum value should call explorer.onNewCollectionClicked", () => {
          const action = {
            actionType: "OpenPane",
            paneKind: ActionContracts.PaneKind.AddCollection,
          };

          const actionHandled = handleOpenAction(action, [], explorer);
          expect(explorer.onNewCollectionClicked).toHaveBeenCalled();
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
        expect(collection.expandCollection).not.toHaveBeenCalled();

        database.collections([collection]);
        expect(collection.expandCollection).toHaveBeenCalled();
      });

      it("should expand collection node when handleOpenAction is called", () => {
        const action = {
          actionType: "OpenCollectionTab",
          databaseResourceId: "db",
          collectionResourceId: "coll",
        };

        database.collections([collection]);
        handleOpenAction(action, [database], explorer);
        expect(collection.expandCollection).toHaveBeenCalled();
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
          expect(collection.onDocumentDBDocumentsClick).not.toHaveBeenCalled();

          database.collections([collection]);
          expect(collection.onDocumentDBDocumentsClick).toHaveBeenCalled();
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
          expect(collection.onDocumentDBDocumentsClick).toHaveBeenCalled();
        });

        it("enum value should call onDocumentDBDocumentsClick before collections are fetched", () => {
          const action = {
            actionType: "OpenCollectionTab",
            tabKind: ActionContracts.TabKind.SQLDocuments,
            databaseResourceId: "db",
            collectionResourceId: "coll",
          };

          handleOpenAction(action, [database], explorer);
          expect(collection.onDocumentDBDocumentsClick).not.toHaveBeenCalled();

          database.collections([collection]);
          expect(collection.onDocumentDBDocumentsClick).toHaveBeenCalled();
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
          expect(collection.onDocumentDBDocumentsClick).toHaveBeenCalled();
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
          expect(collection.onMongoDBDocumentsClick).not.toHaveBeenCalled();

          database.collections([collection]);
          expect(collection.onMongoDBDocumentsClick).toHaveBeenCalled();
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
          expect(collection.onMongoDBDocumentsClick).toHaveBeenCalled();
        });

        it("enum value should call onMongoDBDocumentsClick before collections are fetched", () => {
          const action = {
            actionType: "OpenCollectionTab",
            tabKind: ActionContracts.TabKind.MongoDocuments,
            databaseResourceId: "db",
            collectionResourceId: "coll",
          };

          handleOpenAction(action, [database], explorer);
          expect(collection.onMongoDBDocumentsClick).not.toHaveBeenCalled();

          database.collections([collection]);
          expect(collection.onMongoDBDocumentsClick).toHaveBeenCalled();
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
          expect(collection.onMongoDBDocumentsClick).toHaveBeenCalled();
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
          expect(collection.onTableEntitiesClick).not.toHaveBeenCalled();

          database.collections([collection]);
          expect(collection.onTableEntitiesClick).toHaveBeenCalled();
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
          expect(collection.onTableEntitiesClick).toHaveBeenCalled();
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
          expect(collection.onTableEntitiesClick).toHaveBeenCalled();
        });

        it("enum value should call onTableEntitiesClick", () => {
          const action = {
            actionType: "OpenCollectionTab",
            tabKind: ActionContracts.TabKind.TableEntities,
            databaseResourceId: "db",
            collectionResourceId: "coll",
          };

          handleOpenAction(action, [database], explorer);
          expect(collection.onTableEntitiesClick).not.toHaveBeenCalled();

          database.collections([collection]);
          expect(collection.onTableEntitiesClick).toHaveBeenCalled();
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
          expect(collection.onGraphDocumentsClick).not.toHaveBeenCalled();

          database.collections([collection]);
          expect(collection.onGraphDocumentsClick).toHaveBeenCalled();
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
          expect(collection.onGraphDocumentsClick).toHaveBeenCalled();
        });

        it("enum value should call onGraphDocumentsClick before collections are fetched", () => {
          const action = {
            actionType: "OpenCollectionTab",
            tabKind: ActionContracts.TabKind.Graph,
            databaseResourceId: "db",
            collectionResourceId: "coll",
          };

          handleOpenAction(action, [database], explorer);
          expect(collection.onGraphDocumentsClick).not.toHaveBeenCalled();

          database.collections([collection]);
          expect(collection.onGraphDocumentsClick).toHaveBeenCalled();
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
          expect(collection.onGraphDocumentsClick).toHaveBeenCalled();
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
          expect(collection.onNewQueryClick).not.toHaveBeenCalled();

          database.collections([collection]);
          expect(collection.onNewQueryClick).toHaveBeenCalled();
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
          expect(collection.onNewQueryClick).toHaveBeenCalled();
        });

        it("enum value should call onNewQueryClick before collections are fetched", () => {
          const action = {
            actionType: "OpenCollectionTab",
            tabKind: ActionContracts.TabKind.SQLQuery,
            databaseResourceId: "db",
            collectionResourceId: "coll",
          };

          handleOpenAction(action, [database], explorer);
          expect(collection.onNewQueryClick).not.toHaveBeenCalled();

          database.collections([collection]);
          expect(collection.onNewQueryClick).toHaveBeenCalled();
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
          expect(collection.onNewQueryClick).toHaveBeenCalled();
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
          expect(collection.onSettingsClick).not.toHaveBeenCalled();

          database.collections([collection]);
          expect(collection.onSettingsClick).toHaveBeenCalled();
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
          expect(collection.onSettingsClick).toHaveBeenCalled();
        });

        it("enum value should call onSettingsClick before collections are fetched", () => {
          const action = {
            actionType: "OpenCollectionTab",
            tabKind: ActionContracts.TabKind.ScaleSettings,
            databaseResourceId: "db",
            collectionResourceId: "coll",
          };

          handleOpenAction(action, [database], explorer);
          expect(collection.onSettingsClick).not.toHaveBeenCalled();

          database.collections([collection]);
          expect(collection.onSettingsClick).toHaveBeenCalled();
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
          expect(collection.onSettingsClick).toHaveBeenCalled();
        });
      });
    });
  });
});
