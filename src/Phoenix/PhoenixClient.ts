import { ConatinerStatusType, HttpHeaders, HttpStatusCodes, Notebook } from "../Common/Constants";
import { getErrorMessage } from "../Common/ErrorHandlingUtils";
import * as Logger from "../Common/Logger";
import { configContext } from "../ConfigContext";
import { ConatinerInfo } from "../Contracts/DataModels";
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
export interface IProvosionData {
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
    provisionData: IProvosionData
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
      .then((ConatinerInfo) => useNotebook.getState().setConatinerStatus(ConatinerInfo))
      .finally(() => {
        if (
          useNotebook.getState().conatinerStatus.status &&
          useNotebook.getState().conatinerStatus.status === ConatinerStatusType.Active
        ) {
          this.scheduleConatinerHeartbeat(Notebook.containerStatusHeartbeatDelayMs, containerData);
        }
      });
  }

  private scheduleConatinerHeartbeat(delayMs: number, containerData: IContainerData): void {
    setTimeout(() => {
      this.getContainerStatus(containerData)
        .then((containerStatus) => useNotebook.getState().setConatinerStatus(containerStatus))
        .finally(() => {
          if (
            useNotebook.getState().conatinerStatus.status &&
            useNotebook.getState().conatinerStatus.status === ConatinerStatusType.Active
          ) {
            this.scheduleConatinerHeartbeat(delayMs, containerData);
          }
        });
    }, delayMs);
  }

  private async getContainerStatus(containerData: IContainerData): Promise<ConatinerInfo> {
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
          status: ConatinerStatusType.Active,
        };
      }
      return {
        durationLeftInMinutes: undefined,
        notebookServerInfo: undefined,
        status: ConatinerStatusType.InActive,
      };
    }
    catch (error) {
      Logger.logError(getErrorMessage(error), "PhoenixClient/getContainerStatus");
      return {
        durationLeftInMinutes: undefined,
        notebookServerInfo: undefined,
        status: ConatinerStatusType.InActive,
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
