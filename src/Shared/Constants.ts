import { SubscriptionType } from "../Contracts/SubscriptionType";

export const hoursInAMonth = 730;
export class AutoscalePricing {
  public static MonthlyPricing = {
    default: {
      singleMaster: {
        Currency: "USD",
        CurrencySign: "$",
        Standard: {
          StartingPrice: 24,
          PricePerRU: 0.09,
          PricePerGB: 0.25,
        },
      },
      multiMaster: {
        Currency: "USD",
        CurrencySign: "$",
        Standard: {
          StartingPrice: 24,
          PricePerRU: 0.12,
          PricePerGB: 0.25,
        },
      },
    },
    mooncake: {
      singleMaster: {
        Currency: "RMB",
        CurrencySign: "¥",
        Standard: {
          StartingPrice: 152,
          PricePerRU: 0.57,
          PricePerGB: 2.576,
        },
      },
      multiMaster: {
        Currency: "RMB",
        CurrencySign: "¥",
        Standard: {
          StartingPrice: 152,
          PricePerRU: 0.76,
          PricePerGB: 2.576,
        },
      },
    },
  };

  public static HourlyPricing = {
    default: {
      singleMaster: {
        Currency: "USD",
        CurrencySign: "$",
        Standard: {
          StartingPrice: 24 / hoursInAMonth,
          PricePerRU: 0.00012,
          PricePerGB: 0.25 / hoursInAMonth,
        },
      },
      multiMaster: {
        Currency: "USD",
        CurrencySign: "$",
        Standard: {
          StartingPrice: 24 / hoursInAMonth,
          PricePerRU: 0.00016,
          PricePerGB: 0.25 / hoursInAMonth,
        },
      },
    },
    mooncake: {
      singleMaster: {
        Currency: "RMB",
        CurrencySign: "¥",
        Standard: {
          StartingPrice: AutoscalePricing.MonthlyPricing.mooncake.singleMaster.Standard.StartingPrice / hoursInAMonth, // per hour
          PricePerRU: 0.000765,
          PricePerGB: AutoscalePricing.MonthlyPricing.mooncake.singleMaster.Standard.PricePerGB / hoursInAMonth,
        },
      },
      multiMaster: {
        Currency: "RMB",
        CurrencySign: "¥",
        Standard: {
          StartingPrice: AutoscalePricing.MonthlyPricing.mooncake.multiMaster.Standard.StartingPrice / hoursInAMonth, // per hour
          PricePerRU: 0.00102,
          PricePerGB: AutoscalePricing.MonthlyPricing.mooncake.multiMaster.Standard.PricePerGB / hoursInAMonth,
        },
      },
    },
  };
}

export class OfferPricing {
  public static MonthlyPricing = {
    default: {
      Currency: "USD",
      CurrencySign: "$",
      S1Price: 25,
      S2Price: 50,
      S3Price: 100,
      Standard: {
        StartingPrice: 24,
        PricePerRU: 0.06,
        PricePerGB: 0.25,
      },
    },
    mooncake: {
      Currency: "RMB",
      CurrencySign: "¥",
      S1Price: 110.3,
      S2Price: 220.6,
      S3Price: 441.2,
      Standard: {
        StartingPrice: 152,
        PricePerRU: 0.3794,
        PricePerGB: 2.576,
      },
    },
  };
  public static HourlyPricing = {
    default: {
      Currency: "USD",
      CurrencySign: "$",
      S1Price: 0.0336,
      S2Price: 0.0672,
      S3Price: 0.1344,
      Standard: {
        StartingPrice: 24 / hoursInAMonth, // per hour
        SingleMasterPricePerRU: 0.00008,
        MultiMasterPricePerRU: 0.00016,
        PricePerGB: 0.25 / hoursInAMonth,
      },
    },
    mooncake: {
      Currency: "RMB",
      CurrencySign: "¥",
      S1Price: 0.15,
      S2Price: 0.3,
      S3Price: 0.6,
      Standard: {
        StartingPrice: OfferPricing.MonthlyPricing.mooncake.Standard.StartingPrice / hoursInAMonth, // per hour
        SingleMasterPricePerRU: 0.00051,
        MultiMasterPricePerRU: 0.00102,
        PricePerGB: OfferPricing.MonthlyPricing.mooncake.Standard.PricePerGB / hoursInAMonth,
      },
    },
  };
}

export class CollectionCreation {
  // TODO generate these values based on Product\Services\Documents\ImageStore\GatewayApplication\Settings.xml
  public static readonly MinRUPerPartitionBelow7Partitions: number = 400;
  public static readonly MinRU7PartitionsTo25Partitions: number = 2500;
  public static readonly MinRUPerPartitionAbove25Partitions: number = 100;
  public static readonly MaxRUPerPartition: number = 10000;
  public static readonly MinPartitionedCollectionRUs: number = 2500;

  public static readonly NumberOfPartitionsInFixedCollection: number = 1;
  public static readonly NumberOfPartitionsInUnlimitedCollection: number = 10;

  public static storage10Gb: string = "10";
  public static storage100Gb: string = "100";

  public static readonly DefaultCollectionRUs1000: number = 1000;
  public static readonly DefaultCollectionRUs10K: number = 10000;
  public static readonly DefaultCollectionRUs400: number = 400;
  public static readonly DefaultCollectionRUs2000: number = 2000;
  public static readonly DefaultCollectionRUs2500: number = 2500;
  public static readonly DefaultCollectionRUs5000: number = 5000;
  public static readonly DefaultCollectionRUs15000: number = 15000;
  public static readonly DefaultCollectionRUs20000: number = 20000;
  public static readonly DefaultCollectionRUs25000: number = 25000;
  public static readonly DefaultCollectionRUs100K: number = 100000;
  public static readonly DefaultCollectionRUs1Million: number = 1000000;

  public static readonly DefaultAddCollectionDefaultFlight: string = "0";
  public static readonly DefaultSubscriptionType: SubscriptionType = SubscriptionType.Free;

  public static readonly TablesAPIDefaultDatabase: string = "TablesDB";
}

export const CollectionCreationDefaults = {
  storage: CollectionCreation.storage100Gb,
  throughput: {
    fixed: CollectionCreation.DefaultCollectionRUs400,
    unlimited: CollectionCreation.DefaultCollectionRUs400,
    unlimitedmax: CollectionCreation.DefaultCollectionRUs1Million,
    unlimitedmin: CollectionCreation.DefaultCollectionRUs400,
    shared: CollectionCreation.DefaultCollectionRUs400,
  },
} as const;

export class SubscriptionUtilMappings {
  public static FreeTierSubscriptionIds: string[] = [
    "b8f2ff04-0a81-4cf9-95ef-5828d16981d2",
    "39b1fdff-e5b2-4f83-adb4-33cb3aabf5ea",
    "41f6d14d-ece1-46e4-942c-02c00d67f7d6",
    "11dc62e3-77dc-4ef5-a46b-480ec6caa8fe",
    "199d0919-60bd-448e-b64d-8461a0fe9747",
    "a57b6849-d443-44cf-a3b7-7dd07ead9401",
  ];
}

export class AutopilotDocumentation {
  public static Url: string = "https://aka.ms/cosmos-autoscale-info";
}

export class FreeTierLimits {
  public static RU: number = 1000;
  public static Storage: number = 25;
}

export class QueryConstants {
  public static readonly CancelQueryTitle: string = "Cancel query";
  public static readonly CancelQuerySubText: string = "Do you want to cancel this query?";
}
