/**
 * Utility to cache array of objects associated to a key.
 * We use it to cache array of edge/vertex pairs (outE or inE)
 * Cache size is capped to a maximum.
 */
export class ArraysByKeyCache<T> {
  private cache: { [key: string]: T[] };
  private keyQueue: string[]; // Last touched key FIFO to purge cache if too big.
  private totalElements: number;
  private maxNbElements: number;

  public constructor(maxNbElements: number) {
    this.maxNbElements = maxNbElements;
    this.keyQueue = [];
    this.cache = {};
    this.totalElements = 0;
  }

  public clear(): void {
    this.cache = {};
    this.keyQueue = [];
    this.totalElements = 0;
  }

  /**
   * To simplify, the array of cached elements array for a given key is dense (there is no index at which an elemnt is missing).
   * Retrieving a page within the array is guaranteed to return a complete page.
   * @param key
   * @param newElt
   * @param index
   */
  public insert(key: string, index: number, newElt: T): void {
    const elements: T[] = this.cache[key] || [];
    this.cache[key] = elements;

    if (index < 0) {
      return;
    }

    // Check that previous index is populated, if not, ignore
    if (index > elements.length) {
      return;
    }

    // Update last updated
    this.markKeyAsTouched(key);

    if (this.totalElements + 1 > this.maxNbElements && key !== this.keyQueue[0]) {
      this.reduceCacheSize();
    }

    elements[index] = newElt;
    this.totalElements++;
  }

  /**
   * Retrieve a page of elements.
   * Return array of elements or null. null means "complete page not found in cache".
   * @param key
   * @param startIndex
   * @param pageSize
   */
  public retrieve(key: string, startIndex: number, pageSize: number): T[] | null {
    if (!Object.prototype.hasOwnProperty.call(this.cache, key)) {
      return undefined;
    }
    const elements = this.cache[key];
    if (startIndex + pageSize > elements.length) {
      return undefined;
    }

    return elements.slice(startIndex, startIndex + pageSize);
  }

  /**
   * Invalidate elements to keep the total number below the limit
   * TODO: instead of invalidating the entire array, remove only needed number of elements
   */
  private reduceCacheSize(): void {
    // remove an key and its array
    const oldKey = this.keyQueue.shift();
    if (oldKey) {
      this.totalElements -= this.cache[oldKey].length;
      delete this.cache[oldKey];
    }
  }

  /**
   * Bubble up this key as new.
   * @param key
   */
  private markKeyAsTouched(key: string) {
    const n = this.keyQueue.indexOf(key);
    if (n > -1) {
      this.keyQueue.splice(n, 1);
    }
    this.keyQueue.push(key);
  }
}
