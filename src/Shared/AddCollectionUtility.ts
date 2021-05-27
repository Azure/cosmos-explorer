import { any } from "underscore";
import Explorer from "../Explorer/Explorer";
import { CollectionCreationDefaults } from "../UserContext";

export const getMaxThroughput = (defaults: CollectionCreationDefaults, container: Explorer): number => {
  const throughput = defaults.throughput.unlimited;
  if (typeof throughput === "number") {
    return throughput;
  } else {
    return _exceedsThreshold(throughput.collectionThreshold, container)
      ? throughput.greatThanThreshold
      : throughput.lessThanOrEqualToThreshold;
  }
};

const _exceedsThreshold = (unlimitedThreshold: number, container: Explorer): boolean => {
  const databases = (container && container.databases && container.databases()) || [];
  return any(
    databases,
    (database) =>
      database && database.collections && database.collections() && database.collections().length > unlimitedThreshold
  );
};
