export type SqlxServiceResource = {
  id: string;
  name: string;
  type: string;
  properties: SqlxServiceProps;
  locations: SqlxServiceLocations;
};
export type SqlxServiceProps = {
  serviceType: string;
  creationTime: string;
  status: string;
  instanceSize: string;
  instanceCount: number;
  sqlxEndPoint: string;
};

export type SqlxServiceLocations = {
  location: string;
  status: string;
  sqlxEndpoint: string;
};

export type UpdateDedicatedGatewayRequestParameters = {
  properties: UpdateDedicatedGatewayRequestProperties;
};

export type UpdateDedicatedGatewayRequestProperties = {
  instanceSize: string;
  instanceCount: number;
  serviceType: string;
};

export type FetchPricesResponse = {
  Items: Array<PriceItem>;
  NextPageLink: string | undefined;
  Count: number;
};

export type PriceItem = {
  prices: Array<PriceType>;
  id: string;
  pricingCurrency: string;
};

export type PriceType = {
  type: string;
  unitPrice: number;
}

export type PriceMapAndCurrencyCode = {
  priceMap: Map<string, Map<string, number>>;
  pricingCurrency: string;
};

export type GetOfferingIdsResponse = {
  Items: Array<OfferingIdItem>;
  NextPageLink: string | undefined;
  Count: number;
};

export type OfferingIdItem = {
  skuName: string;
  offeringProperties: OfferingProperties;
};

export type OfferingProperties = {
  offeringId: string;
}

export type OfferingIdRequest = {
  ids: Array<string>;
  location: string,
}

export type OfferingIdMap = Map<string, Map<string, string>>;

export type RegionsResponse = {
  properties: RegionsProperties;
};

export type RegionsProperties = {
  locations: Array<RegionItem>;
};

export type RegionItem = {
  locationName: string;
  isZoneRedundant: boolean;
};
