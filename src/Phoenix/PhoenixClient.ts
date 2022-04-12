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
import { getErrorMessage, getErrorStack } from "../Common/ErrorHandlingUtils";
import * as Logger from "../Common/Logger";
import { configContext } from "../ConfigContext";
import {
  ContainerConnectionInfo,
  ContainerInfo,
  IContainerData,
  IMaxAllocationTimeExceeded,
  IMaxDbAccountsPerUserExceeded,
  IMaxUsersPerDbAccountExceeded,
  IPhoenixConnectionInfoResult,
  IProvisionData,
  IResponse,
  IValidationError,
  PhoenixErrorType,
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

  public async allocateContainer(provisionData: IProvisionData): Promise<IResponse<IPhoenixConnectionInfoResult>> {
    return this.executeContainerAssignmentOperation(provisionData, "allocate");
  }

  public async resetContainer(provisionData: IProvisionData): Promise<IResponse<IPhoenixConnectionInfoResult>> {
    return this.executeContainerAssignmentOperation(provisionData, "reset");
  }

  private async executeContainerAssignmentOperation(
    provisionData: IProvisionData,
    operation: string
  ): Promise<IResponse<IPhoenixConnectionInfoResult>> {
    let response;
    try {
      response = await fetch(`${this.getPhoenixControlPlanePathPrefix()}/containerconnections`, {
        method: operation === "allocate" ? "POST" : "PATCH",
        headers: PhoenixClient.getHeaders(),
        body: JSON.stringify(provisionData),
      });
      const responseJson = await response?.json();
      if (response.status === HttpStatusCodes.Forbidden) {
        throw new Error(this.ConvertToForbiddenErrorString(responseJson));
      }
      return {
        status: response.status,
        data: responseJson,
      };
    } catch (error) {
      if (response.status === HttpStatusCodes.Forbidden) {
        error.status = HttpStatusCodes.Forbidden;
      }
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

  private async getContainerStatusAsync(containerData: IContainerData): Promise<ContainerInfo> {
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
          const validationMessage = this.ConvertToForbiddenErrorString(await response.json());
          if (validationMessage) {
            useDialog.getState().showOkModalDialog("Connection Failed", `${validationMessage}`);
          }
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
    const startKey = TelemetryProcessor.traceStart(Action.PhoenixDBAccountAllowed, {
      dataExplorerArea: Areas.Notebook,
    });
    try {
      const response = await window.fetch(`${this.getPhoenixControlPlanePathPrefix()}`, {
        method: "GET",
        headers: PhoenixClient.getHeaders(),
      });
      if (response.status !== HttpStatusCodes.OK) {
        throw new Error(`Received status code: ${response?.status}`);
      }
      TelemetryProcessor.traceSuccess(
        Action.PhoenixDBAccountAllowed,
        {
          dataExplorerArea: Areas.Notebook,
        },
        startKey
      );
      return response.status === HttpStatusCodes.OK;
    } catch (error) {
      TelemetryProcessor.traceFailure(
        Action.PhoenixDBAccountAllowed,
        {
          dataExplorerArea: Areas.Notebook,
          error: getErrorMessage(error),
          errorStack: getErrorStack(error),
        },
        startKey
      );
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

  public ConvertToForbiddenErrorString(jsonData: IValidationError): string {
    const errInfo = jsonData;
    switch (errInfo?.type) {
      case PhoenixErrorType.MaxAllocationTimeExceeded: {
        const maxAllocationTimeExceeded = errInfo as IMaxAllocationTimeExceeded;
        const allocateAfterTimestamp = new Date(maxAllocationTimeExceeded?.earliestAllocationTimestamp);
        allocateAfterTimestamp.setDate(allocateAfterTimestamp.getDate() + 1);
        return (
          `${errInfo.message}` +
          " Max allocation time for a day to a user is " +
          `${maxAllocationTimeExceeded.maxAllocationTimePerDayPerUserInMinutes}` +
          ". Please try again after " +
          `${allocateAfterTimestamp.toLocaleString()}`
        );
      }
      case PhoenixErrorType.MaxDbAccountsPerUserExceeded: {
        const maxDbAccountsPerUserExceeded = errInfo as IMaxDbAccountsPerUserExceeded;
        return (
          `${errInfo.message}` +
          " Max simultaneous connections allowed per user is " +
          `${maxDbAccountsPerUserExceeded.maxSimultaneousConnectionsPerUser}` +
          "."
        );
      }
      case PhoenixErrorType.MaxUsersPerDbAccountExceeded: {
        const maxUsersPerDbAccountExceeded = errInfo as IMaxUsersPerDbAccountExceeded;
        return (
          `${errInfo.message}` +
          " Max simultaneous users allowed per DbAccount is " +
          `${maxUsersPerDbAccountExceeded.maxSimultaneousUsersPerDbAccount}` +
          "."
        );
      }
      case PhoenixErrorType.AllocationValidationResult:
      case PhoenixErrorType.RegionNotServicable:
      case PhoenixErrorType.SubscriptionNotAllowed: {
        return `${errInfo.message}`;
      }
      default: {
        return undefined;
      }
    }
  }
}
