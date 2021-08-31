/**
 * Notebook container related stuff
 */
import * as Constants from "../../Common/Constants";
import { getErrorMessage } from "../../Common/ErrorHandlingUtils";
import * as Logger from "../../Common/Logger";
import * as DataModels from "../../Contracts/DataModels";
import { userContext } from "../../UserContext";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { useNotebook } from "./useNotebook";

export class NotebookContainerClient {
  private clearReconnectionAttemptMessage? = () => {};
  private isResettingWorkspace: boolean;

  constructor(private onConnectionLost: () => void) {
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
        .finally(() => this.scheduleHeartbeat(Constants.Notebook.heartbeatDelayMs));
    }, delayMs);
  }

  private async getMemoryUsage(): Promise<DataModels.MemoryUsageInfo> {
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
    const notebookServerInfo = useNotebook.getState().notebookServerInfo;
    if (!notebookServerInfo || !notebookServerInfo.notebookServerEndpoint) {
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
  }
}
