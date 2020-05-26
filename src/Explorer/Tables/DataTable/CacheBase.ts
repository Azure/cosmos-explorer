abstract class CacheBase<T> {
  public data: T[];
  public sortOrder: any;
  public serverCallInProgress: boolean;

  constructor() {
    this.data = null;
    this.sortOrder = null;
    this.serverCallInProgress = false;
  }

  public get length(): number {
    return this.data ? this.data.length : 0;
  }

  public clear() {
    this.preClear();
    this.data = null;
    this.sortOrder = null;
    this.serverCallInProgress = false;
  }

  protected abstract preClear(): void;
}

export default CacheBase;
