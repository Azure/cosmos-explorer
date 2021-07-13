import * as ViewModels from "../Contracts/ViewModels";
import { userContext } from "../UserContext";

export class PortalTokenProvider implements ViewModels.TokenProvider {
  public async getAuthHeader(): Promise<Headers> {
    const bearerToken = userContext.authorizationToken;
    const fetchHeaders = new Headers();
    fetchHeaders.append("authorization", bearerToken);
    return fetchHeaders;
  }
}
