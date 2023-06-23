import * as Cosmos from "@azure/cosmos";
import { userContext } from "UserContext";

let _sampleDataclient: Cosmos.CosmosClient;

export function sampleDataClient(): Cosmos.CosmosClient {
  if (_sampleDataclient) {
    return _sampleDataclient;
  }

  const sampleDataConnectionInfo = userContext.sampleDataConnectionInfo;
  const options: Cosmos.CosmosClientOptions = {
    endpoint: sampleDataConnectionInfo.accountEndpoint,
    tokenProvider: async () => {
      const sampleDataConnectionInfo = userContext.sampleDataConnectionInfo;
      return Promise.resolve(sampleDataConnectionInfo.resourceToken);
    },
    connectionPolicy: {
      enableEndpointDiscovery: false,
    },
    userAgentSuffix: "Azure Portal"
  };

  _sampleDataclient = new Cosmos.CosmosClient(options);
  return _sampleDataclient;
}
