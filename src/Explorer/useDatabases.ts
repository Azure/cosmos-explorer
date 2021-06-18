import _ from "underscore";
import create, { UseStore } from "zustand";
import * as Constants from "../Common/Constants";
import * as ViewModels from "../Contracts/ViewModels";

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
}

export const useDatabases: UseStore<DatabasesState> = create((set, get) => ({
  databases: [],
  updateDatabase: (database: ViewModels.Database) => set((state) => ({ databases: replaceDatabase(state, database) })),
  addDatabases: (databases: ViewModels.Database[]) =>
    set((state) => ({
      databases: [...state.databases, ...databases].sort((db1, db2) => db1.id().localeCompare(db2.id())),
    })),
  deleteDatabase: (database: ViewModels.Database) =>
    set((state) => ({ databases: state.databases.filter((db) => database.id() !== db.id()) })),
  clearDatabases: () => set(() => ({ databases: [] })),
  isSaveQueryEnabled: () => findSaveQueryDatabaseAndCollection(get().databases),
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
}));

const replaceDatabase = (state: DatabasesState, updatedDatabase: ViewModels.Database) => {
  return state.databases.map((database: ViewModels.Database) => {
    if (database.id() === updatedDatabase.id()) {
      return updatedDatabase;
    }

    return database;
  });
};

const findSaveQueryDatabaseAndCollection = (databases: ViewModels.Database[]): boolean => {
  const savedQueriesDatabase: ViewModels.Database = _.find(
    databases,
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
};
