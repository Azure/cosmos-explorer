import * as ViewModels from "../Contracts/ViewModels";
import { userContext } from "../UserContext";

export class PortalTokenProvider implements ViewModels.TokenProvider {
  constructor() {}

  public async getAuthHeader(): Promise<Headers> {
    const bearerToken = userContext.authorizationToken;
    let fetchHeaders = new Headers();
    fetchHeaders.append("authorization", bearerToken);
    return fetchHeaders;
  }
}
