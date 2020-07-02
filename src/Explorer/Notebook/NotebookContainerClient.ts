/**
 * Notebook container related stuff
 */
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import * as Constants from "../../Common/Constants";
import { ConsoleDataType } from "../Menus/NotificationConsole/NotificationConsoleComponent";
import { NotificationConsoleUtils } from "../../Utils/NotificationConsoleUtils";
import * as Logger from "../../Common/Logger";

export class NotebookContainerClient implements ViewModels.INotebookContainerClient {
  private reconnectingNotificationId: string;
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
        if (this.reconnectingNotificationId) {
          NotificationConsoleUtils.clearInProgressMessageWithId(this.reconnectingNotificationId);
          this.reconnectingNotificationId = "";
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
      Logger.logError(error, "NotebookContainerClient/getMemoryUsage");
      if (!this.reconnectingNotificationId) {
        this.reconnectingNotificationId = NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.InProgress,
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
      Logger.logError(error, "NotebookContainerClient/resetWorkspace");
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
    const explorer = window.dataExplorer as ViewModels.Explorer;
    if (!explorer || !explorer.databaseAccount() || !explorer.databaseAccount().id) {
      throw new Error("DataExplorer not initialized");
    }

    const notebookWorkspaceManager = explorer.notebookWorkspaceManager;
    try {
      await notebookWorkspaceManager.deleteNotebookWorkspaceAsync(explorer.databaseAccount().id, "default");
      await notebookWorkspaceManager.createNotebookWorkspaceAsync(explorer.databaseAccount().id, "default");
    } catch (error) {
      Logger.logError(error, "NotebookContainerClient/recreateNotebookWorkspaceAsync");
      return Promise.reject(error);
    }
  }
}
