import { HashMap } from "./HashMap";

export class ObjectCache<T> extends HashMap<T> {
  private keyQueue: string[]; // Last touched key FIFO to purge cache if too big.
  private maxNbElements: number;

  public constructor(maxNbElements: number) {
    super();
    this.keyQueue = [];
    this.maxNbElements = maxNbElements;
    this.clear();
  }

  public clear(): void {
    super.clear();
    this.keyQueue = [];
  }

  public get(key: string): T {
    this.markKeyAsTouched(key);
    return super.get(key);
  }

  public set(key: string, value: T): void {
    super.set(key, value);

    this.markKeyAsTouched(key);

    if (super.size() > this.maxNbElements && key !== this.keyQueue[0]) {
      this.reduceCacheSize();
    }
  }

  /**
   * Invalidate elements to keep the total number below the limit
   */
  private reduceCacheSize(): void {
    // remove a key
    const oldKey = this.keyQueue.shift();
    if (oldKey) {
      super.delete(oldKey);
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
