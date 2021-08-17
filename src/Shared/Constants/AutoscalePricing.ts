import { hoursInAMonth } from "./";

export const MonthlyPricing = {
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

export const HourlyPricing = {
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
        StartingPrice: MonthlyPricing.mooncake.singleMaster.Standard.StartingPrice / hoursInAMonth, // per hour
        PricePerRU: 0.000765,
        PricePerGB: MonthlyPricing.mooncake.singleMaster.Standard.PricePerGB / hoursInAMonth,
      },
    },
    multiMaster: {
      Currency: "RMB",
      CurrencySign: "¥",
      Standard: {
        StartingPrice: MonthlyPricing.mooncake.multiMaster.Standard.StartingPrice / hoursInAMonth, // per hour
        PricePerRU: 0.00102,
        PricePerGB: MonthlyPricing.mooncake.multiMaster.Standard.PricePerGB / hoursInAMonth,
      },
    },
  },
};
