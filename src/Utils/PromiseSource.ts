export default class PromiseSource<T = void> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  /** Resolves the promise, then gets off the thread and waits until the currently-registered 'then' callback run. */
  async resolveAndWait(value: T): Promise<T> {
    this.resolve(value);
    return await this.promise;
  }
}
