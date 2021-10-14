import { ContainerStatusType, HttpHeaders, HttpStatusCodes, Notebook } from "../Common/Constants";
import { getErrorMessage } from "../Common/ErrorHandlingUtils";
import * as Logger from "../Common/Logger";
import { configContext } from "../ConfigContext";
import { ContainerInfo } from "../Contracts/DataModels";
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
  readonly forwardingId?: string;
}
export interface IProvisionData {
  cosmosEndpoint: string;
  dbAccountName: string;
  aadToken: string;
  resourceGroup: string;
  subscriptionId: string;
}

export interface IContainerData {
  dbAccountName: string;
  forwardingId: string;
}

export class PhoenixClient {
  public async containerConnectionInfo(
    provisionData: IProvisionData
  ): Promise<IPhoenixResponse<IPhoenixConnectionInfoResult>> {
    try {
      const response = await window.fetch(`${this.getPhoenixContainerPoolingEndPoint()}/allocate`, {
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
  public async setContainerHeartBeat(containerData: { forwardingId: string; dbAccountName: string }) {
    this.getContainerStatus(containerData)
      .then((ContainerInfo) => useNotebook.getState().setContainerStatus(ContainerInfo))
      .finally(() => {
        if (
          useNotebook.getState().containerStatus.status &&
          useNotebook.getState().containerStatus.status === ContainerStatusType.Active
        ) {
          this.scheduleContainerHeartbeat(Notebook.containerStatusHeartbeatDelayMs, containerData);
        }
      });
  }

  private scheduleContainerHeartbeat(delayMs: number, containerData: IContainerData): void {
    setTimeout(() => {
      this.getContainerStatus(containerData)
        .then((containerStatus) => useNotebook.getState().setContainerStatus(containerStatus))
        .finally(() => {
          if (
            useNotebook.getState().containerStatus.status &&
            useNotebook.getState().containerStatus.status === ContainerStatusType.Active
          ) {
            this.scheduleContainerHeartbeat(delayMs, containerData);
          }
        });
    }, delayMs);
  }

  private async getContainerStatus(containerData: IContainerData): Promise<ContainerInfo> {
    try {
      const response = await window.fetch(
        `${this.getPhoenixContainerPoolingEndPoint()}/${containerData.dbAccountName}/${containerData.forwardingId}`,
        {
          method: "GET",
          headers: PhoenixClient.getHeaders(),
        }
      );
      if (response.status === HttpStatusCodes.OK) {
        const containerStatus = await response.json();
        return {
          durationLeftInMinutes: containerStatus.durationLeftInMinutes,
          notebookServerInfo: containerStatus.notebookServerInfo,
          status: ContainerStatusType.Active,
        };
      }
      return {
        durationLeftInMinutes: undefined,
        notebookServerInfo: undefined,
        status: ContainerStatusType.InActive,
      };
    } catch (error) {
      Logger.logError(getErrorMessage(error), "PhoenixClient/getContainerStatus");
      return {
        durationLeftInMinutes: undefined,
        notebookServerInfo: undefined,
        status: ContainerStatusType.InActive,
      };
    }
  }

  public static getPhoenixEndpoint(): string {
    const phoenixEndpoint =
      userContext.features.phoenixEndpoint ?? userContext.features.junoEndpoint ?? configContext.JUNO_ENDPOINT;
    if (configContext.allowedJunoOrigins.indexOf(new URL(phoenixEndpoint).origin) === -1) {
      const error = `${phoenixEndpoint} not allowed as juno endpoint`;
      console.error(error);
      throw new Error(error);
    }

    return phoenixEndpoint;
  }

  public getPhoenixContainerPoolingEndPoint(): string {
    return `${PhoenixClient.getPhoenixEndpoint()}/api/controlplane/toolscontainer`;
  }
  private static getHeaders(): HeadersInit {
    const authorizationHeader = getAuthorizationHeader();
    return {
      [authorizationHeader.header]: authorizationHeader.token,
      [HttpHeaders.contentType]: "application/json",
    };
  }
}
