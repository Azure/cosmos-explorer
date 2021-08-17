import { SubscriptionType } from "../../Contracts/SubscriptionType";
import * as AutoscalePricing from "./AutoscalePricing";
import * as OfferPricing from "./OfferPricing";

export const hoursInAMonth = 730;
export { AutoscalePricing, OfferPricing };

export const CollectionCreation = {
  // TODO generate these values based on Product\Services\Documents\ImageStore\GatewayApplication\Settings.xml
  MinRUPerPartitionBelow7Partitions: 400,
  MinRU7PartitionsTo25Partitions: 2500,
  MinRUPerPartitionAbove25Partitions: 100,
  MaxRUPerPartition: 10000,
  MinPartitionedCollectionRUs: 2500,

  NumberOfPartitionsInFixedCollection: 1,
  NumberOfPartitionsInUnlimitedCollection: 10,

  storage10Gb: "10",
  storage100Gb: "100",

  DefaultCollectionRUs1000: 1000,
  DefaultCollectionRUs10K: 10000,
  DefaultCollectionRUs400: 400,
  DefaultCollectionRUs2000: 2000,
  DefaultCollectionRUs2500: 2500,
  DefaultCollectionRUs5000: 5000,
  DefaultCollectionRUs15000: 15000,
  DefaultCollectionRUs20000: 20000,
  DefaultCollectionRUs25000: 25000,
  DefaultCollectionRUs100K: 100000,
  DefaultCollectionRUs1Million: 1000000,

  DefaultAddCollectionDefaultFlight: "0",
  DefaultSubscriptionType: SubscriptionType.Free,

  TablesAPIDefaultDatabase: "TablesDB",
};

export const CollectionCreationDefaults = {
  storage: CollectionCreation.storage100Gb,
  throughput: {
    fixed: CollectionCreation.DefaultCollectionRUs400,
    unlimited: CollectionCreation.DefaultCollectionRUs400,
    unlimitedmax: CollectionCreation.DefaultCollectionRUs1Million,
    unlimitedmin: CollectionCreation.DefaultCollectionRUs400,
    shared: CollectionCreation.DefaultCollectionRUs400,
  },
};

export const SubscriptionUtilMappings = {
  FreeTierSubscriptionIds: [
    "b8f2ff04-0a81-4cf9-95ef-5828d16981d2",
    "39b1fdff-e5b2-4f83-adb4-33cb3aabf5ea",
    "41f6d14d-ece1-46e4-942c-02c00d67f7d6",
    "11dc62e3-77dc-4ef5-a46b-480ec6caa8fe",
    "199d0919-60bd-448e-b64d-8461a0fe9747",
    "a57b6849-d443-44cf-a3b7-7dd07ead9401",
  ],
};

export const AutopilotDocumentation = {
  Url: "https://aka.ms/cosmos-autoscale-info",
};

export const FreeTierLimits = {
  RU: 1000,
  Storage: 25,
};
