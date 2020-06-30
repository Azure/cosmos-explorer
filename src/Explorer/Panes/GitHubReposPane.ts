import _ from "underscore";
import { Areas, HttpStatusCodes } from "../../Common/Constants";
import * as Logger from "../../Common/Logger";
import * as ViewModels from "../../Contracts/ViewModels";
import { GitHubClient, IGitHubPageInfo, IGitHubRepo } from "../../GitHub/GitHubClient";
import { IPinnedRepo, JunoClient } from "../../Juno/JunoClient";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import * as GitHubUtils from "../../Utils/GitHubUtils";
import { JunoUtils } from "../../Utils/JunoUtils";
import { NotificationConsoleUtils } from "../../Utils/NotificationConsoleUtils";
import { AuthorizeAccessComponent } from "../Controls/GitHub/AuthorizeAccessComponent";
import { GitHubReposComponent, GitHubReposComponentProps, RepoListItem } from "../Controls/GitHub/GitHubReposComponent";
import { GitHubReposComponentAdapter } from "../Controls/GitHub/GitHubReposComponentAdapter";
import { BranchesProps, PinnedReposProps, UnpinnedReposProps } from "../Controls/GitHub/ReposListComponent";
import { ConsoleDataType } from "../Menus/NotificationConsole/NotificationConsoleComponent";
import { ContextualPaneBase } from "./ContextualPaneBase";

export class GitHubReposPane extends ContextualPaneBase {
  private static readonly PageSize = 30;

  private gitHubClient: GitHubClient;
  private junoClient: JunoClient;

  private branchesProps: Record<string, BranchesProps>;
  private pinnedReposProps: PinnedReposProps;
  private unpinnedReposProps: UnpinnedReposProps;

  private gitHubReposProps: GitHubReposComponentProps;
  private gitHubReposAdapter: GitHubReposComponentAdapter;

  private allGitHubRepos: IGitHubRepo[];
  private allGitHubReposLastPageInfo?: IGitHubPageInfo;
  private pinnedReposUpdated: boolean;

  constructor(options: ViewModels.GitHubReposPaneOptions) {
    super(options);

    this.gitHubClient = options.gitHubClient;
    this.junoClient = options.junoClient;

    this.branchesProps = {};
    this.pinnedReposProps = {
      repos: []
    };
    this.unpinnedReposProps = {
      repos: [],
      hasMore: true,
      isLoading: true,
      loadMore: (): Promise<void> => this.loadMoreUnpinnedRepos()
    };

    this.gitHubReposProps = {
      showAuthorizeAccess: true,
      authorizeAccessProps: {
        scope: this.getOAuthScope(),
        authorizeAccess: (scope): void => this.connectToGitHub(scope)
      },
      reposListProps: {
        branchesProps: this.branchesProps,
        pinnedReposProps: this.pinnedReposProps,
        unpinnedReposProps: this.unpinnedReposProps,
        pinRepo: (item): Promise<void> => this.pinRepo(item),
        unpinRepo: (item): Promise<void> => this.unpinRepo(item)
      },
      addRepoProps: {
        container: this.container,
        getRepo: (owner, repo): Promise<IGitHubRepo> => this.getRepo(owner, repo),
        pinRepo: (item): Promise<void> => this.pinRepo(item)
      },
      resetConnection: (): void => this.setup(true),
      onOkClick: (): Promise<void> => this.submit(),
      onCancelClick: (): void => this.cancel()
    };
    this.gitHubReposAdapter = new GitHubReposComponentAdapter(this.gitHubReposProps);

    this.allGitHubRepos = [];
    this.allGitHubReposLastPageInfo = undefined;
    this.pinnedReposUpdated = false;
  }

  public open(): void {
    this.resetData();
    this.setup();

    super.open();
  }

  public async submit(): Promise<void> {
    const pinnedReposUpdated = this.pinnedReposUpdated;
    const reposToPin: IPinnedRepo[] = this.pinnedReposProps.repos.map(repo => JunoUtils.toPinnedRepo(repo));

    // Submit resets data too
    super.submit();

    if (pinnedReposUpdated) {
      try {
        const response = await this.junoClient.updatePinnedRepos(reposToPin);
        if (response.status !== HttpStatusCodes.OK) {
          throw new Error(`Received HTTP ${response.status} when saving pinned repos`);
        }
      } catch (error) {
        const message = `Failed to save pinned repos: ${error}`;
        Logger.logError(message, "GitHubReposPane/submit");
        NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, message);
      }
    }
  }

  public resetData(): void {
    // Reset cached branches
    this.branchesProps = {};
    this.gitHubReposProps.reposListProps.branchesProps = this.branchesProps;

    // Reset cached pinned and unpinned repos
    this.pinnedReposProps.repos = [];
    this.unpinnedReposProps.repos = [];

    // Reset cached repos
    this.allGitHubRepos = [];
    this.allGitHubReposLastPageInfo = undefined;

    // Reset flags
    this.pinnedReposUpdated = false;
    this.unpinnedReposProps.hasMore = true;
    this.unpinnedReposProps.isLoading = true;

    this.triggerRender();

    super.resetData();
  }

  private getOAuthScope(): string {
    return (
      this.container.notebookManager?.gitHubOAuthService.getTokenObservable()()?.scope ||
      AuthorizeAccessComponent.Scopes.Public.key
    );
  }

  private setup(forceShowConnectToGitHub = false): void {
    forceShowConnectToGitHub || !this.container.notebookManager?.gitHubOAuthService.isLoggedIn()
      ? this.setupForConnectToGitHub()
      : this.setupForManageRepos();
  }

  private setupForConnectToGitHub(): void {
    this.gitHubReposProps.showAuthorizeAccess = true;
    this.gitHubReposProps.authorizeAccessProps.scope = this.getOAuthScope();
    this.isExecuting(false);
    this.title(GitHubReposComponent.ConnectToGitHubTitle); // Used for telemetry
    this.triggerRender();
  }

  private async setupForManageRepos(): Promise<void> {
    this.gitHubReposProps.showAuthorizeAccess = false;
    this.isExecuting(false);
    this.title(GitHubReposComponent.ManageGitHubRepoTitle); // Used for telemetry
    TelemetryProcessor.trace(Action.NotebooksGitHubManageRepo, ActionModifiers.Mark, {
      databaseAccountName: this.container.databaseAccount() && this.container.databaseAccount().name,
      defaultExperience: this.container.defaultExperience && this.container.defaultExperience(),
      dataExplorerArea: Areas.Notebook
    });
    this.triggerRender();

    this.refreshManageReposComponent();
  }

  private calculateUnpinnedRepos(): RepoListItem[] {
    const unpinnedGitHubRepos = this.allGitHubRepos.filter(
      gitHubRepo =>
        this.pinnedReposProps.repos.findIndex(
          pinnedRepo => pinnedRepo.key === GitHubUtils.toRepoFullName(gitHubRepo.owner, gitHubRepo.name)
        ) === -1
    );
    return unpinnedGitHubRepos.map(gitHubRepo => ({
      key: GitHubUtils.toRepoFullName(gitHubRepo.owner, gitHubRepo.name),
      repo: gitHubRepo,
      branches: []
    }));
  }

  private async loadMoreBranches(repo: IGitHubRepo): Promise<void> {
    const branchesProps = this.branchesProps[GitHubUtils.toRepoFullName(repo.owner, repo.name)];
    branchesProps.hasMore = true;
    branchesProps.isLoading = true;
    this.triggerRender();

    try {
      const response = await this.gitHubClient.getBranchesAsync(
        repo.owner,
        repo.name,
        GitHubReposPane.PageSize,
        branchesProps.lastPageInfo?.endCursor
      );
      if (response.status !== HttpStatusCodes.OK) {
        throw new Error(`Received HTTP ${response.status} when fetching branches`);
      }

      if (response.data) {
        branchesProps.branches = branchesProps.branches.concat(response.data);
        branchesProps.lastPageInfo = response.pageInfo;
      }
    } catch (error) {
      const message = `Failed to fetch branches: ${error}`;
      Logger.logError(message, "GitHubReposPane/loadMoreBranches");
      NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, message);
    }

    branchesProps.isLoading = false;
    branchesProps.hasMore = branchesProps.lastPageInfo?.hasNextPage;
    this.triggerRender();
  }

  private async loadMoreUnpinnedRepos(): Promise<void> {
    this.unpinnedReposProps.isLoading = true;
    this.unpinnedReposProps.hasMore = true;
    this.triggerRender();

    try {
      const response = await this.gitHubClient.getReposAsync(
        GitHubReposPane.PageSize,
        this.allGitHubReposLastPageInfo?.endCursor
      );
      if (response.status !== HttpStatusCodes.OK) {
        throw new Error(`Received HTTP ${response.status} when fetching unpinned repos`);
      }

      if (response.data) {
        this.allGitHubRepos = this.allGitHubRepos.concat(response.data);
        this.allGitHubReposLastPageInfo = response.pageInfo;
        this.unpinnedReposProps.repos = this.calculateUnpinnedRepos();
      }
    } catch (error) {
      const message = `Failed to fetch unpinned repos: ${error}`;
      Logger.logError(message, "GitHubReposPane/loadMoreUnpinnedRepos");
      NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, message);
    }

    this.unpinnedReposProps.isLoading = false;
    this.unpinnedReposProps.hasMore = this.allGitHubReposLastPageInfo?.hasNextPage;
    this.triggerRender();
  }

  private async getRepo(owner: string, repo: string): Promise<IGitHubRepo> {
    try {
      const response = await this.gitHubClient.getRepoAsync(owner, repo);
      if (response.status !== HttpStatusCodes.OK) {
        throw new Error(`Received HTTP ${response.status} when fetching repo`);
      }

      return response.data;
    } catch (error) {
      const message = `Failed to fetch repo: ${error}`;
      Logger.logError(message, "GitHubReposPane/getRepo");
      NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, message);
      return Promise.resolve(undefined);
    }
  }

  private async pinRepo(item: RepoListItem): Promise<void> {
    this.pinnedReposUpdated = true;
    const initialReposLength = this.pinnedReposProps.repos.length;

    const existingRepo = _.find(this.pinnedReposProps.repos, repo => repo.key === item.key);
    if (existingRepo) {
      existingRepo.branches = item.branches;
    } else {
      this.pinnedReposProps.repos = [...this.pinnedReposProps.repos, item];
    }

    this.unpinnedReposProps.repos = this.calculateUnpinnedRepos();
    this.triggerRender();

    if (this.pinnedReposProps.repos.length > initialReposLength) {
      this.refreshBranchesForPinnedRepos();
    }
  }

  private async unpinRepo(item: RepoListItem): Promise<void> {
    this.pinnedReposUpdated = true;
    this.pinnedReposProps.repos = this.pinnedReposProps.repos.filter(pinnedRepo => pinnedRepo.key !== item.key);
    this.unpinnedReposProps.repos = this.calculateUnpinnedRepos();
    this.triggerRender();
  }

  private async refreshManageReposComponent(): Promise<void> {
    await this.refreshPinnedRepoListItems();
    this.refreshBranchesForPinnedRepos();
    this.refreshUnpinnedRepoListItems();
  }

  private async refreshPinnedRepoListItems(): Promise<void> {
    this.pinnedReposProps.repos = [];
    this.triggerRender();

    try {
      const response = await this.junoClient.getPinnedRepos(
        this.container.notebookManager?.gitHubOAuthService.getTokenObservable()()?.scope
      );
      if (response.status !== HttpStatusCodes.OK && response.status !== HttpStatusCodes.NoContent) {
        throw new Error(`Received HTTP ${response.status} when fetching pinned repos`);
      }

      if (response.data) {
        const pinnedRepos = response.data.map(
          pinnedRepo =>
            ({
              key: GitHubUtils.toRepoFullName(pinnedRepo.owner, pinnedRepo.name),
              branches: pinnedRepo.branches,
              repo: JunoUtils.toGitHubRepo(pinnedRepo)
            } as RepoListItem)
        );

        this.pinnedReposProps.repos = pinnedRepos;
        this.triggerRender();
      }
    } catch (error) {
      const message = `Failed to fetch pinned repos: ${error}`;
      Logger.logError(message, "GitHubReposPane/refreshPinnedReposListItems");
      NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, message);
    }
  }

  private refreshBranchesForPinnedRepos(): void {
    this.pinnedReposProps.repos.map(item => {
      if (!this.branchesProps[item.key]) {
        this.branchesProps[item.key] = {
          branches: [],
          lastPageInfo: undefined,
          hasMore: true,
          isLoading: true,
          loadMore: (): Promise<void> => this.loadMoreBranches(item.repo)
        };
        this.loadMoreBranches(item.repo);
      }
    });
  }

  private async refreshUnpinnedRepoListItems(): Promise<void> {
    this.allGitHubRepos = [];
    this.allGitHubReposLastPageInfo = undefined;
    this.unpinnedReposProps.repos = [];
    this.loadMoreUnpinnedRepos();
  }

  private connectToGitHub(scope: string): void {
    this.isExecuting(true);
    TelemetryProcessor.trace(Action.NotebooksGitHubAuthorize, ActionModifiers.Mark, {
      databaseAccountName: this.container.databaseAccount() && this.container.databaseAccount().name,
      defaultExperience: this.container.defaultExperience && this.container.defaultExperience(),
      dataExplorerArea: Areas.Notebook,
      scopesSelected: scope
    });
    this.container.notebookManager?.gitHubOAuthService.startOAuth(scope);
  }

  private triggerRender(): void {
    this.gitHubReposAdapter.triggerRender();
  }
}
