/**
 * Notebook container related stuff
 */
import * as Constants from "../../Common/Constants";
import { getErrorMessage } from "../../Common/ErrorHandlingUtils";
import * as Logger from "../../Common/Logger";
import * as DataModels from "../../Contracts/DataModels";
import { userContext } from "../../UserContext";
import { createOrUpdate, destroy } from "../../Utils/arm/generatedClients/cosmosNotebooks/notebookWorkspaces";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";

export class NotebookContainerClient {
  private clearReconnectionAttemptMessage? = () => {};
  private isResettingWorkspace: boolean;

  constructor(
    private notebookServerInfo: ko.Observable<DataModels.NotebookWorkspaceConnectionInfo>,
    private onConnectionLost: () => void,
    private onMemoryUsageInfoUpdate: (update: DataModels.MemoryUsageInfo) => void
  ) {
    if (notebookServerInfo() && notebookServerInfo().notebookServerEndpoint) {
      this.scheduleHeartbeat(Constants.Notebook.heartbeatDelayMs);
    } else {
      const subscription = notebookServerInfo.subscribe((newServerInfo: DataModels.NotebookWorkspaceConnectionInfo) => {
        if (newServerInfo && newServerInfo.notebookServerEndpoint) {
          this.scheduleHeartbeat(Constants.Notebook.heartbeatDelayMs);
        }
        subscription.dispose();
      });
    }
  }

  /**
   * Heartbeat: each ping schedules another ping
   */
  private scheduleHeartbeat(delayMs: number): void {
    setTimeout(() => {
      this.getMemoryUsage()
        .then((memoryUsageInfo) => this.onMemoryUsageInfoUpdate(memoryUsageInfo))
        .finally(() => this.scheduleHeartbeat(Constants.Notebook.heartbeatDelayMs));
    }, delayMs);
  }

  private async getMemoryUsage(): Promise<DataModels.MemoryUsageInfo> {
    if (!this.notebookServerInfo() || !this.notebookServerInfo().notebookServerEndpoint) {
      const error = "No server endpoint detected";
      Logger.logError(error, "NotebookContainerClient/getMemoryUsage");
      return Promise.reject(error);
    }

    if (this.isResettingWorkspace) {
      return undefined;
    }

    const { notebookServerEndpoint, authToken } = this.getNotebookServerConfig();
    try {
      const response = await fetch(`${notebookServerEndpoint}/api/metrics/memory`, {
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
      }
      return undefined;
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

  public async resetWorkspace(): Promise<void> {
    this.isResettingWorkspace = true;
    try {
      await this._resetWorkspace();
    } catch (error) {
      Promise.reject(error);
    }
    this.isResettingWorkspace = false;
  }

  private async _resetWorkspace(): Promise<void> {
    if (!this.notebookServerInfo() || !this.notebookServerInfo().notebookServerEndpoint) {
      const error = "No server endpoint detected";
      Logger.logError(error, "NotebookContainerClient/resetWorkspace");
      return Promise.reject(error);
    }

    const { notebookServerEndpoint, authToken } = this.getNotebookServerConfig();
    try {
      await fetch(`${notebookServerEndpoint}/api/shutdown`, {
        method: "POST",
        headers: { Authorization: authToken },
      });
    } catch (error) {
      Logger.logError(getErrorMessage(error), "NotebookContainerClient/resetWorkspace");
      await this.recreateNotebookWorkspaceAsync();
    }
  }

  private getNotebookServerConfig(): { notebookServerEndpoint: string; authToken: string } {
    let authToken: string,
      notebookServerEndpoint = this.notebookServerInfo().notebookServerEndpoint,
      token = this.notebookServerInfo().authToken;
    if (token) {
      authToken = `Token ${token}`;
    }

    return {
      notebookServerEndpoint,
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
}
