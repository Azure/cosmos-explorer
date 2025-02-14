import { configContext } from "ConfigContext";
import { useDialog } from "Explorer/Controls/Dialog";
import { Action } from "Shared/Telemetry/TelemetryConstants";
import { userContext } from "UserContext";
import { allowedJunoOrigins, validateEndpoint } from "Utils/EndpointUtils";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import promiseRetry, { AbortError, Options } from "p-retry";
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
import {
  ContainerConnectionInfo,
  ContainerInfo,
  IContainerData,
  IDbAccountAllow,
  IMaxAllocationTimeExceeded,
  IPhoenixConnectionInfoResult,
  IPhoenixError,
  IPhoenixServiceInfo,
  IProvisionData,
  IResponse,
  PhoenixErrorType,
} from "../Contracts/DataModels";
import { useNotebook } from "../Explorer/Notebook/useNotebook";
import * as TelemetryProcessor from "../Shared/Telemetry/TelemetryProcessor";
import { getAuthorizationHeader } from "../Utils/AuthorizationUtils";

export class PhoenixClient {
  private armResourceId: string;
  private containerHealthHandler: NodeJS.Timeout;
  private retryOptions: Options = {
    retries: Notebook.retryAttempts,
    maxTimeout: Notebook.retryAttemptDelayMs,
    minTimeout: Notebook.retryAttemptDelayMs,
  };
  private abortController: AbortController;
  private abortSignal: AbortSignal;

  constructor(armResourceId: string) {
    this.armResourceId = armResourceId;
  }

  public async allocateContainer(provisionData: IProvisionData): Promise<IResponse<IPhoenixServiceInfo>> {
    this.initializeCancelEventListener();

    return promiseRetry(() => this.executeContainerAssignmentOperation(provisionData, "allocate"), {
      retries: 4,
      maxTimeout: 20000,
      minTimeout: 20000,
      signal: this.abortSignal,
    });
  }

  public async resetContainer(provisionData: IProvisionData): Promise<IResponse<IPhoenixServiceInfo>> {
    return this.executeContainerAssignmentOperation(provisionData, "reset");
  }

  private async executeContainerAssignmentOperation(
    provisionData: IProvisionData,
    operation: string,
  ): Promise<IResponse<IPhoenixServiceInfo>> {
    let response;
    try {
      response = await fetch(`${this.getPhoenixControlPlanePathPrefix()}/containerconnections/multicontainer`, {
        method: operation === "allocate" ? "POST" : "PATCH",
        headers: PhoenixClient.getHeaders(),
        body: JSON.stringify(provisionData),
      });
      const responseJson = await response?.json();
      if (response.ok) {
        const phoenixConnectionInfoResult = responseJson as IPhoenixConnectionInfoResult[];
        if (
          !phoenixConnectionInfoResult ||
          phoenixConnectionInfoResult.length === 0 ||
          !phoenixConnectionInfoResult[0]
        ) {
          throw new Error("Received invalid phoenix connection response.");
        }
        return {
          status: response.status,
          data: phoenixConnectionInfoResult[0].phoenixServiceInfo,
        };
      }
      const phoenixError = responseJson as IPhoenixError;
      if (response.status === HttpStatusCodes.Forbidden) {
        if (phoenixError.message === "Sequence contains no elements") {
          throw Error("Phoenix container allocation failed, please try again later.");
        }
        throw new AbortError(this.ConvertToForbiddenErrorString(phoenixError));
      }
      throw new AbortError(phoenixError.message);
    } catch (error) {
      error.status = response?.status;
      throw error;
    }
  }

  public async initiateContainerHeartBeat(shouldUseNotebookStates: boolean, containerData: IContainerData) {
    if (this.containerHealthHandler) {
      clearTimeout(this.containerHealthHandler);
    }
    await this.getContainerHealth(shouldUseNotebookStates, Notebook.containerStatusHeartbeatDelayMs, containerData);
  }

  private scheduleContainerHeartbeat(
    shouldUseNotebookStates: boolean,
    delayMs: number,
    containerData: IContainerData,
  ): void {
    this.containerHealthHandler = setTimeout(async () => {
      await this.getContainerHealth(shouldUseNotebookStates, delayMs, containerData);
    }, delayMs);
  }

  private async getContainerStatusAsync(
    shouldUseNotebookStates: boolean,
    containerData: IContainerData,
  ): Promise<ContainerInfo> {
    try {
      const runContainerStatusAsync = async () => {
        const response = await window.fetch(
          `${this.getPhoenixControlPlanePathPrefix()}/${containerData.forwardingId}`,
          {
            method: "GET",
            headers: PhoenixClient.getHeaders(),
          },
        );
        if (response.status === HttpStatusCodes.OK) {
          const containerStatus = await response.json();
          return {
            durationLeftInMinutes: containerStatus?.durationLeftInMinutes,
            phoenixServerInfo: containerStatus?.phoenixServerInfo,
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
          shouldUseNotebookStates
            ? useNotebook.getState().resetContainerConnection(connectionStatus)
            : useQueryCopilot.getState().resetContainerConnection();
          shouldUseNotebookStates && useNotebook.getState().setIsRefreshed(!useNotebook.getState().isRefreshed);
          shouldUseNotebookStates &&
            useDialog
              .getState()
              .showOkModalDialog(
                "Disconnected",
                "Disconnected from temporary workspace. Please click on connect button to connect to temporary workspace.",
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
      shouldUseNotebookStates
        ? useNotebook.getState().resetContainerConnection(connectionStatus)
        : useQueryCopilot.getState().resetContainerConnection();
      shouldUseNotebookStates && useNotebook.getState().setIsRefreshed(!useNotebook.getState().isRefreshed);
      return {
        durationLeftInMinutes: undefined,
        phoenixServerInfo: undefined,
        status: ContainerStatusType.Disconnected,
      };
    }
  }

  private async getContainerHealth(shouldUseNotebookStates: boolean, delayMs: number, containerData: IContainerData) {
    const containerInfo = await this.getContainerStatusAsync(shouldUseNotebookStates, containerData);
    shouldUseNotebookStates
      ? useNotebook.getState().setContainerStatus(containerInfo)
      : useQueryCopilot.getState().setContainerStatus(containerInfo);

    const containerStatus = shouldUseNotebookStates
      ? useNotebook.getState().containerStatus?.status
      : useQueryCopilot.getState().containerStatus?.status;
    if (containerStatus === ContainerStatusType.Active) {
      this.scheduleContainerHeartbeat(shouldUseNotebookStates, delayMs, containerData);
    }
  }

  public async getDbAccountAllowedStatus(): Promise<IDbAccountAllow> {
    const startKey = TelemetryProcessor.traceStart(Action.PhoenixDBAccountAllowed, {
      dataExplorerArea: Areas.Notebook,
    });
    let responseJson;
    try {
      const response = await window.fetch(`${this.getPhoenixControlPlanePathPrefix()}`, {
        method: "GET",
        headers: PhoenixClient.getHeaders(),
      });
      responseJson = await response?.json();
      if (response.status !== HttpStatusCodes.OK) {
        throw new Error(`Received status code: ${response?.status}`);
      }
      TelemetryProcessor.traceSuccess(
        Action.PhoenixDBAccountAllowed,
        {
          dataExplorerArea: Areas.Notebook,
        },
        startKey,
      );
      return {
        status: response.status,
        message: responseJson?.message,
        type: responseJson?.type,
      };
    } catch (error) {
      TelemetryProcessor.traceFailure(
        Action.PhoenixDBAccountAllowed,
        {
          dataExplorerArea: Areas.Notebook,
          error: getErrorMessage(error),
          errorStack: getErrorStack(error),
        },
        startKey,
      );
      Logger.logError(getErrorMessage(error), "PhoenixClient/IsDbAcountWhitelisted");
      return {
        status: HttpStatusCodes.Forbidden,
        message: responseJson?.message,
        type: responseJson?.type,
      };
    }
  }

  private getPhoenixControlPlanePathPrefix(): string {
    if (!this.armResourceId) {
      throw new Error("The Phoenix client was not initialized properly: missing ARM resourcce id");
    }

    const toolsEndpoint =
      userContext.features.phoenixEndpoint ?? userContext.features.junoEndpoint ?? configContext.JUNO_ENDPOINT;

    if (!validateEndpoint(toolsEndpoint, allowedJunoOrigins)) {
      const error = `${toolsEndpoint} not allowed as tools endpoint`;
      console.error(error);
      throw new Error(error);
    }

    return `${toolsEndpoint}/api/controlplane/toolscontainer/cosmosaccounts${this.armResourceId}`;
  }

  private static getHeaders(): HeadersInit {
    const authorizationHeader = getAuthorizationHeader();
    return {
      [authorizationHeader.header]: authorizationHeader.token,
      [HttpHeaders.contentType]: "application/json",
    };
  }

  private initializeCancelEventListener(): void {
    this.abortController = new AbortController();
    this.abortSignal = this.abortController.signal;

    document.addEventListener("keydown", (event: KeyboardEvent) => {
      if (event.ctrlKey && (event.key === "c" || event.key === "z")) {
        this.abortController.abort(new AbortError("Request canceled"));
      }
    });
  }

  public ConvertToForbiddenErrorString(jsonData: IPhoenixError): string {
    const errInfo = jsonData;
    switch (errInfo?.type) {
      case PhoenixErrorType.MaxAllocationTimeExceeded: {
        const maxAllocationTimeExceeded = errInfo as IMaxAllocationTimeExceeded;
        const allocateAfterTimestamp = new Date(maxAllocationTimeExceeded?.earliestAllocationTimestamp);
        allocateAfterTimestamp.setDate(allocateAfterTimestamp.getDate() + 1);
        return `${errInfo.message}` + ". Please try again after " + `${allocateAfterTimestamp.toLocaleString()}`;
      }
      case PhoenixErrorType.MaxDbAccountsPerUserExceeded:
      case PhoenixErrorType.MaxUsersPerDbAccountExceeded:
      case PhoenixErrorType.AllocationValidationResult:
      case PhoenixErrorType.RegionNotServicable:
      case PhoenixErrorType.UserMissingPermissionsError:
      case PhoenixErrorType.SubscriptionNotAllowed: {
        return `${errInfo.message}`;
      }
      default: {
        return undefined;
      }
    }
  }
}
