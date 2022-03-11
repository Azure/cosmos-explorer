import { useDialog } from "Explorer/Controls/Dialog";
import promiseRetry, { AbortError } from "p-retry";
import { Action } from "Shared/Telemetry/TelemetryConstants";
import { allowedJunoOrigins, validateEndpoint } from "Utils/EndpointValidation";
import {
  Areas,
  ConnectionStatusType,
  ContainerStatusType,
  HttpHeaders,
  HttpStatusCodes,
  Notebook,
} from "../Common/Constants";
import { getErrorMessage } from "../Common/ErrorHandlingUtils";
import * as Logger from "../Common/Logger";
import { configContext } from "../ConfigContext";
import {
  ContainerConnectionInfo,
  IContainerData,
  IMaxAllocationTimeExceeded,
  IProvisionData,
  IValidationError,
} from "../Contracts/DataModels";
import { useNotebook } from "../Explorer/Notebook/useNotebook";
import * as TelemetryProcessor from "../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../UserContext";
import { getAuthorizationHeader } from "../Utils/AuthorizationUtils";

export class PhoenixClient {
  private containerHealthHandler: NodeJS.Timeout;
  private retryOptions: promiseRetry.Options = {
    retries: Notebook.retryAttempts,
    maxTimeout: Notebook.retryAttemptDelayMs,
    minTimeout: Notebook.retryAttemptDelayMs,
  };

  public async allocateContainer(provisionData: IProvisionData) {
    return this.executeContainerAssignmentOperation(provisionData, "allocate");
  }

  public async resetContainer(provisionData: IProvisionData) {
    return this.executeContainerAssignmentOperation(provisionData, "reset");
  }

  private async executeContainerAssignmentOperation(provisionData: IProvisionData, operation: string) {
    try {
      const response = await fetch(`${this.getPhoenixControlPlanePathPrefix()}/containerconnections`, {
        method: operation === "allocate" ? "POST" : "PATCH",
        headers: PhoenixClient.getHeaders(),
        body: JSON.stringify(provisionData),
      });
      return {
        status: response.status,
        data: await response?.json(),
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  public async initiateContainerHeartBeat(containerData: IContainerData) {
    if (this.containerHealthHandler) {
      clearTimeout(this.containerHealthHandler);
    }
    await this.getContainerHealth(Notebook.containerStatusHeartbeatDelayMs, containerData);
  }

  private scheduleContainerHeartbeat(delayMs: number, containerData: IContainerData): void {
    this.containerHealthHandler = setTimeout(async () => {
      await this.getContainerHealth(delayMs, containerData);
    }, delayMs);
  }

  private async getContainerStatusAsync(containerData: IContainerData) {
    try {
      const runContainerStatusAsync = async () => {
        const response = await window.fetch(
          `${this.getPhoenixControlPlanePathPrefix()}/${containerData.forwardingId}`,
          {
            method: "GET",
            headers: PhoenixClient.getHeaders(),
          }
        );
        if (response.status === HttpStatusCodes.OK) {
          const containerStatus = await response.json();
          return {
            durationLeftInMinutes: containerStatus?.durationLeftInMinutes,
            notebookServerInfo: containerStatus?.notebookServerInfo,
            status: ContainerStatusType.Active,
          };
        } else if (response.status === HttpStatusCodes.NotFound) {
          const error = "Disconnected from compute workspace";
          Logger.logError(error, "");
          const connectionStatus: ContainerConnectionInfo = {
            status: ConnectionStatusType.Reconnect,
          };
          TelemetryProcessor.traceMark(Action.PhoenixHeartBeat, {
            dataExplorerArea: Areas.Notebook,
            message: getErrorMessage(error),
          });
          useNotebook.getState().resetContainerConnection(connectionStatus);
          useNotebook.getState().setIsRefreshed(!useNotebook.getState().isRefreshed);
          useDialog
            .getState()
            .showOkModalDialog(
              "Disconnected",
              "Disconnected from temporary workspace. Please click on connect button to connect to temporary workspace."
            );
          throw new AbortError(response.statusText);
        } else if (response?.status === HttpStatusCodes.Forbidden) {
          this.showForbiddenFailurePopUp(await response.json());
          throw new AbortError(response.statusText);
        }
        throw new Error(response.statusText);
      };
      return await promiseRetry(runContainerStatusAsync, this.retryOptions);
    } catch (error) {
      TelemetryProcessor.traceFailure(Action.PhoenixHeartBeat, {
        dataExplorerArea: Areas.Notebook,
      });
      Logger.logError(getErrorMessage(error), "");
      const connectionStatus: ContainerConnectionInfo = {
        status: ConnectionStatusType.Failed,
      };
      useNotebook.getState().resetContainerConnection(connectionStatus);
      useNotebook.getState().setIsRefreshed(!useNotebook.getState().isRefreshed);
      return {
        durationLeftInMinutes: undefined,
        notebookServerInfo: undefined,
        status: ContainerStatusType.Disconnected,
      };
    }
  }

  private async getContainerHealth(delayMs: number, containerData: IContainerData) {
    const containerInfo = await this.getContainerStatusAsync(containerData);
    useNotebook.getState().setContainerStatus(containerInfo);
    if (useNotebook.getState().containerStatus?.status === ContainerStatusType.Active) {
      this.scheduleContainerHeartbeat(delayMs, containerData);
    }
  }

  public async isDbAcountWhitelisted(): Promise<boolean> {
    try {
      const response = await window.fetch(`${this.getPhoenixControlPlanePathPrefix()}`, {
        method: "GET",
        headers: PhoenixClient.getHeaders(),
      });
      return response.status === HttpStatusCodes.OK;
    } catch (error) {
      Logger.logError(getErrorMessage(error), "PhoenixClient/IsDbAcountWhitelisted");
      return false;
    }
  }

  public static getPhoenixEndpoint(): string {
    const phoenixEndpoint =
      userContext.features.phoenixEndpoint ?? userContext.features.junoEndpoint ?? configContext.JUNO_ENDPOINT;
    if (!validateEndpoint(phoenixEndpoint, allowedJunoOrigins)) {
      const error = `${phoenixEndpoint} not allowed as juno endpoint`;
      console.error(error);
      throw new Error(error);
    }

    return phoenixEndpoint;
  }

  public getPhoenixControlPlanePathPrefix(): string {
    return `${PhoenixClient.getPhoenixEndpoint()}/api/controlplane/toolscontainer/cosmosaccounts${
      userContext.databaseAccount.id
    }`;
  }

  private static getHeaders(): HeadersInit {
    const authorizationHeader = getAuthorizationHeader();
    return {
      [authorizationHeader.header]: authorizationHeader.token,
      [HttpHeaders.contentType]: "application/json",
    };
  }

  public showForbiddenFailurePopUp(connectionInfoData: IValidationError) {
    const errInfo = connectionInfoData;
    if (errInfo?.type === "MaxAllocationTimeExceeded") {
      const maxAllocationTimeExceeded = errInfo as IMaxAllocationTimeExceeded;
      const allocateAfterTimestamp = new Date(maxAllocationTimeExceeded?.earliestAllocationTimestamp);
      allocateAfterTimestamp.setDate(allocateAfterTimestamp.getDate() + 1);
      useDialog
        .getState()
        .showOkModalDialog(
          "Connection Failed",
          `${errInfo.message}` + " Please try again after " + `${allocateAfterTimestamp.toLocaleString()}`
        );
    } else if (
      errInfo?.type === "MaxDbAccountsPerUserExceeded" ||
      errInfo?.type === "MaxUsersPerDbAccountExceeded" ||
      errInfo?.type === "AllocationValidationResult" ||
      errInfo?.type === "RegionNotServicable" ||
      errInfo?.type === "SubscriptionNotAllowed"
    ) {
      useDialog.getState().showOkModalDialog("Connection Failed", `${errInfo.message}`);
    }
  }
}
