export enum Regions {
  NorthCentralUS = "NorthCentralUS",
  WestUS = "WestUS",
  EastUS2 = "EastUS2",
}

export interface AccountProps {
  regions: Regions;
  enableLogging: boolean;
  accountName: string;
  collectionThroughput: number;
  dbThroughput: number;
}

export type GraphAPIComputeServiceResource = {
  id: string;
  name: string;
  type: string;
  properties: GraphAPIComputeServiceProps;
  locations: GraphAPIComputeServiceLocations;
};
export type GraphAPIComputeServiceProps = {
  serviceType: string;
  creationTime: string;
  status: string;
  instanceSize: string;
  instanceCount: number;
  GraphAPIComputeEndPoint: string;
};

export type GraphAPIComputeServiceLocations = {
  location: string;
  status: string;
  GraphAPIComputeEndpoint: string;
};

export type UpdateComputeRequestParameters = {
  properties: UpdateComputeRequestProperties;
};

export type UpdateComputeRequestProperties = {
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
  retailPrice: number;
  skuName: string;
};

export type RegionsResponse = {
  locations: Array<RegionItem>;
  location: string;
};

export type RegionItem = {
  locationName: string;
};
