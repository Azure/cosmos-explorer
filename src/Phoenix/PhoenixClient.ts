import { HttpHeaders, HttpStatusCodes } from "../Common/Constants";
import { configContext } from "../ConfigContext";
import { userContext } from "../UserContext";
import { getAuthorizationHeader } from "../Utils/AuthorizationUtils";

export interface IPhoenixResponse<T> {
  status: number;
  data: T;
}
export interface IPhoenixConnectionInfoResult {
  readonly notebookAuthToken?: string;
  readonly notebookServerUrl?: string;
}
export interface IProvosionData {
  cosmosEndpoint: string;
  dbAccountName: string;
  aadToken: string;
  resourceGroup: string;
  subscriptionId: string;
}
export class PhoenixClient {
  public async containerConnectionInfo(
    provisionData: IProvosionData
  ): Promise<IPhoenixResponse<IPhoenixConnectionInfoResult>> {
    try {
      const response = await window.fetch(`${this.getPhoenixContainerPoolingEndPoint()}/provision`, {
        method: "POST",
        headers: PhoenixClient.getHeaders(),
        body: JSON.stringify(provisionData),
      });
      let data: IPhoenixConnectionInfoResult;
      if (response.status === HttpStatusCodes.OK) {
        data = await response.json();
      }
      return {
        status: response.status,
        data,
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  public static getPhoenixEndpoint(): string {
    const phoenixEndpoint = userContext.features.phoenixEndpoint ?? configContext.JUNO_ENDPOINT;
    if (configContext.allowedJunoOrigins.indexOf(new URL(phoenixEndpoint).origin) === -1) {
      const error = `${phoenixEndpoint} not allowed as juno endpoint`;
      console.error(error);
      throw new Error(error);
    }

    return phoenixEndpoint;
  }

  public getPhoenixContainerPoolingEndPoint(): string {
    return `${PhoenixClient.getPhoenixEndpoint()}/api/containerpooling`;
  }
  private static getHeaders(): HeadersInit {
    const authorizationHeader = getAuthorizationHeader();
    return {
      [authorizationHeader.header]: authorizationHeader.token,
      [HttpHeaders.contentType]: "application/json",
    };
  }
}
