/*
 * Contains all notebook related stuff meant to be dynamically loaded by explorer
 */

import React from "react";
import { HttpStatusCodes } from "../../Common/Constants";
import { getErrorMessage } from "../../Common/ErrorHandlingUtils";
import * as Logger from "../../Common/Logger";
import { GitHubClient } from "../../GitHub/GitHubClient";
import { GitHubOAuthService } from "../../GitHub/GitHubOAuthService";
import { useSidePanel } from "../../hooks/useSidePanel";
import { JunoClient } from "../../Juno/JunoClient";
import { userContext } from "../../UserContext";
import { useDialog } from "../Controls/Dialog";
import Explorer from "../Explorer";
import { GitHubReposPanel } from "../Panes/GitHubReposPanel/GitHubReposPanel";
import { ResourceTreeAdapter } from "../Tree/ResourceTreeAdapter";
import { NotebookContainerClient } from "./NotebookContainerClient";
import { useNotebook } from "./useNotebook";

export interface NotebookManagerOptions {
  container: Explorer;
  resourceTree: ResourceTreeAdapter;
  refreshCommandBarButtons: () => void;
  refreshNotebookList: () => void;
}

export default class NotebookManager {
  private params: NotebookManagerOptions;
  public junoClient: JunoClient;

  public notebookClient: NotebookContainerClient;

  public gitHubOAuthService: GitHubOAuthService;
  public gitHubClient: GitHubClient;

  public initialize(params: NotebookManagerOptions): void {
    this.params = params;
    this.junoClient = new JunoClient();

    this.gitHubOAuthService = new GitHubOAuthService(this.junoClient);
    this.gitHubClient = new GitHubClient(this.onGitHubClientError);

    this.notebookClient = new NotebookContainerClient(() =>
      this.params.container.initNotebooks(userContext?.databaseAccount),
    );

    this.gitHubOAuthService.getTokenObservable().subscribe((token) => {
      this.gitHubClient.setToken(token?.access_token);
      if (this?.gitHubOAuthService.isLoggedIn()) {
        useSidePanel.getState().closeSidePanel();
        setTimeout(() => {
          useSidePanel
            .getState()
            .openSidePanel(
              "Manage GitHub settings",
              <GitHubReposPanel
                explorer={this.params.container}
                gitHubClientProp={this.params.container.notebookManager.gitHubClient}
                junoClientProp={this.junoClient}
              />,
            );
        }, 200);
      }

      this.params.refreshCommandBarButtons();
      this.params.refreshNotebookList();
    });

    this.junoClient.subscribeToPinnedRepos((pinnedRepos) => {
      this.params.resourceTree.initializeGitHubRepos(pinnedRepos);
      this.params.resourceTree.triggerRender();
      useNotebook.getState().initializeGitHubRepos(pinnedRepos);
    });
    this.refreshPinnedRepos();
  }

  public refreshPinnedRepos(): void {
    const token = this.gitHubOAuthService.getTokenObservable()();
    if (token) {
      this.junoClient.getPinnedRepos(token.scope);
    }
  }

  // Octokit's error handler uses any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private onGitHubClientError = (error: any): void => {
    Logger.logError(getErrorMessage(error), "NotebookManager/onGitHubClientError");

    if (error.status === HttpStatusCodes.Unauthorized) {
      this.gitHubOAuthService.resetToken();

      useDialog
        .getState()
        .showOkCancelModalDialog(
          undefined,
          "Cosmos DB cannot access your Github account anymore. Please connect to GitHub again.",
          "Connect to GitHub",
          () =>
            useSidePanel
              .getState()
              .openSidePanel(
                "Connect to GitHub",
                <GitHubReposPanel
                  explorer={this.params.container}
                  gitHubClientProp={this.params.container.notebookManager.gitHubClient}
                  junoClientProp={this.junoClient}
                />,
              ),
          "Cancel",
          undefined,
        );
    }
  };
}
