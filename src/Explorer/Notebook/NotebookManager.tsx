/*
 * Contains all notebook related stuff meant to be dynamically loaded by explorer
 */

import { ImmutableNotebook } from "@nteract/commutable";
import type { IContentProvider } from "@nteract/core";
import React from "react";
import { contents } from "rx-jupyter";
import { Areas, HttpStatusCodes } from "../../Common/Constants";
import { getErrorMessage } from "../../Common/ErrorHandlingUtils";
import * as Logger from "../../Common/Logger";
import { GitHubClient } from "../../GitHub/GitHubClient";
import { GitHubContentProvider } from "../../GitHub/GitHubContentProvider";
import { GitHubOAuthService } from "../../GitHub/GitHubOAuthService";
import { useSidePanel } from "../../hooks/useSidePanel";
import { JunoClient } from "../../Juno/JunoClient";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../UserContext";
import { getFullName } from "../../Utils/UserUtils";
import { useDialog } from "../Controls/Dialog";
import Explorer from "../Explorer";
import { CopyNotebookPane } from "../Panes/CopyNotebookPane/CopyNotebookPane";
import { GitHubReposPanel } from "../Panes/GitHubReposPanel/GitHubReposPanel";
import { PublishNotebookPane } from "../Panes/PublishNotebookPane/PublishNotebookPane";
import { ResourceTreeAdapter } from "../Tree/ResourceTreeAdapter";
import { InMemoryContentProvider } from "./NotebookComponent/ContentProviders/InMemoryContentProvider";
import { NotebookContentProvider } from "./NotebookComponent/NotebookContentProvider";
import { SnapshotRequest } from "./NotebookComponent/types";
import { NotebookContainerClient } from "./NotebookContainerClient";
import { NotebookContentClient } from "./NotebookContentClient";
import { SchemaAnalyzerNotebook } from "./SchemaAnalyzer/SchemaAnalyzerUtils";
import { useNotebook } from "./useNotebook";

type NotebookPaneContent = string | ImmutableNotebook;

export type { NotebookPaneContent };

export interface NotebookManagerOptions {
  container: Explorer;
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
      contents.JupyterContentProvider,
    );

    this.notebookClient = new NotebookContainerClient(() =>
      this.params.container.initNotebooks(userContext?.databaseAccount),
    );

    this.notebookContentClient = new NotebookContentClient(this.notebookContentProvider);

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

  public async openPublishNotebookPane(
    name: string,
    content: NotebookPaneContent,
    notebookContentRef: string,
    onTakeSnapshot: (request: SnapshotRequest) => void,
    onClosePanel: () => void,
  ): Promise<void> {
    useSidePanel
      .getState()
      .openSidePanel(
        "Publish Notebook",
        <PublishNotebookPane
          explorer={this.params.container}
          junoClient={this.junoClient}
          name={name}
          author={getFullName()}
          notebookContent={content}
          notebookContentRef={notebookContentRef}
          onTakeSnapshot={onTakeSnapshot}
        />,
        "440px",
        onClosePanel,
      );
  }

  public openCopyNotebookPane(name: string, content: string): void {
    const { container } = this.params;
    useSidePanel
      .getState()
      .openSidePanel(
        "Copy Notebook",
        <CopyNotebookPane
          container={container}
          junoClient={this.junoClient}
          gitHubOAuthService={this.gitHubOAuthService}
          name={name}
          content={content}
        />,
      );
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

  private promptForCommitMsg = (title: string, primaryButtonLabel: string) => {
    return new Promise<string>((resolve, reject) => {
      let commitMsg = "Committed from Azure Cosmos DB Notebooks";
      useDialog.getState().showOkCancelModalDialog(
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
        !commitMsg,
      );
    });
  };
}
