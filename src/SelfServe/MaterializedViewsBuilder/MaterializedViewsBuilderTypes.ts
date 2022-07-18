export type MaterializedViewsBuilderServiceResource = {
  id: string;
  name: string;
  type: string;
  properties: MaterializedViewsBuilderServiceProps;
  locations: MaterializedViewsBuilderServiceLocations;
};
export type MaterializedViewsBuilderServiceProps = {
  serviceType: string;
  creationTime: string;
  status: string;
  instanceSize: string;
  instanceCount: number;
  MaterializedViewsBuilderEndPoint: string;
};

export type MaterializedViewsBuilderServiceLocations = {
  location: string;
  status: string;
  MaterializedViewsBuilderEndpoint: string;
};

export type UpdateMaterializedViewsBuilderRequestParameters = {
  properties: UpdateMaterializedViewsBuilderRequestProperties;
};

export type UpdateMaterializedViewsBuilderRequestProperties = {
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
  location: string;
};

export type RegionItem = {
  locationName: string;
};
