/**
 * Notebook container related stuff
 */
import * as DataModels from "../../Contracts/DataModels";
import * as Logger from "../../Common/Logger";

export class NotebookContainerClient {
  private reconnectingNotificationId: string;
  private isResettingWorkspace: boolean;

  constructor(private notebookServerInfo: ko.Observable<DataModels.NotebookWorkspaceConnectionInfo>) {}

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
        headers: { Authorization: authToken }
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
      authToken
    };
  }

  private async recreateNotebookWorkspaceAsync(): Promise<void> {
    const explorer = window.dataExplorer;
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
