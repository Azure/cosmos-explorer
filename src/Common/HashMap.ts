/**
 * Simple hashmap implementation that doesn't rely on ES6 Map nor polyfills
 */
export class HashMap<T> {
  constructor(private container: { [key: string]: T } = {}) {}

  public has(key: string): boolean {
    return this.container.hasOwnProperty(key);
  }

  public set(key: string, value: T): void {
    this.container[key] = value;
  }

  public get(key: string): T {
    return this.container[key];
  }

  public size(): number {
    return Object.keys(this.container).length;
  }

  public delete(key: string): boolean {
    if (this.has(key)) {
      delete this.container[key];
      return true;
    }

    return false;
  }

  public clear(): void {
    this.container = {};
  }

  public keys(): string[] {
    return Object.keys(this.container);
  }

  public forEach(iteratorFct: (key: string, value: T) => void) {
    for (const k in this.container) {
      iteratorFct(k, this.container[k]);
    }
  }
}
