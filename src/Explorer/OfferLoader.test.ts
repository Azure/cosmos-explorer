import { waitFor } from "@testing-library/react";
import { loadOffers, OfferLoaderDatabase } from "./OfferLoader";

const createPendingOperation = () => {
  let resolve!: () => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

const createDatabase = (overrides: Partial<OfferLoaderDatabase> = {}): OfferLoaderDatabase => ({
  loadOffer: jest.fn().mockResolvedValue(undefined),
  loadCollections: jest.fn().mockResolvedValue(undefined),
  collections: () => [],
  ...overrides,
});

const createOperationTracker = () => {
  const pending = createPendingOperation();
  let active = 0;
  let peakActive = 0;
  const operation = jest.fn(async () => {
    active += 1;
    peakActive = Math.max(peakActive, active);
    try {
      await pending.promise;
    } finally {
      active -= 1;
    }
  });
  return {
    operation,
    release: pending.resolve,
    get active() {
      return active;
    },
    get peakActive() {
      return peakActive;
    },
  };
};

describe("offer loading", () => {
  it("limits database offer reads to four concurrent operations", async () => {
    const tracker = createOperationTracker();
    const databases = Array.from({ length: 12 }, () => createDatabase({ loadOffer: tracker.operation }));
    const loading = loadOffers(databases, false);
    try {
      await waitFor(() => expect(tracker.active).toBeGreaterThan(0));
      expect(tracker.operation).toHaveBeenCalledTimes(4);
      expect(tracker.active).toBe(4);
    } finally {
      tracker.release();
      await loading;
    }

    expect(tracker.operation).toHaveBeenCalledTimes(12);
    expect(tracker.peakActive).toBe(4);
    expect(tracker.active).toBe(0);
    expect(databases[0].loadCollections).not.toHaveBeenCalled();
  });

  it("shares the limit across overlapping database and collection offer loads", async () => {
    const tracker = createOperationTracker();
    const databases = Array.from({ length: 6 }, () =>
      createDatabase({
        loadOffer: tracker.operation,
        loadCollections: tracker.operation,
        collections: () => Array.from({ length: 3 }, () => ({ loadOffer: tracker.operation })),
      }),
    );
    const loading = Promise.all([
      loadOffers(databases, false),
      loadOffers(databases, true),
      loadOffers(databases, true),
    ]);
    try {
      await waitFor(() => expect(tracker.active).toBeGreaterThan(0));
      expect(tracker.operation).toHaveBeenCalledTimes(4);
    } finally {
      tracker.release();
      await loading;
    }

    expect(tracker.operation).toHaveBeenCalledTimes(66);
    expect(tracker.peakActive).toBe(4);
    expect(tracker.active).toBe(0);
  });

  it("waits for discovery and the database offer before scheduling bounded collection reads", async () => {
    const discovery = createPendingOperation();
    const databaseOffer = createPendingOperation();
    const tracker = createOperationTracker();
    const collections = jest.fn(() => Array.from({ length: 12 }, () => ({ loadOffer: tracker.operation })));
    const loadOffer = jest.fn(() => databaseOffer.promise);
    const loadCollections = jest.fn(() => discovery.promise);
    const loading = loadOffers([createDatabase({ loadOffer, loadCollections, collections })], true);
    try {
      await waitFor(() => expect(loadCollections).toHaveBeenCalledTimes(1));
      expect(loadOffer).toHaveBeenCalledTimes(1);
      expect(collections).not.toHaveBeenCalled();
      expect(tracker.operation).not.toHaveBeenCalled();

      discovery.resolve();
      await discovery.promise;
      expect(collections).not.toHaveBeenCalled();
      databaseOffer.resolve();
      await waitFor(() => expect(tracker.active).toBeGreaterThan(0));
      expect(tracker.operation).toHaveBeenCalledTimes(4);
    } finally {
      discovery.resolve();
      databaseOffer.resolve();
      tracker.release();
      await loading;
    }

    expect(tracker.operation).toHaveBeenCalledTimes(12);
    expect(tracker.peakActive).toBe(4);
  });

  it.each([
    { includeCollections: false, failedOperation: 1 },
    { includeCollections: true, failedOperation: 1 },
    { includeCollections: true, failedOperation: 2 },
  ])(
    "isolates failure of operation $failedOperation when includeCollections=$includeCollections",
    async ({ includeCollections, failedOperation }) => {
      const failure = new Error("Metadata read failed");
      const failedRead = createPendingOperation();
      const pending = createPendingOperation();
      let started = 0;
      const operation = jest.fn(() => {
        started += 1;
        return started === failedOperation ? failedRead.promise : pending.promise;
      });
      const collectionOffer = jest.fn().mockResolvedValue(undefined);
      const databases = Array.from({ length: 8 }, () =>
        createDatabase({
          loadOffer: operation,
          loadCollections: operation,
          collections: () => [{ loadOffer: collectionOffer }],
        }),
      );
      const loading = loadOffers(databases, includeCollections);
      const outcome = loading.catch((error: unknown) => error);
      const otherOffer = jest.fn().mockResolvedValue(undefined);
      const otherLoading = loadOffers(
        Array.from({ length: 8 }, () => createDatabase({ loadOffer: otherOffer })),
        false,
      );

      try {
        await waitFor(() => expect(operation).toHaveBeenCalledTimes(4));
        expect(otherOffer).not.toHaveBeenCalled();
        failedRead.reject(failure);
        await expect(outcome).resolves.toBe(failure);
        await otherLoading;
        expect(operation).toHaveBeenCalledTimes(4);
        expect(otherOffer).toHaveBeenCalledTimes(8);
      } finally {
        failedRead.reject(failure);
        pending.resolve();
        await Promise.allSettled([loading, otherLoading]);
      }

      expect(operation).toHaveBeenCalledTimes(4);
      expect(collectionOffer).not.toHaveBeenCalled();
    },
  );

  it("stops queued collection reads after a collection offer fails", async () => {
    const failure = new Error("Collection offer read failed");
    const failedOffer = createPendingOperation();
    const pending = createPendingOperation();
    const collectionOffer = jest
      .fn()
      .mockImplementationOnce(() => failedOffer.promise)
      .mockImplementation(() => pending.promise);
    const loading = loadOffers(
      [createDatabase({ collections: () => Array.from({ length: 12 }, () => ({ loadOffer: collectionOffer })) })],
      true,
    );
    const outcome = loading.catch((error: unknown) => error);
    try {
      await waitFor(() => expect(collectionOffer).toHaveBeenCalledTimes(4));
      failedOffer.reject(failure);
      await expect(outcome).resolves.toBe(failure);
    } finally {
      failedOffer.reject(failure);
      pending.resolve();
      await Promise.allSettled([loading]);
    }

    const recoveryOffer = jest.fn().mockResolvedValue(undefined);
    await loadOffers([createDatabase({ loadOffer: recoveryOffer })], false);
    expect(collectionOffer).toHaveBeenCalledTimes(4);
    expect(recoveryOffer).toHaveBeenCalledTimes(1);
  });

  it.each([false, true])("handles an empty account when includeCollections=%s", async (includeCollections) => {
    await expect(loadOffers([], includeCollections)).resolves.toBeUndefined();
  });
});
