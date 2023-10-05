import React from "react";
import { Areas, HttpStatusCodes } from "../../../Common/Constants";
import { handleError } from "../../../Common/ErrorHandlingUtils";
import { GitHubClient, IGitHubPageInfo, IGitHubRepo } from "../../../GitHub/GitHubClient";
import { useSidePanel } from "../../../hooks/useSidePanel";
import { IPinnedRepo, JunoClient } from "../../../Juno/JunoClient";
import { Action, ActionModifiers } from "../../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";
import * as GitHubUtils from "../../../Utils/GitHubUtils";
import * as JunoUtils from "../../../Utils/JunoUtils";
import { AuthorizeAccessComponent } from "../../Controls/GitHub/AuthorizeAccessComponent";
import {
  GitHubReposComponent,
  GitHubReposComponentProps,
  RepoListItem,
} from "../../Controls/GitHub/GitHubReposComponent";
import { ContentMainStyle } from "../../Controls/GitHub/GitHubStyleConstants";
import { BranchesProps, PinnedReposProps, UnpinnedReposProps } from "../../Controls/GitHub/ReposListComponent";
import Explorer from "../../Explorer";
import { PanelInfoErrorComponent } from "../PanelInfoErrorComponent";
import { PanelLoadingScreen } from "../PanelLoadingScreen";

interface IGitHubReposPanelProps {
  explorer: Explorer;
  gitHubClientProp: GitHubClient;
  junoClientProp: JunoClient;
}

interface IGitHubReposPanelState {
  showAuthorizationAcessState: boolean;
  isExecuting: boolean;
  errorMessage: string;
  showErrorDetails: boolean;
  gitHubReposState: GitHubReposComponentProps;
}
export class GitHubReposPanel extends React.Component<IGitHubReposPanelProps, IGitHubReposPanelState> {
  private static readonly PageSize = 30;
  private static readonly MasterBranchName = "master";
  private static readonly MainBranchName = "main";

  private isAddedRepo = false;
  private gitHubClient: GitHubClient;
  private junoClient: JunoClient;

  private branchesProps: Record<string, BranchesProps>;
  private pinnedReposProps: PinnedReposProps;
  private unpinnedReposProps: UnpinnedReposProps;

  private allGitHubRepos: IGitHubRepo[];
  private allGitHubReposLastPageInfo?: IGitHubPageInfo;
  private pinnedReposUpdated: boolean;

  constructor(props: IGitHubReposPanelProps) {
    super(props);

    this.unpinnedReposProps = {
      repos: [],
      hasMore: true,
      isLoading: true,
      loadMore: (): Promise<void> => this.loadMoreUnpinnedRepos(),
    };
    this.branchesProps = {};
    this.pinnedReposProps = {
      repos: [],
    };

    this.allGitHubRepos = [];
    this.allGitHubReposLastPageInfo = undefined;
    this.pinnedReposUpdated = false;

    this.state = {
      showAuthorizationAcessState: true,
      isExecuting: false,
      errorMessage: "",
      showErrorDetails: false,
      gitHubReposState: {
        showAuthorizeAccess: !this.props.explorer.notebookManager?.gitHubOAuthService.isLoggedIn(),
        authorizeAccessProps: {
          scope: this.getOAuthScope(),
          authorizeAccess: (scope): void => this.connectToGitHub(scope),
        },
        reposListProps: {
          branchesProps: this.branchesProps,
          pinnedReposProps: this.pinnedReposProps,
          unpinnedReposProps: this.unpinnedReposProps,
          pinRepo: (item): Promise<void> => this.pinRepo(item),
          unpinRepo: (item): Promise<void> => this.unpinRepo(item),
        },
        addRepoProps: {
          container: this.props.explorer,
          getRepo: (owner, repo): Promise<IGitHubRepo> => this.getRepo(owner, repo),
          pinRepo: (item): Promise<void> => this.pinRepo(item),
        },
        resetConnection: (): void => this.setup(true),
        onOkClick: (): Promise<void> => this.submit(),
        onCancelClick: (): void => useSidePanel.getState().closeSidePanel(),
      },
    };
    this.gitHubClient = this.props.gitHubClientProp;
    this.junoClient = this.props.junoClientProp;
  }

  componentDidMount(): void {
    this.open();
  }

  public open(): void {
    this.resetData();
    this.setup();
  }

  public async submit(): Promise<void> {
    const pinnedReposUpdated = this.pinnedReposUpdated;
    const reposToPin: IPinnedRepo[] = this.pinnedReposProps.repos.map((repo) => JunoUtils.toPinnedRepo(repo));

    if (pinnedReposUpdated) {
      try {
        const response = await this.junoClient.updatePinnedRepos(reposToPin);
        if (response.status !== HttpStatusCodes.OK) {
          throw new Error(`Received HTTP ${response.status} when saving pinned repos`);
        }

        this.props.explorer.notebookManager?.refreshPinnedRepos();
      } catch (error) {
        handleError(error, "GitHubReposPane/submit", "Failed to save pinned repos");
      }
    }
    useSidePanel.getState().closeSidePanel();
  }

  public resetData(): void {
    this.branchesProps = {};

    this.pinnedReposProps.repos = [];
    this.unpinnedReposProps.repos = [];
    this.allGitHubRepos = [];
    this.allGitHubReposLastPageInfo = undefined;

    this.pinnedReposUpdated = false;
    this.unpinnedReposProps.hasMore = true;
    this.unpinnedReposProps.isLoading = true;
  }

  private getOAuthScope(): string {
    return (
      this.props.explorer.notebookManager?.gitHubOAuthService.getTokenObservable()()?.scope ||
      AuthorizeAccessComponent.Scopes.Public.key
    );
  }

  private setup(forceShowConnectToGitHub = false): void {
    forceShowConnectToGitHub || !this.props.explorer.notebookManager?.gitHubOAuthService.isLoggedIn()
      ? this.setupForConnectToGitHub(forceShowConnectToGitHub)
      : this.setupForManageRepos();
  }

  private setupForConnectToGitHub(forceShowConnectToGitHub: boolean): void {
    if (forceShowConnectToGitHub) {
      const newState = { ...this.state.gitHubReposState };
      newState.showAuthorizeAccess = forceShowConnectToGitHub;
      this.setState({
        gitHubReposState: newState,
      });
    }
    this.setState({
      isExecuting: false,
    });
  }

  private async setupForManageRepos(): Promise<void> {
    this.setState({
      isExecuting: false,
    });
    TelemetryProcessor.trace(Action.NotebooksGitHubManageRepo, ActionModifiers.Mark, {
      dataExplorerArea: Areas.Notebook,
    });

    this.refreshManageReposComponent();
  }

  private calculateUnpinnedRepos(): RepoListItem[] {
    const unpinnedGitHubRepos = this.allGitHubRepos.filter(
      (gitHubRepo) =>
        this.pinnedReposProps.repos.findIndex(
          (pinnedRepo) => pinnedRepo.key === GitHubUtils.toRepoFullName(gitHubRepo.owner, gitHubRepo.name),
        ) === -1,
    );
    return unpinnedGitHubRepos.map((gitHubRepo) => ({
      key: GitHubUtils.toRepoFullName(gitHubRepo.owner, gitHubRepo.name),
      repo: gitHubRepo,
      branches: [],
    }));
  }

  private async loadMoreBranches(repo: IGitHubRepo): Promise<void> {
    const branchesProps = this.branchesProps[GitHubUtils.toRepoFullName(repo.owner, repo.name)];
    branchesProps.hasMore = true;
    branchesProps.isLoading = true;

    try {
      const response = await this.gitHubClient.getBranchesAsync(
        repo.owner,
        repo.name,
        GitHubReposPanel.PageSize,
        branchesProps.lastPageInfo?.endCursor,
      );

      if (response.status !== HttpStatusCodes.OK) {
        throw new Error(`Received HTTP ${response.status} when fetching branches`);
      }

      if (response.data) {
        branchesProps.branches = branchesProps.branches.concat(response.data);
        branchesProps.lastPageInfo = response.pageInfo;
        branchesProps.defaultBranchName = branchesProps.branches[0].name;
        const defaultbranchName = branchesProps.branches.find(
          (branch) =>
            branch.name === GitHubReposPanel.MasterBranchName || branch.name === GitHubReposPanel.MainBranchName,
        )?.name;
        if (defaultbranchName) {
          branchesProps.defaultBranchName = defaultbranchName;
        }
      }
    } catch (error) {
      handleError(error, "GitHubReposPane/loadMoreBranches", "Failed to fetch branches");
    }

    branchesProps.isLoading = false;
    branchesProps.hasMore = branchesProps.lastPageInfo?.hasNextPage;
    this.setState({
      gitHubReposState: {
        ...this.state.gitHubReposState,
        reposListProps: {
          ...this.state.gitHubReposState.reposListProps,
          branchesProps: {
            ...this.state.gitHubReposState.reposListProps.branchesProps,
            [GitHubUtils.toRepoFullName(repo.owner, repo.name)]: branchesProps,
          },
          pinnedReposProps: {
            repos: this.pinnedReposProps.repos,
          },
          unpinnedReposProps: {
            ...this.state.gitHubReposState.reposListProps.unpinnedReposProps,
            repos: this.unpinnedReposProps.repos,
          },
        },
      },
    });
  }

  private async loadMoreUnpinnedRepos(): Promise<void> {
    this.unpinnedReposProps.isLoading = true;
    this.unpinnedReposProps.hasMore = true;

    try {
      const response = await this.gitHubClient.getReposAsync(
        GitHubReposPanel.PageSize,
        this.allGitHubReposLastPageInfo?.endCursor,
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
      handleError(error, "GitHubReposPane/loadMoreUnpinnedRepos", "Failed to fetch unpinned repos");
    }

    this.unpinnedReposProps.isLoading = false;
    this.unpinnedReposProps.hasMore = this.allGitHubReposLastPageInfo?.hasNextPage;

    this.setState({
      gitHubReposState: {
        ...this.state.gitHubReposState,
        reposListProps: {
          ...this.state.gitHubReposState.reposListProps,
          unpinnedReposProps: {
            ...this.state.gitHubReposState.reposListProps.unpinnedReposProps,
            isLoading: this.unpinnedReposProps.isLoading,
            hasMore: this.unpinnedReposProps.hasMore,
            repos: this.unpinnedReposProps.repos,
          },
        },
      },
    });
  }

  private async getRepo(owner: string, repo: string): Promise<IGitHubRepo> {
    try {
      const response = await this.gitHubClient.getRepoAsync(owner, repo);
      if (response.status !== HttpStatusCodes.OK) {
        throw new Error(`Received HTTP ${response.status} when fetching repo`);
      }
      this.isAddedRepo = true;
      return response.data;
    } catch (error) {
      handleError(error, "GitHubReposPane/getRepo", "Failed to fetch repo");
      return Promise.resolve(undefined);
    }
  }

  private async pinRepo(item: RepoListItem): Promise<void> {
    this.pinnedReposUpdated = true;
    const initialReposLength = this.pinnedReposProps.repos.length;

    const existingRepo = this.pinnedReposProps.repos.find((repo) => repo.key === item.key);
    if (existingRepo) {
      existingRepo.branches = item.branches;
      this.setState({
        gitHubReposState: {
          ...this.state.gitHubReposState,
          reposListProps: {
            ...this.state.gitHubReposState.reposListProps,
            pinnedReposProps: {
              repos: this.pinnedReposProps.repos,
            },
          },
        },
      });
    } else {
      this.pinnedReposProps.repos = [...this.pinnedReposProps.repos, item];
    }

    this.unpinnedReposProps.repos = this.calculateUnpinnedRepos();

    if (this.pinnedReposProps.repos.length > initialReposLength) {
      this.refreshBranchesForPinnedRepos();
    }
  }

  private async unpinRepo(item: RepoListItem): Promise<void> {
    this.pinnedReposUpdated = true;
    this.pinnedReposProps.repos = this.pinnedReposProps.repos.filter((pinnedRepo) => pinnedRepo.key !== item.key);
    this.unpinnedReposProps.repos = this.calculateUnpinnedRepos();

    this.setState({
      gitHubReposState: {
        ...this.state.gitHubReposState,
        reposListProps: {
          ...this.state.gitHubReposState.reposListProps,
          pinnedReposProps: {
            repos: this.pinnedReposProps.repos,
          },
          unpinnedReposProps: {
            ...this.state.gitHubReposState.reposListProps.unpinnedReposProps,
            repos: this.unpinnedReposProps.repos,
          },
        },
      },
    });
  }

  private async refreshManageReposComponent(): Promise<void> {
    await this.refreshPinnedRepoListItems();
    this.refreshBranchesForPinnedRepos();
    this.refreshUnpinnedRepoListItems();
  }

  private async refreshPinnedRepoListItems(): Promise<void> {
    this.pinnedReposProps.repos = [];

    try {
      const response = await this.junoClient.getPinnedRepos(
        this.props.explorer.notebookManager?.gitHubOAuthService.getTokenObservable()()?.scope,
      );

      if (response.status !== HttpStatusCodes.OK && response.status !== HttpStatusCodes.NoContent) {
        throw new Error(`Received HTTP ${response.status} when fetching pinned repos`);
      }

      if (response.data) {
        const pinnedRepos = response.data.map(
          (pinnedRepo) =>
            ({
              key: GitHubUtils.toRepoFullName(pinnedRepo.owner, pinnedRepo.name),
              branches: pinnedRepo.branches,
              repo: JunoUtils.toGitHubRepo(pinnedRepo),
            }) as RepoListItem,
        );

        this.pinnedReposProps.repos = pinnedRepos;
      }
    } catch (error) {
      handleError(error, "GitHubReposPane/refreshPinnedReposListItems", "Failed to fetch pinned repos");
    }
  }

  private refreshBranchesForPinnedRepos(): void {
    this.pinnedReposProps.repos.map((item) => {
      if (!this.branchesProps[item.key]) {
        this.branchesProps[item.key] = {
          branches: [],
          lastPageInfo: undefined,
          hasMore: true,
          isLoading: true,
          defaultBranchName: undefined,
          loadMore: (): Promise<void> => this.loadMoreBranches(item.repo),
        };
        this.loadMoreBranches(item.repo);
      }
    });

    this.setState({
      gitHubReposState: {
        ...this.state.gitHubReposState,
        reposListProps: {
          ...this.state.gitHubReposState.reposListProps,
          branchesProps: {
            ...this.branchesProps,
          },
          pinnedReposProps: {
            repos: this.pinnedReposProps.repos,
          },
          unpinnedReposProps: {
            ...this.state.gitHubReposState.reposListProps.unpinnedReposProps,
            repos: this.unpinnedReposProps.repos,
          },
        },
      },
    });
    this.isAddedRepo = false;
  }

  private async refreshUnpinnedRepoListItems(): Promise<void> {
    this.allGitHubRepos = [];
    this.allGitHubReposLastPageInfo = undefined;
    this.unpinnedReposProps.repos = [];

    this.loadMoreUnpinnedRepos();
  }

  private connectToGitHub(scope: string): void {
    this.setState({
      isExecuting: true,
    });
    TelemetryProcessor.trace(Action.NotebooksGitHubAuthorize, ActionModifiers.Mark, {
      dataExplorerArea: Areas.Notebook,
      scopesSelected: scope,
    });
    this.props.explorer.notebookManager?.gitHubOAuthService.startOAuth(scope);
  }

  render(): JSX.Element {
    return (
      <form className="panelFormWrapper">
        {this.state.errorMessage && (
          <PanelInfoErrorComponent
            message={this.state.errorMessage}
            messageType="error"
            showErrorDetails={this.state.showErrorDetails}
          />
        )}
        <div className="panelMainContent" style={ContentMainStyle}>
          <GitHubReposComponent {...this.state.gitHubReposState} />
        </div>

        {this.state.isExecuting && <PanelLoadingScreen />}
      </form>
    );
  }
}
