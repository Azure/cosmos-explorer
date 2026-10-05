import pLimit from "p-limit";

export interface OfferLoaderDatabase {
  loadOffer: () => Promise<unknown>;
  loadCollections: () => Promise<unknown>;
  collections: () => { loadOffer: () => Promise<unknown> }[] | undefined;
}

const limitOfferLoading = pLimit(4);

export const loadOffers = async (databases: OfferLoaderDatabase[], includeCollections: boolean): Promise<void> => {
  let failed = false;
  const schedule = (operation: () => Promise<unknown>): Promise<void> =>
    limitOfferLoading(async () => {
      if (failed) {
        return;
      }

      try {
        await operation();
      } catch (error) {
        failed = true;
        throw error;
      }
    });

  await Promise.all(
    databases.map(async (database) => {
      const databaseOperations = [schedule(() => database.loadOffer())];
      if (includeCollections) {
        databaseOperations.push(schedule(() => database.loadCollections()));
      }
      await Promise.all(databaseOperations);

      if (includeCollections && !failed) {
        await Promise.all((database.collections() || []).map((collection) => schedule(() => collection.loadOffer())));
      }
    }),
  );
};
