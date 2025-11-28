/**
 * Notebook container related stuff
 */
import { useDialog } from "Explorer/Controls/Dialog";
import promiseRetry, { AbortError, Options } from "p-retry";
import { PhoenixClient } from "Phoenix/PhoenixClient";
import * as Constants from "../../Common/Constants";
import { ConnectionStatusType, HttpHeaders, HttpStatusCodes, Notebook, PoolIdType } from "../../Common/Constants";
import { getErrorMessage } from "../../Common/ErrorHandlingUtils";
import * as Logger from "../../Common/Logger";
import * as DataModels from "../../Contracts/DataModels";
import { IPhoenixServiceInfo, IProvisionData, IResponse } from "../../Contracts/DataModels";
import { userContext } from "../../UserContext";
import { getAuthorizationHeader } from "../../Utils/AuthorizationUtils";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { useNotebook } from "./useNotebook";

export class NotebookContainerClient {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private clearReconnectionAttemptMessage? = () => {};
  private isResettingWorkspace: boolean;
  private phoenixClient: PhoenixClient;
  private retryOptions: Options;
  private scheduleTimerId: NodeJS.Timeout;

  constructor(private onConnectionLost: () => void) {
    this.phoenixClient = new PhoenixClient(userContext?.databaseAccount?.id);
    this.retryOptions = {
      retries: Notebook.retryAttempts,
      maxTimeout: Notebook.retryAttemptDelayMs,
      minTimeout: Notebook.retryAttemptDelayMs,
    };

    this.initHeartbeat(Constants.Notebook.heartbeatDelayMs);
  }

  private initHeartbeat(delayMs: number): void {
    this.scheduleHeartbeat(delayMs);

    useNotebook.subscribe(
      () => this.scheduleHeartbeat(delayMs),
      (state) => state.notebookServerInfo,
    );
  }

  private scheduleHeartbeat(delayMs: number) {
    if (this.scheduleTimerId) {
      clearInterval(this.scheduleTimerId);
    }

    const notebookServerInfo = useNotebook.getState().notebookServerInfo;
    if (notebookServerInfo?.notebookServerEndpoint) {
      this.scheduleTimerId = setInterval(async () => {
        const notebookServerInfo = useNotebook.getState().notebookServerInfo;
        if (notebookServerInfo?.notebookServerEndpoint) {
          const memoryUsageInfo = await this.getMemoryUsage();
          useNotebook.getState().setMemoryUsageInfo(memoryUsageInfo);
        }
      }, delayMs);
    }
  }

  public async getMemoryUsage(): Promise<DataModels.MemoryUsageInfo> {
    const notebookServerInfo = useNotebook.getState().notebookServerInfo;
    if (!notebookServerInfo || !notebookServerInfo.notebookServerEndpoint) {
      const error = "No server endpoint detected";
      Logger.logError(error, "NotebookContainerClient/getMemoryUsage");
      return Promise.reject(error);
    }

    if (this.isResettingWorkspace) {
      return undefined;
    }

    const { notebookServerEndpoint, authToken } = this.getNotebookServerConfig();
    try {
      const runMemoryAsync = async () => {
        return await this._getMemoryAsync(notebookServerEndpoint, authToken);
      };
      return await promiseRetry(runMemoryAsync, this.retryOptions);
    } catch (error) {
      Logger.logError(getErrorMessage(error), "NotebookContainerClient/getMemoryUsage");
      if (!this.clearReconnectionAttemptMessage) {
        this.clearReconnectionAttemptMessage = logConsoleProgress(
          "Connection lost with Notebook server. Attempting to reconnect...",
        );
      }
      this.onConnectionLost();
      return undefined;
    }
  }

  private async _getMemoryAsync(
    notebookServerEndpoint: string,
    authToken: string,
  ): Promise<DataModels.MemoryUsageInfo> {
    if (this.shouldExecuteMemoryCall()) {
      const response = await fetch(`${notebookServerEndpoint}api/metrics/memory`, {
        method: "GET",
        headers: {
          Authorization: authToken,
          "content-type": "application/json",
        },
      });
      if (response.ok) {
        if (this.clearReconnectionAttemptMessage) {
          this.clearReconnectionAttemptMessage();
          this.clearReconnectionAttemptMessage = undefined;
        }
        const memoryUsageInfo = await response.json();
        if (memoryUsageInfo) {
          return {
            totalKB: memoryUsageInfo.total,
            freeKB: memoryUsageInfo.free,
          };
        }
      } else if (response.status === HttpStatusCodes.NotFound) {
        throw new AbortError(response.statusText);
      }
      throw new Error(response.statusText);
    } else {
      return undefined;
    }
  }

  private shouldExecuteMemoryCall(): boolean {
    return (
      useNotebook.getState().containerStatus?.status === Constants.ContainerStatusType.Active &&
      useNotebook.getState().connectionInfo?.status === ConnectionStatusType.Connected
    );
  }

  public async resetWorkspace(): Promise<IResponse<IPhoenixServiceInfo>> {
    this.isResettingWorkspace = true;
    let response: IResponse<IPhoenixServiceInfo>;
    try {
      response = await this._resetWorkspace();
    } catch (error) {
      Promise.reject(error);
      return response;
    }
    this.isResettingWorkspace = false;
    return response;
  }

  private async _resetWorkspace(): Promise<IResponse<IPhoenixServiceInfo>> {
    const notebookServerInfo = useNotebook.getState().notebookServerInfo;
    if (!notebookServerInfo || !notebookServerInfo.notebookServerEndpoint) {
      const error = "No server endpoint detected";
      Logger.logError(error, "NotebookContainerClient/resetWorkspace");
      return Promise.reject(error);
    }

    try {
      if (useNotebook.getState().isPhoenixNotebooks) {
        const provisionData: IProvisionData = {
          cosmosEndpoint: userContext.databaseAccount.properties.documentEndpoint,
          poolId: PoolIdType.DefaultPoolId,
        };
        return await this.phoenixClient.resetContainer(provisionData);
      }
      return null;
    } catch (error) {
      Logger.logError(getErrorMessage(error), "NotebookContainerClient/resetWorkspace");
      if (error?.status === HttpStatusCodes.Forbidden && error.message) {
        useDialog.getState().showOkModalDialog("Connection Failed", `${error.message}`);
      } else {
        useDialog
          .getState()
          .showOkModalDialog(
            "Connection Failed",
            "We are unable to connect to the temporary workspace. Please try again in a few minutes. If the error persists, file a support ticket.",
          );
      }
      throw error;
    }
  }

  private getNotebookServerConfig(): { notebookServerEndpoint: string; authToken: string } {
    const notebookServerInfo = useNotebook.getState().notebookServerInfo;
    const authToken: string = notebookServerInfo.authToken ? `Token ${notebookServerInfo.authToken}` : undefined;

    return {
      notebookServerEndpoint: notebookServerInfo.notebookServerEndpoint,
      authToken,
    };
  }

  private getHeaders(): HeadersInit {
    const authorizationHeader = getAuthorizationHeader();
    return {
      [authorizationHeader.header]: authorizationHeader.token,
      [HttpHeaders.contentType]: "application/json",
    };
  }
}
