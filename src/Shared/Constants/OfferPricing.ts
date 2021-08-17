import { hoursInAMonth } from "./";
export const MonthlyPricing = {
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
export const HourlyPricing = {
  default: {
    Currency: "USD",
    CurrencySign: "$",
    S1Price: 0.0336,
    S2Price: 0.0672,
    S3Price: 0.1344,
    Standard: {
      StartingPrice: 24 / hoursInAMonth, // per hour
      PricePerRU: 0.00008,
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
      StartingPrice: MonthlyPricing.mooncake.Standard.StartingPrice / hoursInAMonth, // per hour
      PricePerRU: 0.00051,
      PricePerGB: MonthlyPricing.mooncake.Standard.PricePerGB / hoursInAMonth,
    },
  },
};
