import { HashMap } from "./HashMap";

/**
 * Hash map of arrays which allows to:
 * - push an item by key: add to array and create array if needed
 * - remove item by key: remove from array and delete array if needed
 */

export class ArrayHashMap<T> {
  private store: HashMap<T[]>;

  constructor() {
    this.store = new HashMap();
  }

  public has(key: string): boolean {
    return this.store.has(key);
  }

  public get(key: string): T[] {
    return this.store.get(key);
  }

  public size(): number {
    return this.store.size();
  }

  public clear(): void {
    this.store.clear();
  }

  public keys(): string[] {
    return this.store.keys();
  }

  public delete(key: string): boolean {
    return this.store.delete(key);
  }

  public forEach(key: string, iteratorFct: (value: T) => void) {
    const values = this.store.get(key);
    if (values) {
      values.forEach((value) => iteratorFct(value));
    }
  }

  /**
   * Insert item into array.
   * If no array, create one.
   * If item already in array, return.
   * @param key
   * @param item
   */
  public push(key: string, item: T): void {
    let itemsArray: T[] = this.store.get(key);
    if (!itemsArray) {
      itemsArray = [item];
      this.store.set(key, itemsArray);
      return;
    }

    if (itemsArray.indexOf(item) === -1) {
      itemsArray.push(item);
    }
  }

  /**
   * Remove item from array.
   * If array is empty, remove array.
   * @param key
   * @param itemToRemove
   */
  public remove(key: string, itemToRemove: T) {
    if (!this.store.has(key)) {
      return;
    }

    const itemsArray = this.store.get(key);
    const index = itemsArray.indexOf(itemToRemove);
    if (index >= 0) {
      itemsArray.splice(index, 1);
      if (itemsArray.length === 0) {
        this.store.delete(key);
      }
    }
  }
}
