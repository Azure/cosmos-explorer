/**
 * Notebook container related stuff
 */
import promiseRetry, { AbortError } from "p-retry";
import { PhoenixClient } from "Phoenix/PhoenixClient";
import * as Constants from "../../Common/Constants";
import { ConnectionStatusType, HttpHeaders, HttpStatusCodes, Notebook } from "../../Common/Constants";
import { getErrorMessage } from "../../Common/ErrorHandlingUtils";
import * as Logger from "../../Common/Logger";
import * as DataModels from "../../Contracts/DataModels";
import { IPhoenixConnectionInfoResult, IProvisionData, IResponse } from "../../Contracts/DataModels";
import { userContext } from "../../UserContext";
import { getAuthorizationHeader } from "../../Utils/AuthorizationUtils";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { useNotebook } from "./useNotebook";

export class NotebookContainerClient {
  private clearReconnectionAttemptMessage? = () => {};
  private isResettingWorkspace: boolean;
  private phoenixClient: PhoenixClient;
  private retryOptions: promiseRetry.Options;

  constructor(private onConnectionLost: () => void) {
    this.phoenixClient = new PhoenixClient();
    this.retryOptions = {
      retries: Notebook.retryAttempts,
      maxTimeout: Notebook.retryAttemptDelayMs,
      minTimeout: Notebook.retryAttemptDelayMs,
    };
    const notebookServerInfo = useNotebook.getState().notebookServerInfo;
    if (notebookServerInfo?.notebookServerEndpoint) {
      this.scheduleHeartbeat(Constants.Notebook.heartbeatDelayMs);
    } else {
      const unsub = useNotebook.subscribe(
        (newServerInfo: DataModels.NotebookWorkspaceConnectionInfo) => {
          if (newServerInfo?.notebookServerEndpoint) {
            this.scheduleHeartbeat(Constants.Notebook.heartbeatDelayMs);
          }
          unsub();
        },
        (state) => state.notebookServerInfo
      );
    }
  }

  /**
   * Heartbeat: each ping schedules another ping
   */
  private scheduleHeartbeat(delayMs: number): void {
    setTimeout(async () => {
      const memoryUsageInfo = await this.getMemoryUsage();
      useNotebook.getState().setMemoryUsageInfo(memoryUsageInfo);
      const notebookServerInfo = useNotebook.getState().notebookServerInfo;
      if (notebookServerInfo?.notebookServerEndpoint) {
        this.scheduleHeartbeat(Constants.Notebook.heartbeatDelayMs);
      }
    }, delayMs);
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
          "Connection lost with Notebook server. Attempting to reconnect..."
        );
      }
      this.onConnectionLost();
      return undefined;
    }
  }

  private async _getMemoryAsync(
    notebookServerEndpoint: string,
    authToken: string
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
    if (
      useNotebook.getState().containerStatus?.status === Constants.ContainerStatusType.Active &&
      useNotebook.getState().connectionInfo?.status === ConnectionStatusType.Connected
    ) {
      return true;
    }
    return false;
  }

  public async resetWorkspace(): Promise<IResponse<IPhoenixConnectionInfoResult>> {
    this.isResettingWorkspace = true;
    let response: IResponse<IPhoenixConnectionInfoResult>;
    try {
      response = await this._resetWorkspace();
    } catch (error) {
      Promise.reject(error);
      return response;
    }
    this.isResettingWorkspace = false;
    return response;
  }

  private async _resetWorkspace(): Promise<IResponse<IPhoenixConnectionInfoResult>> {
    const notebookServerInfo = useNotebook.getState().notebookServerInfo;
    if (!notebookServerInfo || !notebookServerInfo.notebookServerEndpoint) {
      const error = "No server endpoint detected";
      Logger.logError(error, "NotebookContainerClient/resetWorkspace");
      return Promise.reject(error);
    }

    try {
      if (useNotebook.getState().isPhoenix) {
        const provisionData: IProvisionData = {
          cosmosEndpoint: userContext.databaseAccount.properties.documentEndpoint,
        };
        return await this.phoenixClient.resetContainer(provisionData);
      }
      return null;
    } catch (error) {
      Logger.logError(getErrorMessage(error), "NotebookContainerClient/resetWorkspace");
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
