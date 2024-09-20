import { AppStateComponentNames, deleteState, loadState, saveState } from "Shared/AppStatePersistenceUtility";
import { CollectionBase } from "../../Contracts/ViewModels";
import { LocalStorageUtility, StorageKey } from "../../Shared/StorageUtility";

export enum Type {
  OpenCollection = "OpenCollection",
  OpenNotebook = "OpenNotebook",
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
              itemsMap[accountId].map((item) => {
                if ((item.type as unknown as number) === 0) {
                  item.type = Type.OpenCollection;
                } else if ((item.type as unknown as number) === 1) {
                  item.type = Type.OpenNotebook;
                }
                return item;
              }),
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

  let items =
    (loadState({
      componentName: AppStateComponentNames.MostRecentActivity,
      globalAccountName: accountName,
    }) as Item[]) || [];

  // Remove duplicate
  items = removeDuplicate(newItem, items);

  items.unshift(newItem);
  items = cleanupItems(items, accountName);
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

// Sort object by key
const sortObjectKeys = (unordered: Record<string, unknown>): Record<string, unknown> => {
  return Object.keys(unordered)
    .sort()
    .reduce((obj: Record<string, unknown>, key: string) => {
      obj[key] = unordered[key];
      return obj;
    }, {});
};

/**
 * Find items by doing strict comparison and remove from array if duplicate is found.
 * Modifies the array.
 * @param item
 * @param itemsArray
 * @returns new array
 */
const removeDuplicate = (item: Item, itemsArray: Item[]): Item[] => {
  if (!itemsArray) {
    return itemsArray;
  }

  const result: Item[] = [...itemsArray];

  let index = -1;
  for (let i = 0; i < result.length; i++) {
    const currentItem = result[i];

    if (
      JSON.stringify(sortObjectKeys(currentItem as unknown as Record<string, unknown>)) ===
      JSON.stringify(sortObjectKeys(item as unknown as Record<string, unknown>))
    ) {
      index = i;
      break;
    }
  }

  if (index !== -1) {
    result.splice(index, 1);
  }

  return result;
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
