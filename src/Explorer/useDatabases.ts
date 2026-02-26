import _ from "underscore";
import create, { UseStore } from "zustand";
import * as Constants from "../Common/Constants";
import * as ViewModels from "../Contracts/ViewModels";
import { userContext } from "../UserContext";
import { useSelectedNode } from "./useSelectedNode";

interface DatabasesState {
  databases: ViewModels.Database[];
  resourceTokenCollection: ViewModels.CollectionBase;
  sampleDataResourceTokenCollection: ViewModels.CollectionBase;
  databasesFetchedSuccessfully: boolean; // Track if last database fetch was successful
  searchText: string; 
  setSearchText: (searchText: string) => void;
  updateDatabase: (database: ViewModels.Database) => void;
  addDatabases: (databases: ViewModels.Database[]) => void;
  deleteDatabase: (database: ViewModels.Database) => void;
  clearDatabases: () => void;
  isSaveQueryEnabled: () => boolean;
  findDatabaseWithId: (databaseId: string, isSampleDatabase?: boolean) => ViewModels.Database;
  isLastNonEmptyDatabase: () => boolean;
  findCollection: (databaseId: string, collectionId: string) => ViewModels.Collection;
  isLastCollection: () => boolean;
  loadDatabaseOffers: () => Promise<void>;
  loadAllOffers: () => Promise<void>;
  isFirstResourceCreated: () => boolean;
  findSelectedDatabase: () => ViewModels.Database;
  validateDatabaseId: (id: string) => boolean;
  validateCollectionId: (databaseId: string, collectionId: string) => Promise<boolean>;
}

export const useDatabases: UseStore<DatabasesState> = create((set, get) => ({
  databases: [],
  resourceTokenCollection: undefined,
  sampleDataResourceTokenCollection: undefined,
  databasesFetchedSuccessfully: false,
  searchText: "",
  setSearchText: (searchText: string) => set({ searchText }),
  updateDatabase: (updatedDatabase: ViewModels.Database) =>
    set((state) => {
      const updatedDatabases = state.databases.map((database: ViewModels.Database) => {
        if (database?.id() === updatedDatabase?.id()) {
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
      (database: ViewModels.Database) => database.id() === Constants.SavedQueries.DatabaseName,
    );
    if (!savedQueriesDatabase) {
      return false;
    }
    const savedQueriesCollection: ViewModels.Collection =
      savedQueriesDatabase &&
      _.find(
        savedQueriesDatabase.collections(),
        (collection: ViewModels.Collection) => collection.id() === Constants.SavedQueries.CollectionName,
      );
    if (!savedQueriesCollection) {
      return false;
    }
    return true;
  },
  findDatabaseWithId: (databaseId: string, isSampleDatabase?: boolean) => {
    return isSampleDatabase === undefined
      ? get().databases.find((db) => databaseId === db.id())
      : get().databases.find((db) => databaseId === db.id() && db.isSampleDB === isSampleDatabase);
  },
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
      }),
    );
  },
  loadAllOffers: async () => {
    await Promise.all(
      get().databases?.map(async (database: ViewModels.Database) => {
        await database.loadOffer();
        await database.loadCollections();
        await Promise.all(
          (database.collections() || []).map(async (collection: ViewModels.Collection) => {
            await collection.loadOffer();
          }),
        );
      }),
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
  validateDatabaseId: (id: string): boolean => {
    return !get().databases.some((database) => database.id() === id);
  },
  validateCollectionId: async (databaseId: string, collectionId: string): Promise<boolean> => {
    const database = get().databases.find((db) => db.id() === databaseId);
    // For a new tables account, database is undefined when creating the first table
    if (!database && userContext.apiType === "Tables") {
      return true;
    }

    await database.loadCollections();
    return !database.collections().some((collection) => collection.id() === collectionId);
  },
}));
