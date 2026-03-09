import create, { UseStore } from "zustand";
import * as Constants from "../Common/Constants";
import * as ViewModels from "../Contracts/ViewModels";
import * as LocalStorageUtility from "../Shared/LocalStorageUtility";
import { StorageKey } from "../Shared/StorageUtility";
import { userContext } from "../UserContext";
import { useSelectedNode } from "./useSelectedNode";

export type DatabaseSortOrder = "az" | "za";

interface DatabasesState {
  databases: ViewModels.Database[];
  resourceTokenCollection: ViewModels.CollectionBase;
  sampleDataResourceTokenCollection: ViewModels.CollectionBase;
  databasesFetchedSuccessfully: boolean; // Track if last database fetch was successful
  searchText: string;
  sortOrder: DatabaseSortOrder;
  pinnedDatabaseIds: Set<string>;
  setSearchText: (searchText: string) => void;
  setSortOrder: (sortOrder: DatabaseSortOrder) => void;
  togglePinDatabase: (databaseId: string) => void;
  isPinned: (databaseId: string) => boolean;
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

const loadPinnedDatabases = (): Set<string> => {
  const stored = LocalStorageUtility.getEntryObject<string[]>(StorageKey.PinnedDatabases);
  return new Set(Array.isArray(stored) ? stored : []);
};

const loadSortOrder = (): DatabaseSortOrder => {
  const stored = LocalStorageUtility.getEntryString(StorageKey.DatabaseSortOrder);
  return stored === "az" || stored === "za" ? stored : "az";
};

export const useDatabases: UseStore<DatabasesState> = create((set, get) => ({
  databases: [],
  resourceTokenCollection: undefined,
  sampleDataResourceTokenCollection: undefined,
  databasesFetchedSuccessfully: false,
  searchText: "",
  sortOrder: loadSortOrder(),
  pinnedDatabaseIds: loadPinnedDatabases(),
  setSearchText: (searchText: string) => set({ searchText }),
  setSortOrder: (sortOrder: DatabaseSortOrder) => {
    LocalStorageUtility.setEntryString(StorageKey.DatabaseSortOrder, sortOrder);
    set({ sortOrder });
  },
  togglePinDatabase: (databaseId: string) => {
    const current = get().pinnedDatabaseIds;
    const updated = new Set(current);
    if (updated.has(databaseId)) {
      updated.delete(databaseId);
    } else {
      updated.add(databaseId);
    }
    LocalStorageUtility.setEntryObject(StorageKey.PinnedDatabases, [...updated]);
    set({ pinnedDatabaseIds: updated });
  },
  isPinned: (databaseId: string) => get().pinnedDatabaseIds.has(databaseId),
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
      databases: [...state.databases, ...databases],
    })),
  deleteDatabase: (database: ViewModels.Database) =>
    set((state) => {
      const updated = new Set(state.pinnedDatabaseIds);
      if (updated.delete(database.id())) {
        LocalStorageUtility.setEntryObject(StorageKey.PinnedDatabases, [...updated]);
      }
      return {
        databases: state.databases.filter((db) => database.id() !== db.id()),
        pinnedDatabaseIds: updated,
      };
    }),
  clearDatabases: () => set(() => ({ databases: [] })),
  isSaveQueryEnabled: () => {
    const savedQueriesDatabase = get().databases.find(
      (database) => database.id() === Constants.SavedQueries.DatabaseName,
    );
    return !!savedQueriesDatabase
      ?.collections()
      ?.find((collection) => collection.id() === Constants.SavedQueries.CollectionName);
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
    await Promise.all(get().databases.map((database: ViewModels.Database) => database.loadOffer()));
  },
  loadAllOffers: async () => {
    await Promise.all(
      get().databases.map(async (database: ViewModels.Database) => {
        await Promise.all([database.loadOffer(), database.loadCollections()]);
        await Promise.all(
          (database.collections() || []).map((collection: ViewModels.Collection) => collection.loadOffer()),
        );
      }),
    );
  },
  isFirstResourceCreated: () => {
    const databases = get().databases;
    if (databases.length === 0) {
      return false;
    }
    return databases.some((database) => database.collections()?.length > 0 || !!database.offer());
  },
  findSelectedDatabase: (): ViewModels.Database => {
    const selectedNode = useSelectedNode.getState().selectedNode;
    if (!selectedNode) {
      return undefined;
    }
    if (selectedNode.nodeKind === "Database") {
      return get().databases.find((database) => database.id() === selectedNode.id());
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
