import * as ViewModels from "../Contracts/ViewModels";
import { CosmosClient } from "../Common/CosmosClient";

export class PortalTokenProvider implements ViewModels.TokenProvider {
  constructor() {}

  public async getAuthHeader(): Promise<Headers> {
    const bearerToken = CosmosClient.authorizationToken();
    let fetchHeaders = new Headers();
    fetchHeaders.append("authorization", bearerToken);
    return fetchHeaders;
  }
}
