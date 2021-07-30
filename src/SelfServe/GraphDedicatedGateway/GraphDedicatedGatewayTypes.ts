export type GraphDedicatedGatewayServiceResource = {
  id: string;
  name: string;
  type: string;
  properties: GraphDedicatedGatewayServiceProps;
  locations: GraphDedicatedGatewayServiceLocations;
};
export type GraphDedicatedGatewayServiceProps = {
  serviceType: string;
  creationTime: string;
  status: string;
  instanceSize: string;
  instanceCount: number;
  GraphDedicatedGatewayEndPoint: string;
};

export type GraphDedicatedGatewayServiceLocations = {
  location: string;
  status: string;
  GraphDedicatedGatewayEndpoint: string;
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
