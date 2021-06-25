import _ from "underscore";
import create, { UseStore } from "zustand";
import * as Constants from "../Common/Constants";
import { readDatabases } from "../Common/dataAccess/readDatabases";
import { getErrorMessage, getErrorStack } from "../Common/ErrorHandlingUtils";
import * as DataModels from "../Contracts/DataModels";
import * as ViewModels from "../Contracts/ViewModels";
import { useTabs } from "../hooks/useTabs";
import { Action } from "../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../Shared/Telemetry/TelemetryProcessor";
import { logConsoleError } from "../Utils/NotificationConsoleUtils";
import Database from "./Tree/Database";
import { useSelectedNode } from "./useSelectedNode";

const MaxNbDatabasesToAutoExpand = 5;
interface DatabasesState {
  databases: ViewModels.Database[];
  updateDatabase: (database: ViewModels.Database) => void;
  addDatabases: (databases: ViewModels.Database[]) => void;
  deleteDatabase: (database: ViewModels.Database) => void;
  clearDatabases: () => void;
  isSaveQueryEnabled: () => boolean;
  findDatabaseWithId: (databaseId: string) => ViewModels.Database;
  isLastNonEmptyDatabase: () => boolean;
  findCollection: (databaseId: string, collectionId: string) => ViewModels.Collection;
  isLastCollection: () => boolean;
  loadDatabaseOffers: () => Promise<void>;
  isFirstResourceCreated: () => boolean;
  findSelectedDatabase: () => ViewModels.Database;
  refreshDatabases: () => Promise<void>;
}

export const useDatabases: UseStore<DatabasesState> = create((set, get) => ({
  databases: [],
  updateDatabase: (updatedDatabase: ViewModels.Database) =>
    set((state) => {
      const updatedDatabases = state.databases.map((database: ViewModels.Database) => {
        if (database.id() === updatedDatabase.id()) {
          return updatedDatabase;
        }

        return database;
      });
      return { databases: updatedDatabases };
    }),
  addDatabases: (databases: ViewModels.Database[]) =>
    set((state) => ({
      databases: [...state.databases, ...databases].sort((db1, db2) => db1.id().localeCompare(db2.id())),
    })),
  deleteDatabase: (database: ViewModels.Database) =>
    set((state) => ({ databases: state.databases.filter((db) => database.id() !== db.id()) })),
  clearDatabases: () => set(() => ({ databases: [] })),
  isSaveQueryEnabled: () => {
    const savedQueriesDatabase: ViewModels.Database = _.find(
      get().databases,
      (database: ViewModels.Database) => database.id() === Constants.SavedQueries.DatabaseName
    );
    if (!savedQueriesDatabase) {
      return false;
    }
    const savedQueriesCollection: ViewModels.Collection =
      savedQueriesDatabase &&
      _.find(
        savedQueriesDatabase.collections(),
        (collection: ViewModels.Collection) => collection.id() === Constants.SavedQueries.CollectionName
      );
    if (!savedQueriesCollection) {
      return false;
    }
    return true;
  },
  findDatabaseWithId: (databaseId: string) => get().databases.find((db) => databaseId === db.id()),
  isLastNonEmptyDatabase: () => {
    const databases = get().databases;
    return databases.length === 1 && (databases[0].collections()?.length > 0 || !!databases[0].offer());
  },
  findCollection: (databaseId: string, collectionId: string) => {
    const database = get().findDatabaseWithId(databaseId);
    return database?.collections()?.find((collection) => collection.id() === collectionId);
  },
  isLastCollection: () => {
    const databases = get().databases;
    if (databases.length === 0) {
      return false;
    }

    let collectionCount = 0;
    for (let i = 0; i < databases.length; i++) {
      const database = databases[i];
      collectionCount += database.collections().length;
      if (collectionCount > 1) {
        return false;
      }
    }

    return true;
  },
  loadDatabaseOffers: async () => {
    await Promise.all(
      get().databases?.map(async (database: ViewModels.Database) => {
        await database.loadOffer();
      })
    );
  },
  isFirstResourceCreated: () => {
    const databases = get().databases;

    if (!databases || databases.length === 0) {
      return false;
    }

    return databases.some((database) => {
      // user has created at least one collection
      if (database.collections()?.length > 0) {
        return true;
      }
      // user has created a database with shared throughput
      if (database.offer()) {
        return true;
      }
      // use has created an empty database without shared throughput
      return false;
    });
  },
  findSelectedDatabase: (): ViewModels.Database => {
    const selectedNode = useSelectedNode.getState().selectedNode;
    if (!selectedNode) {
      return undefined;
    }
    if (selectedNode.nodeKind === "Database") {
      return _.find(get().databases, (database: ViewModels.Database) => database.id() === selectedNode.id());
    }

    if (selectedNode.nodeKind === "Collection") {
      return selectedNode.database;
    }

    return selectedNode.collection?.database;
  },
  refreshDatabases: async (): Promise<void> => {
    const startKey: number = TelemetryProcessor.traceStart(Action.LoadDatabases, {
      dataExplorerArea: Constants.Areas.ResourceTree,
    });

    try {
      const databases: DataModels.Database[] = await readDatabases();
      TelemetryProcessor.traceSuccess(
        Action.LoadDatabases,
        {
          dataExplorerArea: Constants.Areas.ResourceTree,
        },
        startKey
      );
      const currentDatabases = get().databases;
      const deltaDatabases = getDeltaDatabases(databases, currentDatabases);
      let updatedDatabases = currentDatabases.filter(
        (database) => !deltaDatabases.toDelete.some((deletedDatabase) => deletedDatabase.id() === database.id())
      );
      updatedDatabases = [...updatedDatabases, ...deltaDatabases.toAdd].sort((db1, db2) =>
        db1.id().localeCompare(db2.id())
      );
      set({ databases: updatedDatabases });
      await refreshAndExpandNewDatabases(deltaDatabases.toAdd, currentDatabases);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      TelemetryProcessor.traceFailure(
        Action.LoadDatabases,
        {
          dataExplorerArea: Constants.Areas.ResourceTree,
          error: errorMessage,
          errorStack: getErrorStack(error),
        },
        startKey
      );
      logConsoleError(`Error while refreshing databases: ${errorMessage}`);
    }
  },
}));

const getDeltaDatabases = (
  updatedDatabaseList: DataModels.Database[],
  databases: ViewModels.Database[]
): {
  toAdd: ViewModels.Database[];
  toDelete: ViewModels.Database[];
} => {
  const newDatabases: DataModels.Database[] = _.filter(updatedDatabaseList, (database: DataModels.Database) => {
    const databaseExists = _.some(
      databases,
      (existingDatabase: ViewModels.Database) => existingDatabase.id() === database.id
    );
    return !databaseExists;
  });
  const databasesToAdd: ViewModels.Database[] = newDatabases.map(
    (newDatabase: DataModels.Database) => new Database(this, newDatabase)
  );

  const databasesToDelete: ViewModels.Database[] = [];
  databases.forEach((database: ViewModels.Database) => {
    const databasePresentInUpdatedList = _.some(
      updatedDatabaseList,
      (db: DataModels.Database) => db.id === database.id()
    );
    if (!databasePresentInUpdatedList) {
      databasesToDelete.push(database);
    }
  });

  return { toAdd: databasesToAdd, toDelete: databasesToDelete };
};

const refreshAndExpandNewDatabases = async (
  newDatabases: ViewModels.Database[],
  databases: ViewModels.Database[]
): Promise<void> => {
  // we reload collections for all databases so the resource tree reflects any collection-level changes
  // i.e addition of stored procedures, etc.

  // If the user has a lot of databases, only load expanded databases.
  const databasesToLoad =
    databases.length <= MaxNbDatabasesToAutoExpand
      ? databases
      : databases.filter((db) => db.isDatabaseExpanded() || db.id() === Constants.SavedQueries.DatabaseName);

  const startKey: number = TelemetryProcessor.traceStart(Action.LoadCollections, {
    dataExplorerArea: Constants.Areas.ResourceTree,
  });

  try {
    await Promise.all(
      databasesToLoad.map(async (database: ViewModels.Database) => {
        await database.loadCollections();
        const isNewDatabase: boolean = _.some(newDatabases, (db: ViewModels.Database) => db.id() === database.id());
        if (isNewDatabase) {
          database.expandDatabase();
        }
        useTabs
          .getState()
          .refreshActiveTab((tab) => tab.collection && tab.collection.getDatabase().id() === database.id());
        TelemetryProcessor.traceSuccess(
          Action.LoadCollections,
          { dataExplorerArea: Constants.Areas.ResourceTree },
          startKey
        );
      })
    );
  } catch (error) {
    TelemetryProcessor.traceFailure(
      Action.LoadCollections,
      {
        dataExplorerArea: Constants.Areas.ResourceTree,
        error: getErrorMessage(error),
        errorStack: getErrorStack(error),
      },
      startKey
    );
  }
};
