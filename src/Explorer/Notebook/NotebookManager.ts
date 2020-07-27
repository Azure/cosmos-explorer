/*
 * Contains all notebook related stuff meant to be dynamically loaded by explorer
 */

import { JunoClient } from "../../Juno/JunoClient";
import * as ViewModels from "../../Contracts/ViewModels";
import { GitHubOAuthService } from "../../GitHub/GitHubOAuthService";
import { GitHubClient } from "../../GitHub/GitHubClient";
import * as Logger from "../../Common/Logger";
import { HttpStatusCodes, Areas } from "../../Common/Constants";
import { GitHubReposPane } from "../Panes/GitHubReposPane";
import ko from "knockout";
import TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import { IContentProvider } from "@nteract/core";
import { NotebookContentProvider } from "./NotebookComponent/NotebookContentProvider";
import { GitHubContentProvider } from "../../GitHub/GitHubContentProvider";
import { contents } from "rx-jupyter";
import { NotebookContainerClient } from "./NotebookContainerClient";
import { MemoryUsageInfo } from "../../Contracts/DataModels";
import { NotebookContentClient } from "./NotebookContentClient";
import { DialogProps } from "../Controls/DialogReactComponent/DialogComponent";
import { ResourceTreeAdapter } from "../Tree/ResourceTreeAdapter";
import { PublishNotebookPaneAdapter } from "../Panes/PublishNotebookPaneAdapter";
import { getFullName } from "../../Utils/UserUtils";
import { ImmutableNotebook } from "@nteract/commutable";
import Explorer from "../Explorer";

export interface NotebookManagerOptions {
  container: Explorer;
  notebookBasePath: ko.Observable<string>;
  dialogProps: ko.Observable<DialogProps>;
  resourceTree: ResourceTreeAdapter;
  refreshCommandBarButtons: () => void;
  refreshNotebookList: () => void;
}

export default class NotebookManager {
  private params: NotebookManagerOptions;
  public junoClient: JunoClient;

  public notebookContentProvider: IContentProvider;
  public notebookClient: ViewModels.INotebookContainerClient;
  public notebookContentClient: ViewModels.INotebookContentClient;

  private gitHubContentProvider: GitHubContentProvider;
  public gitHubOAuthService: GitHubOAuthService;
  private gitHubClient: GitHubClient;

  public gitHubReposPane: ViewModels.ContextualPane;
  public publishNotebookPaneAdapter: PublishNotebookPaneAdapter;

  public initialize(params: NotebookManagerOptions): void {
    this.params = params;
    this.junoClient = new JunoClient(this.params.container.databaseAccount);

    this.gitHubOAuthService = new GitHubOAuthService(this.junoClient);
    this.gitHubClient = new GitHubClient(this.onGitHubClientError);
    this.gitHubReposPane = new GitHubReposPane({
      id: "gitHubReposPane",
      visible: ko.observable<boolean>(false),
      container: this.params.container,
      junoClient: this.junoClient,
      gitHubClient: this.gitHubClient
    });

    this.gitHubContentProvider = new GitHubContentProvider({
      gitHubClient: this.gitHubClient,
      promptForCommitMsg: this.promptForCommitMsg
    });

    this.notebookContentProvider = new NotebookContentProvider(
      this.gitHubContentProvider,
      contents.JupyterContentProvider
    );

    this.notebookClient = new NotebookContainerClient(
      this.params.container.notebookServerInfo,
      () => this.params.container.initNotebooks(this.params.container.databaseAccount()),
      (update: MemoryUsageInfo) => this.params.container.memoryUsageInfo(update)
    );

    this.notebookContentClient = new NotebookContentClient(
      this.params.container.notebookServerInfo,
      this.params.notebookBasePath,
      this.notebookContentProvider
    );

    if (this.params.container.isGalleryPublishEnabled()) {
      this.publishNotebookPaneAdapter = new PublishNotebookPaneAdapter(this.params.container, this.junoClient);
    }

    this.gitHubOAuthService.getTokenObservable().subscribe(token => {
      this.gitHubClient.setToken(token?.access_token);

      if (this.gitHubReposPane.visible()) {
        this.gitHubReposPane.open();
      }

      this.params.refreshCommandBarButtons();
      this.params.refreshNotebookList();
    });

    this.junoClient.subscribeToPinnedRepos(pinnedRepos => {
      this.params.resourceTree.initializeGitHubRepos(pinnedRepos);
      this.params.resourceTree.triggerRender();
    });
    this.junoClient.getPinnedRepos(this.gitHubOAuthService.getTokenObservable()()?.scope);
  }

  public openPublishNotebookPane(
    name: string,
    content: string | ImmutableNotebook,
    parentDomElement: HTMLElement
  ): void {
    this.publishNotebookPaneAdapter.open(name, getFullName(), content, parentDomElement);
  }

  // Octokit's error handler uses any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private onGitHubClientError = (error: any): void => {
    Logger.logError(error, "NotebookManager/onGitHubClientError");

    if (error.status === HttpStatusCodes.Unauthorized) {
      this.gitHubOAuthService.resetToken();

      this.params.container.showOkCancelModalDialog(
        undefined,
        "Cosmos DB cannot access your Github account anymore. Please connect to GitHub again.",
        "Connect to GitHub",
        () => this.gitHubReposPane.open(),
        "Cancel",
        undefined
      );
    }
  };

  private promptForCommitMsg = (title: string, primaryButtonLabel: string) => {
    return new Promise<string>((resolve, reject) => {
      let commitMsg = "Committed from Azure Cosmos DB Notebooks";
      this.params.container.showOkCancelTextFieldModalDialog(
        title || "Commit",
        undefined,
        primaryButtonLabel || "Commit",
        () => {
          TelemetryProcessor.trace(Action.NotebooksGitHubCommit, ActionModifiers.Mark, {
            databaseAccountName:
              this.params.container.databaseAccount() && this.params.container.databaseAccount().name,
            defaultExperience: this.params.container.defaultExperience && this.params.container.defaultExperience(),
            dataExplorerArea: Areas.Notebook
          });
          resolve(commitMsg);
        },
        "Cancel",
        () => reject(new Error("Commit dialog canceled")),
        {
          label: "Commit message",
          autoAdjustHeight: true,
          multiline: true,
          defaultValue: commitMsg,
          rows: 3,
          onChange: (_, newValue: string) => {
            commitMsg = newValue;
            this.params.dialogProps().primaryButtonDisabled = !commitMsg;
            this.params.dialogProps.valueHasMutated();
          }
        },
        !commitMsg
      );
    });
  };
}
