import { CollectionBase } from "../../Contracts/ViewModels";
import { StorageKey, LocalStorageUtility } from "../../Shared/StorageUtility";
import { NotebookContentItem } from "../Notebook/NotebookContentItem";

export enum Type {
  OpenCollection,
  OpenNotebook,
}

export interface OpenNotebookItem {
  name: string;
  path: string;
}

export interface OpenCollectionItem {
  databaseId: string;
  collectionId: string;
}

export interface Item {
  type: Type;
  title: string;
  description: string;
  data: OpenNotebookItem | OpenCollectionItem;
}

// Update schemaVersion if you are going to change this interface
interface StoredData {
  schemaVersion: string;
  itemsMap: { [accountId: string]: Item[] }; // FIFO
}

/**
 * Stores most recent activity
 */
class MostRecentActivity {
  private static readonly schemaVersion: string = "1";
  private static itemsMaxNumber: number = 5;
  private storedData: StoredData;
  constructor() {
    // Retrieve from local storage
    if (LocalStorageUtility.hasItem(StorageKey.MostRecentActivity)) {
      const rawData = LocalStorageUtility.getEntryString(StorageKey.MostRecentActivity);

      if (!rawData) {
        this.storedData = MostRecentActivity.createEmptyData();
      } else {
        try {
          this.storedData = JSON.parse(rawData);
        } catch (e) {
          console.error("Unable to parse stored most recent activity. Use empty data:", rawData);
          this.storedData = MostRecentActivity.createEmptyData();
        }

        // If version doesn't match or schema broke, nuke it!
        if (
          !this.storedData.hasOwnProperty("schemaVersion") ||
          this.storedData["schemaVersion"] !== MostRecentActivity.schemaVersion
        ) {
          LocalStorageUtility.removeEntry(StorageKey.MostRecentActivity);
          this.storedData = MostRecentActivity.createEmptyData();
        }
      }
    } else {
      this.storedData = MostRecentActivity.createEmptyData();
    }

    for (let p in this.storedData.itemsMap) {
      this.cleanupItems(p);
    }
    this.saveToLocalStorage();
  }

  private static createEmptyData(): StoredData {
    return {
      schemaVersion: MostRecentActivity.schemaVersion,
      itemsMap: {},
    };
  }

  private static isEmpty(object: any) {
    return Object.keys(object).length === 0 && object.constructor === Object;
  }

  private saveToLocalStorage() {
    if (MostRecentActivity.isEmpty(this.storedData.itemsMap)) {
      if (LocalStorageUtility.hasItem(StorageKey.MostRecentActivity)) {
        LocalStorageUtility.removeEntry(StorageKey.MostRecentActivity);
      }
      // Don't save if empty
      return;
    }

    LocalStorageUtility.setEntryString(StorageKey.MostRecentActivity, JSON.stringify(this.storedData));
  }

  public addItem(accountId: string, newItem: Item): void {
    // When debugging, accountId is "undefined": most recent activity cannot be saved by account. Uncomment to disable.
    // if (!accountId) {
    //   return;
    // }

    // Remove duplicate
    MostRecentActivity.removeDuplicate(newItem, this.storedData.itemsMap[accountId]);

    this.storedData.itemsMap[accountId] = this.storedData.itemsMap[accountId] || [];
    this.storedData.itemsMap[accountId].unshift(newItem);
    this.cleanupItems(accountId);
    this.saveToLocalStorage();
  }

  public getItems(accountId: string): Item[] {
    return this.storedData.itemsMap[accountId] || [];
  }

  public collectionWasOpened(accountId: string, { id, databaseId }: Pick<CollectionBase, "id" | "databaseId">) {
    const collectionId = id();
    this.addItem(accountId, {
      type: Type.OpenCollection,
      title: collectionId,
      description: "Data",
      data: {
        databaseId,
        collectionId,
      },
    });
  }

  public notebookWasItemOpened(accountId: string, { name, path }: Pick<NotebookContentItem, "name" | "path">) {
    this.addItem(accountId, {
      type: Type.OpenNotebook,
      title: name,
      description: "Notebook",
      data: { name, path },
    });
  }

  public clear(accountId: string): void {
    delete this.storedData.itemsMap[accountId];
    this.saveToLocalStorage();
  }

  /**
   * Find items by doing strict comparison and remove from array if duplicate is found
   * @param item
   */
  private static removeDuplicate(item: Item, itemsArray: Item[]): void {
    if (!itemsArray) {
      return;
    }

    let index = -1;
    for (let i = 0; i < itemsArray.length; i++) {
      const currentItem = itemsArray[i];
      if (
        currentItem.title === item.title &&
        currentItem.description === item.description &&
        JSON.stringify(currentItem.data) === JSON.stringify(item.data)
      ) {
        index = i;
        break;
      }
    }

    if (index !== -1) {
      itemsArray.splice(index, 1);
    }
  }

  /**
   * Remove unknown types
   * Limit items to max number
   */
  private cleanupItems(accountId: string): void {
    if (!this.storedData.itemsMap.hasOwnProperty(accountId)) {
      return;
    }

    const itemsArray = this.storedData.itemsMap[accountId]
      .filter((item) => item.type in Type)
      .slice(0, MostRecentActivity.itemsMaxNumber);
    if (itemsArray.length === 0) {
      delete this.storedData.itemsMap[accountId];
    } else {
      this.storedData.itemsMap[accountId] = itemsArray;
    }
  }
}

export const mostRecentActivity = new MostRecentActivity();
