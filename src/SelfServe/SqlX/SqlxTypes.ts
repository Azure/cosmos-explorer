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
  dedicatedGatewayType: string;
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
  dedicatedGatewayType: string;
  instanceCount: number;
  serviceType: string;
};

export type FetchPricesResponse = Array<PriceItem>;

export type PriceItem = {
  prices: Array<PriceType>;
  id: string;
  billingCurrency: string;
  error: PriceError;
};

export type PriceType = {
  type: string;
  unitPriceinBillingCurrency: number;
};

export type PriceError = {
  type: string;
  description: string;
};

export type PriceMapAndCurrencyCode = {
  priceMap: Map<string, Map<string, number>>;
  billingCurrency: string;
};

export type GetOfferingIdsResponse = {
  items: Array<OfferingIdItem>;
  nextPageLink: string | undefined;
};

export type OfferingIdItem = {
  skuName: string;
  offeringProperties: Array<OfferingProperties>;
};

export type OfferingProperties = {
  offeringId: string;
};

export type OfferingIdRequest = {
  ids: Array<string>;
  location: string;
};

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
