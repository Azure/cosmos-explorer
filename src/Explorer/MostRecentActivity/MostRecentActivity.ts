import { AppStateComponentNames, deleteState, loadState, saveState } from "Shared/AppStatePersistenceUtility";
import { CollectionBase } from "../../Contracts/ViewModels";
import { LocalStorageUtility, StorageKey } from "../../Shared/StorageUtility";

export enum Type {
  OpenCollection,
  OpenNotebook,
}

export interface OpenNotebookItem {
  type: Type.OpenNotebook;
  name: string;
  path: string;
}

export interface OpenCollectionItem {
  type: Type.OpenCollection;
  databaseId: string;
  collectionId: string;
}

type Item = OpenNotebookItem | OpenCollectionItem;

const itemsMaxNumber: number = 5;

/**
 * Migrate old data to new AppState
 */
const migrateOldData = () => {
  if (LocalStorageUtility.hasItem(StorageKey.MostRecentActivity)) {
    const oldDataSchemaVersion: string = "2";
    const rawData = LocalStorageUtility.getEntryString(StorageKey.MostRecentActivity);
    if (rawData) {
      const oldData = JSON.parse(rawData);
      if (oldData.schemaVersion === oldDataSchemaVersion) {
        const itemsMap: Record<string, Item[]> = oldData.itemsMap;
        Object.keys(itemsMap).forEach((accountId: string) => {
          const accountName = accountId.split("/").pop();
          if (accountName) {
            saveState(
              {
                componentName: AppStateComponentNames.MostRecentActivity,
                globalAccountName: accountName,
              },
              itemsMap[accountId],
            );
          }
        });
      }
    }

    // Remove old data
    LocalStorageUtility.removeEntry(StorageKey.MostRecentActivity);
  }
};

const addItem = (accountName: string, newItem: Item): void => {
  // When debugging, accountId is "undefined": most recent activity cannot be saved by account. Uncomment to disable.
  // if (!accountId) {
  //   return;
  // }

  const items =
    (loadState({
      componentName: AppStateComponentNames.MostRecentActivity,
      globalAccountName: accountName,
    }) as Item[]) || [];

  // Remove duplicate
  removeDuplicate(newItem, items);

  items.unshift(newItem);
  cleanupItems(items, accountName);
  saveState(
    {
      componentName: AppStateComponentNames.MostRecentActivity,
      globalAccountName: accountName,
    },
    items,
  );
};

export const getItems = (accountName: string): Item[] => {
  if (!accountName) {
    return [];
  }

  return (
    (loadState({
      componentName: AppStateComponentNames.MostRecentActivity,
      globalAccountName: accountName,
    }) as Item[]) || []
  );
};

export const collectionWasOpened = (
  accountName: string,
  { id, databaseId }: Pick<CollectionBase, "id" | "databaseId">,
) => {
  if (accountName === undefined) {
    return;
  }

  const collectionId = id();
  addItem(accountName, {
    type: Type.OpenCollection,
    databaseId,
    collectionId,
  });
};

export const clear = (accountName: string): void => {
  if (!accountName) {
    return;
  }

  deleteState({
    componentName: AppStateComponentNames.MostRecentActivity,
    globalAccountName: accountName,
  });
};

/**
 * Find items by doing strict comparison and remove from array if duplicate is found.
 * Modifies the array.
 * @param item
 * @param itemsArray
 */
const removeDuplicate = (item: Item, itemsArray: Item[]): void => {
  if (!itemsArray) {
    return;
  }

  let index = -1;
  for (let i = 0; i < itemsArray.length; i++) {
    const currentItem = itemsArray[i];
    if (JSON.stringify(currentItem) === JSON.stringify(item)) {
      index = i;
      break;
    }
  }

  if (index !== -1) {
    itemsArray.splice(index, 1);
  }
};

/**
 * Remove unknown types
 * Limit items to max number
 * Modifies the array.
 */
const cleanupItems = (items: Item[], accountName: string): Item[] => {
  if (accountName === undefined) {
    return [];
  }

  const itemsArray = items.filter((item) => item.type in Type).slice(0, itemsMaxNumber);
  if (itemsArray.length === 0) {
    deleteState({
      componentName: AppStateComponentNames.MostRecentActivity,
      globalAccountName: accountName,
    });
  }
  return itemsArray;
};

migrateOldData();
