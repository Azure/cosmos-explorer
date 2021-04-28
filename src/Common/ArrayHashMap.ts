/**
 * Hash map of arrays which allows to:
 * - push an item by key: add to array and create array if needed
 * - remove item by key: remove from array and delete array if needed
 */
export class ArrayHashMap<T> extends Map<string, T[]> {
  /**
   * Insert item into array.
   * If no array, create one.
   * If item already in array, return.
   * @param key
   * @param item
   */
  public push(key: string, item: T): void {
    const array = this.get(key);
    array ? array.includes(item) || array.push(item) : this.set(key, [item]);
  }

  /**
   * Remove item from array.
   * If array is empty, remove array.
   * @param key
   * @param itemToRemove
   */
  public remove(key: string, itemToRemove: T): void {
    const array = this.get(key);
    if (array) {
      const remaining = array.filter((item) => item !== itemToRemove);
      remaining.length ? this.set(key, remaining) : this.delete(key);
    }
  }
}
