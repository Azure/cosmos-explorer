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

export type PriceMapAndCurrencyCode = {
  priceMap: Map<string, Map<string, number>>;
  currencyCode: string;
};

export type PriceItem = {
  retailPrice: number;
  skuName: string;
  currencyCode: string;
};

export type RegionsResponse = {
  locations: Array<RegionItem>;
};

export type RegionItem = {
  locationName: string;
  isZoneRedundant: boolean;
};
