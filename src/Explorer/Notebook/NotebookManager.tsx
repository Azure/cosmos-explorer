/*
 * Contains all notebook related stuff meant to be dynamically loaded by explorer
 */

import { ImmutableNotebook } from "@nteract/commutable";
import type { IContentProvider } from "@nteract/core";
import ko from "knockout";
import React from "react";
import { contents } from "rx-jupyter";
import { Areas, HttpStatusCodes } from "../../Common/Constants";
import { getErrorMessage } from "../../Common/ErrorHandlingUtils";
import * as Logger from "../../Common/Logger";
import { MemoryUsageInfo } from "../../Contracts/DataModels";
import { GitHubClient } from "../../GitHub/GitHubClient";
import { GitHubContentProvider } from "../../GitHub/GitHubContentProvider";
import { GitHubOAuthService } from "../../GitHub/GitHubOAuthService";
import { JunoClient } from "../../Juno/JunoClient";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../UserContext";
import { getFullName } from "../../Utils/UserUtils";
import Explorer from "../Explorer";
import { ContextualPaneBase } from "../Panes/ContextualPaneBase";
import { CopyNotebookPane } from "../Panes/CopyNotebookPane/CopyNotebookPane";
import { PublishNotebookPane } from "../Panes/PublishNotebookPane/PublishNotebookPane";
import { ResourceTreeAdapter } from "../Tree/ResourceTreeAdapter";
import { InMemoryContentProvider } from "./NotebookComponent/ContentProviders/InMemoryContentProvider";
import { NotebookContentProvider } from "./NotebookComponent/NotebookContentProvider";
import { SnapshotRequest } from "./NotebookComponent/types";
import { NotebookContainerClient } from "./NotebookContainerClient";
import { NotebookContentClient } from "./NotebookContentClient";
import { SchemaAnalyzerNotebook } from "./SchemaAnalyzer/SchemaAnalyzerUtils";

type NotebookPaneContent = string | ImmutableNotebook;

export type { NotebookPaneContent };

export interface NotebookManagerOptions {
  container: Explorer;
  notebookBasePath: ko.Observable<string>;
  resourceTree: ResourceTreeAdapter;
  refreshCommandBarButtons: () => void;
  refreshNotebookList: () => void;
}

export default class NotebookManager {
  private params: NotebookManagerOptions;
  public junoClient: JunoClient;

  public notebookContentProvider: IContentProvider;
  public notebookClient: NotebookContainerClient;
  public notebookContentClient: NotebookContentClient;

  private inMemoryContentProvider: InMemoryContentProvider;
  private gitHubContentProvider: GitHubContentProvider;
  public gitHubOAuthService: GitHubOAuthService;
  public gitHubClient: GitHubClient;

  public gitHubReposPane: ContextualPaneBase;

  public initialize(params: NotebookManagerOptions): void {
    this.params = params;
    this.junoClient = new JunoClient();

    this.gitHubOAuthService = new GitHubOAuthService(this.junoClient);
    this.gitHubClient = new GitHubClient(this.onGitHubClientError);

    this.inMemoryContentProvider = new InMemoryContentProvider({
      [SchemaAnalyzerNotebook.path]: {
        readonly: true,
        content: SchemaAnalyzerNotebook,
      },
    });

    this.gitHubContentProvider = new GitHubContentProvider({
      gitHubClient: this.gitHubClient,
      promptForCommitMsg: this.promptForCommitMsg,
    });

    this.notebookContentProvider = new NotebookContentProvider(
      this.inMemoryContentProvider,
      this.gitHubContentProvider,
      contents.JupyterContentProvider
    );

    this.notebookClient = new NotebookContainerClient(
      this.params.container.notebookServerInfo,
      () => this.params.container.initNotebooks(userContext?.databaseAccount),
      (update: MemoryUsageInfo) => this.params.container.memoryUsageInfo(update)
    );

    this.notebookContentClient = new NotebookContentClient(
      this.params.container.notebookServerInfo,
      this.params.notebookBasePath,
      this.notebookContentProvider
    );

    this.gitHubOAuthService.getTokenObservable().subscribe((token) => {
      this.gitHubClient.setToken(token?.access_token);
      if (this?.gitHubOAuthService.isLoggedIn()) {
        this.params.container.closeSidePanel();
        this.params.container.openGitHubReposPanel("Manager GitHub settings", this.junoClient);
      }

      this.params.refreshCommandBarButtons();
      this.params.refreshNotebookList();
    });

    this.junoClient.subscribeToPinnedRepos((pinnedRepos) => {
      this.params.resourceTree.initializeGitHubRepos(pinnedRepos);
      this.params.resourceTree.triggerRender();
    });
    this.refreshPinnedRepos();
  }

  public refreshPinnedRepos(): void {
    const token = this.gitHubOAuthService.getTokenObservable()();
    if (token) {
      this.junoClient.getPinnedRepos(token.scope);
    }
  }

  public async openPublishNotebookPane(
    name: string,
    content: NotebookPaneContent,
    notebookContentRef: string,
    onTakeSnapshot: (request: SnapshotRequest) => void,
    onClosePanel: () => void
  ): Promise<void> {
    const explorer = this.params.container;
    explorer.openSidePanel(
      "Publish Notebook",
      <PublishNotebookPane
        explorer={this.params.container}
        junoClient={this.junoClient}
        closePanel={this.params.container.closeSidePanel}
        openNotificationConsole={this.params.container.expandConsole}
        name={name}
        author={getFullName()}
        notebookContent={content}
        notebookContentRef={notebookContentRef}
        onTakeSnapshot={onTakeSnapshot}
      />,
      onClosePanel
    );
  }

  public openCopyNotebookPane(name: string, content: string): void {
    const { container } = this.params;
    container.openSidePanel(
      "Copy Notebook",
      <CopyNotebookPane
        container={container}
        closePanel={container.closeSidePanel}
        junoClient={this.junoClient}
        gitHubOAuthService={this.gitHubOAuthService}
        name={name}
        content={content}
      />
    );
  }

  // Octokit's error handler uses any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private onGitHubClientError = (error: any): void => {
    Logger.logError(getErrorMessage(error), "NotebookManager/onGitHubClientError");

    if (error.status === HttpStatusCodes.Unauthorized) {
      this.gitHubOAuthService.resetToken();

      this.params.container.showOkCancelModalDialog(
        undefined,
        "Cosmos DB cannot access your Github account anymore. Please connect to GitHub again.",
        "Connect to GitHub",
        () => this.params.container.openGitHubReposPanel("Connect to GitHub"),
        "Cancel",
        undefined
      );
    }
  };

  private promptForCommitMsg = (title: string, primaryButtonLabel: string) => {
    return new Promise<string>((resolve, reject) => {
      let commitMsg = "Committed from Azure Cosmos DB Notebooks";
      this.params.container.showOkCancelModalDialog(
        title || "Commit",
        undefined,
        primaryButtonLabel || "Commit",
        () => {
          TelemetryProcessor.trace(Action.NotebooksGitHubCommit, ActionModifiers.Mark, {
            dataExplorerArea: Areas.Notebook,
          });
          resolve(commitMsg);
        },
        "Cancel",
        () => reject(new Error("Commit dialog canceled")),
        undefined,
        {
          label: "Commit message",
          autoAdjustHeight: true,
          multiline: true,
          defaultValue: commitMsg,
          rows: 3,
          onChange: (_: unknown, newValue: string) => {
            commitMsg = newValue;
          },
        },
        !commitMsg
      );
    });
  };
}
