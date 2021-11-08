/**
 * Notebook container related stuff
 */
import promiseRetry, { AbortError } from "p-retry";
import { PhoenixClient } from "Phoenix/PhoenixClient";
import * as Constants from "../../Common/Constants";
import { ConnectionStatusType, HttpHeaders, HttpStatusCodes } from "../../Common/Constants";
import { getErrorMessage } from "../../Common/ErrorHandlingUtils";
import * as Logger from "../../Common/Logger";
import * as DataModels from "../../Contracts/DataModels";
import {
  ContainerConnectionInfo,
  IPhoenixConnectionInfoResult,
  IProvisionData,
  IResponse
} from "../../Contracts/DataModels";
import { userContext } from "../../UserContext";
import { createOrUpdate, destroy } from "../../Utils/arm/generatedClients/cosmosNotebooks/notebookWorkspaces";
import { getAuthorizationHeader } from "../../Utils/AuthorizationUtils";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { NotebookUtil } from "./NotebookUtil";
import { useNotebook } from "./useNotebook";

export class NotebookContainerClient {
  private clearReconnectionAttemptMessage?= () => { };
  private isResettingWorkspace: boolean;
  private phoenixClient: PhoenixClient;

  constructor(private onConnectionLost: () => void) {
    this.phoenixClient = new PhoenixClient();
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
    setTimeout(() => {
      this.getMemoryUsage()
        .then((memoryUsageInfo) => useNotebook.getState().setMemoryUsageInfo(memoryUsageInfo))
        .catch(() => {
          if (NotebookUtil.isPhoenixEnabled()) {
            const connectionStatus: ContainerConnectionInfo = {
              status: ConnectionStatusType.Failed,
            };
            useNotebook.getState().resetContainerConnection(connectionStatus);
            useNotebook.getState().setIsRefreshed(!useNotebook.getState().isRefreshed);
          }
        })
        .finally(() => {
          const notebookServerInfo = useNotebook.getState().notebookServerInfo;
          if (notebookServerInfo?.notebookServerEndpoint) {
            this.scheduleHeartbeat(Constants.Notebook.heartbeatDelayMs);
          }
        });
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
        return this._getMemoryAsync(notebookServerEndpoint, authToken);
      };

      return (async () => {
        return await promiseRetry(runMemoryAsync, {
          onFailedAttempt: (err) => {
            NotebookUtil.sleep(Notebook.retryAttemptDelayMs);
            console.log(err.attemptNumber);
          },
          retries: Notebook.retryAttempts,
        });
      })();
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
    if (this.checkStatus()) {
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
      throw new Error();
    } else {
      return undefined;
    }
  }

  private checkStatus(): boolean {
    if (NotebookUtil.isPhoenixEnabled()) {
      if (useNotebook.getState().containerStatus?.status === Constants.ContainerStatusType.Disconnected) {
        const connectionStatus: ContainerConnectionInfo = {
          status: ConnectionStatusType.Reconnect,
        };
        useNotebook.getState().resetContainerConnection(connectionStatus);
        useNotebook.getState().setIsRefreshed(!useNotebook.getState().isRefreshed);
        return false;
      }
    }
    return true;
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
      if (NotebookUtil.isPhoenixEnabled()) {
        const provisionData: IProvisionData = {
          aadToken: userContext.authorizationToken,
          subscriptionId: userContext.subscriptionId,
          resourceGroup: userContext.resourceGroup,
          dbAccountName: userContext.databaseAccount.name,
          cosmosEndpoint: userContext.databaseAccount.properties.documentEndpoint,
        };
        return await this.phoenixClient.resetContainer(provisionData);
      }
      return null;
    } catch (error) {
      Logger.logError(getErrorMessage(error), "NotebookContainerClient/resetWorkspace");
      if (!NotebookUtil.isPhoenixEnabled()) {
        await this.recreateNotebookWorkspaceAsync();
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

  private async recreateNotebookWorkspaceAsync(): Promise<void> {
    const { databaseAccount } = userContext;
    if (!databaseAccount?.id) {
      throw new Error("DataExplorer not initialized");
    }
    try {
      await destroy(userContext.subscriptionId, userContext.resourceGroup, userContext.databaseAccount.name, "default");
      await createOrUpdate(
        userContext.subscriptionId,
        userContext.resourceGroup,
        userContext.databaseAccount.name,
        "default"
      );
    } catch (error) {
      Logger.logError(getErrorMessage(error), "NotebookContainerClient/recreateNotebookWorkspaceAsync");
      return Promise.reject(error);
    }
  }

  private getHeaders(): HeadersInit {
    const authorizationHeader = getAuthorizationHeader();
    return {
      [authorizationHeader.header]: authorizationHeader.token,
      [HttpHeaders.contentType]: "application/json",
    };
  }
}
