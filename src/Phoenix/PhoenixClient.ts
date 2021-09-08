import { ConnectionStatusType, HttpHeaders, HttpStatusCodes } from "../Common/Constants";
import { configContext } from "../ConfigContext";
import * as DataModels from "../Contracts/DataModels";
import { useNotebook } from "../Explorer/Notebook/useNotebook";
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
  resourceId: string;
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
      const connectionStatus: DataModels.ContainerConnectionInfo = {
        status: ConnectionStatusType.Allocating,
      };
      useNotebook.getState().setConnectionInfo(connectionStatus);
      const response = await window.fetch(`${this.getPhoenixContainerPoolingEndPoint()}/provision`, {
        method: "POST",
        headers: PhoenixClient.getHeaders(),
        body: JSON.stringify(provisionData),
      });
      let data: IPhoenixConnectionInfoResult;
      if (response.status === HttpStatusCodes.OK) {
        data = await response.json();
      } else {
        connectionStatus.status = ConnectionStatusType.Failed;
        useNotebook.getState().setConnectionInfo(connectionStatus);
      }

      return {
        status: response.status,
        data,
      };
    } catch {
      const connectionStatus: DataModels.ContainerConnectionInfo = {
        status: ConnectionStatusType.Failed,
      };
      useNotebook.getState().setConnectionInfo(connectionStatus);
      return {} as IPhoenixResponse<IPhoenixConnectionInfoResult>;
    }
  }

  public static getPhoenixEndpoint(): string {
    const phoenixEndpoint = userContext.features.junoEndpoint ?? configContext.JUNO_ENDPOINT;
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
