import { ContainerStatusType, HttpHeaders, HttpStatusCodes, Notebook } from "../Common/Constants";
import { getErrorMessage } from "../Common/ErrorHandlingUtils";
import * as Logger from "../Common/Logger";
import { configContext } from "../ConfigContext";
import {
  ContainerInfo,
  IContainerData,
  IPhoenixConnectionInfoResult,
  IProvisionData,
  IResponse
} from "../Contracts/DataModels";
import { useNotebook } from "../Explorer/Notebook/useNotebook";
import { userContext } from "../UserContext";
import { getAuthorizationHeader } from "../Utils/AuthorizationUtils";

export class PhoenixClient {
  public async containerConnectionInfo(
    provisionData: IProvisionData
  ): Promise<IResponse<IPhoenixConnectionInfoResult>> {
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
  public async initiateContainerHeartBeat(containerData: { forwardingId: string; dbAccountName: string }) {
    this.getContainerHealth(Notebook.containerStatusHeartbeatDelayMs, containerData);
  }

  private scheduleContainerHeartbeat(delayMs: number, containerData: IContainerData): void {
    setTimeout(() => {
      this.getContainerHealth(delayMs, containerData);
    }, delayMs);
  }

  private async getContainerStatusAsync(containerData: IContainerData): Promise<ContainerInfo> {
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

  private getContainerHealth(delayMs: number, containerData: { forwardingId: string; dbAccountName: string }) {
    this.getContainerStatusAsync(containerData)
      .then((ContainerInfo) => useNotebook.getState().setContainerStatus(ContainerInfo))
      .finally(() => {
        if (
          useNotebook.getState().containerStatus.status &&
          useNotebook.getState().containerStatus.status === ContainerStatusType.Active
        ) {
          this.scheduleContainerHeartbeat(delayMs, containerData);
        }
      });
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
