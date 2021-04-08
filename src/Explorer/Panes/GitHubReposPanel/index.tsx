import { useBoolean } from "@uifabric/react-hooks";
import React, { FunctionComponent, useEffect, useState } from "react";
import { Areas, HttpStatusCodes } from "../../../Common/Constants";
import { handleError } from "../../../Common/ErrorHandlingUtils";
import { GitHubClient, IGitHubPageInfo, IGitHubRepo } from "../../../GitHub/GitHubClient";
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
import { GitHubReposComponentAdapter } from "../../Controls/GitHub/GitHubReposComponentAdapter";
import { BranchesProps, PinnedReposProps, UnpinnedReposProps } from "../../Controls/GitHub/ReposListComponent";
import Explorer from "../../Explorer";
import { GenericRightPaneComponent, GenericRightPaneProps } from "../GenericRightPaneComponent";

// import * as ViewModels from "../../../Contracts/ViewModels";
// import { GitHubReposComponentProps, RepoListItem } from "../../Controls/GitHub/GitHubReposComponent";
interface IGitHubReposPanelProps {
  explorer: Explorer;
  closePanel: () => void;
  gitHubClientProp: GitHubClient;
  junoClientProp: JunoClient;
  panelTitle: string;
}

export const GitHubReposPanel: FunctionComponent<IGitHubReposPanelProps> = ({
  explorer,
  closePanel,
  gitHubClientProp,
  junoClientProp,
  panelTitle,
}: IGitHubReposPanelProps): JSX.Element => {
  const title = panelTitle;
  const [isLoading, { setTrue: setLoadingTrue, setFalse: setLoadingFalse }] = useBoolean(false);
  const [formError, setFormError] = useState<string>("");
  const [formErrorsDetails, setFormErrorsDetails] = useState<string>("");
  const genericPaneProps: GenericRightPaneProps = {
    container: explorer,
    formError: formError,
    formErrorDetail: formErrorsDetails,
    id: "gitHubReposPanel",
    isExecuting: isLoading,
    title: title,
    submitButtonText: "",
    onClose: () => closePanel(),
    onSubmit: undefined,
    isFooterHidden: true,
  };

  const PageSize = 30;

  const gitHubClient: GitHubClient = gitHubClientProp;
  const junoClient: JunoClient = junoClientProp;

  const branchesProps: Record<string, BranchesProps> = {};
  const pinnedReposProps: PinnedReposProps = {
    repos: [],
  };
  const unpinnedReposProps: UnpinnedReposProps = {
    repos: [],
    hasMore: true,
    isLoading: true,
    loadMore: (): Promise<void> => loadMoreUnpinnedRepos(),
  };

  const getOAuthScope = (): string => {
    return (
      explorer.notebookManager?.gitHubOAuthService.getTokenObservable()()?.scope ||
      AuthorizeAccessComponent.Scopes.Public.key
    );
  };

  const gitHubReposProps: GitHubReposComponentProps = {
    showAuthorizeAccess: true,
    authorizeAccessProps: {
      scope: getOAuthScope(),
      authorizeAccess: (scope): void => connectToGitHub(scope),
    },
    reposListProps: {
      branchesProps: branchesProps,
      pinnedReposProps: pinnedReposProps,
      unpinnedReposProps: unpinnedReposProps,
      pinRepo: (item): Promise<void> => pinRepo(item),
      unpinRepo: (item): Promise<void> => unpinRepo(item),
    },
    addRepoProps: {
      container: explorer,
      getRepo: (owner, repo): Promise<IGitHubRepo> => getRepo(owner, repo),
      pinRepo: (item): Promise<void> => pinRepo(item),
    },
    resetConnection: (): void => setup(true),
    onOkClick: (): Promise<void> => submit(),
    onCancelClick: (): void => closePanel(),
  };
  const gitHubReposAdapter: GitHubReposComponentAdapter = new GitHubReposComponentAdapter(gitHubReposProps);
  const [allGitHubRepos, setAllGitHubRepos] = useState<IGitHubRepo[]>([]);
  const [allGitHubReposLastPageInfo, setAllGitHubReposLastPageInfo] = useState<IGitHubPageInfo>(undefined);
  const [pinnedReposUpdatedState, setPinnedReposUpdated] = useState(false);

  useEffect(() => {
    resetData();
    setup();
  }, []);

  const submit = async (): Promise<void> => {
    setFormError("");
    setFormErrorsDetails("");

    const pinnedReposUpdated = pinnedReposUpdatedState;
    const reposToPin: IPinnedRepo[] = pinnedReposProps.repos.map((repo) => JunoUtils.toPinnedRepo(repo));

    if (pinnedReposUpdated) {
      try {
        const response = await junoClient.updatePinnedRepos(reposToPin);
        if (response.status !== HttpStatusCodes.OK) {
          throw new Error(`Received HTTP ${response.status} when saving pinned repos`);
        }
      } catch (error) {
        handleError(error, "GitHubReposPane/submit", "Failed to save pinned repos");
      }
    }
  };

  const resetData = (): void => {
    // Reset cached branches
    gitHubReposProps.reposListProps.branchesProps = branchesProps;

    // Reset cached pinned and unpinned repos
    pinnedReposProps.repos = [];
    unpinnedReposProps.repos = [];

    // Reset cached repos
    setAllGitHubRepos([]);
    setAllGitHubReposLastPageInfo(undefined);

    // Reset flags
    setPinnedReposUpdated(false);
    unpinnedReposProps.hasMore = true;
    unpinnedReposProps.isLoading = true;

    triggerRender();
  };

  const setup = (forceShowConnectToGitHub = false): void => {
    //eslint-disable-next-line
    console.log("setup > ", forceShowConnectToGitHub);

    forceShowConnectToGitHub || !explorer.notebookManager?.gitHubOAuthService.isLoggedIn()
      ? setupForConnectToGitHub()
      : setupForManageRepos();
  };

  const setupForConnectToGitHub = (): void => {
    //eslint-disable-next-line
    console.log("setupForConnectToGitHub");
    gitHubReposProps.showAuthorizeAccess = false;
    gitHubReposProps.authorizeAccessProps.scope = getOAuthScope();
    setLoadingFalse();
    // setTitle(GitHubReposComponent.ConnectToGitHubTitle); // Used for telemetry
    triggerRender();
  };

  const setupForManageRepos = async (): Promise<void> => {
    //eslint-disable-next-line
    console.log("setupForManageRepos");

    gitHubReposProps.showAuthorizeAccess = true;
    setLoadingFalse();
    // setTitle(GitHubReposComponent.ManageGitHubRepoTitle);
    TelemetryProcessor.trace(Action.NotebooksGitHubManageRepo, ActionModifiers.Mark, {
      dataExplorerArea: Areas.Notebook,
    });
    triggerRender();

    refreshManageReposComponent();
  };

  const calculateUnpinnedRepos = (): RepoListItem[] => {
    const unpinnedGitHubRepos = allGitHubRepos.filter(
      (gitHubRepo) =>
        pinnedReposProps.repos.findIndex(
          (pinnedRepo) => pinnedRepo.key === GitHubUtils.toRepoFullName(gitHubRepo.owner, gitHubRepo.name)
        ) === -1
    );
    return unpinnedGitHubRepos.map((gitHubRepo) => ({
      key: GitHubUtils.toRepoFullName(gitHubRepo.owner, gitHubRepo.name),
      repo: gitHubRepo,
      branches: [],
    }));
  };

  const loadMoreBranches = async (repo: IGitHubRepo): Promise<void> => {
    const branchesPropsLoadMore = branchesProps[GitHubUtils.toRepoFullName(repo.owner, repo.name)];
    branchesPropsLoadMore.hasMore = true;
    branchesPropsLoadMore.isLoading = true;
    triggerRender();

    try {
      const response = await gitHubClient.getBranchesAsync(
        repo.owner,
        repo.name,
        PageSize,
        branchesPropsLoadMore.lastPageInfo?.endCursor
      );
      if (response.status !== HttpStatusCodes.OK) {
        throw new Error(`Received HTTP ${response.status} when fetching branches`);
      }

      if (response.data) {
        branchesPropsLoadMore.branches = branchesPropsLoadMore.branches.concat(response.data);
        branchesPropsLoadMore.lastPageInfo = response.pageInfo;
      }
    } catch (error) {
      handleError(error, "GitHubReposPane/loadMoreBranches", "Failed to fetch branches");
    }

    branchesPropsLoadMore.isLoading = false;
    branchesPropsLoadMore.hasMore = branchesPropsLoadMore.lastPageInfo?.hasNextPage;
    triggerRender();
  };

  const loadMoreUnpinnedRepos = async (): Promise<void> => {
    unpinnedReposProps.isLoading = true;
    unpinnedReposProps.hasMore = true;
    triggerRender();

    try {
      const response = await gitHubClient.getReposAsync(PageSize, allGitHubReposLastPageInfo?.endCursor);
      if (response.status !== HttpStatusCodes.OK) {
        throw new Error(`Received HTTP ${response.status} when fetching unpinned repos`);
      }

      if (response.data) {
        setAllGitHubRepos(allGitHubRepos.concat(response.data));
        setAllGitHubReposLastPageInfo(response.pageInfo);
        unpinnedReposProps.repos = calculateUnpinnedRepos();
      }
    } catch (error) {
      handleError(error, "GitHubReposPane/loadMoreUnpinnedRepos", "Failed to fetch unpinned repos");
    }

    unpinnedReposProps.isLoading = false;
    unpinnedReposProps.hasMore = allGitHubReposLastPageInfo?.hasNextPage;
    triggerRender();
  };

  const getRepo = async (owner: string, repo: string): Promise<IGitHubRepo> => {
    try {
      const response = await gitHubClient.getRepoAsync(owner, repo);
      if (response.status !== HttpStatusCodes.OK) {
        throw new Error(`Received HTTP ${response.status} when fetching repo`);
      }

      return response.data;
    } catch (error) {
      handleError(error, "GitHubReposPane/getRepo", "Failed to fetch repo");
      return Promise.resolve(undefined);
    }
  };

  const pinRepo = async (item: RepoListItem): Promise<void> => {
    setPinnedReposUpdated(true);
    const initialReposLength = pinnedReposProps.repos.length;

    const existingRepo = pinnedReposProps.repos.find((repo) => repo.key === item.key);
    if (existingRepo) {
      existingRepo.branches = item.branches;
    } else {
      pinnedReposProps.repos = [...pinnedReposProps.repos, item];
    }

    unpinnedReposProps.repos = calculateUnpinnedRepos();
    triggerRender();

    if (pinnedReposProps.repos.length > initialReposLength) {
      refreshBranchesForPinnedRepos();
    }
  };

  const unpinRepo = async (item: RepoListItem): Promise<void> => {
    setPinnedReposUpdated(true);
    pinnedReposProps.repos = pinnedReposProps.repos.filter((pinnedRepo) => pinnedRepo.key !== item.key);
    unpinnedReposProps.repos = calculateUnpinnedRepos();
    triggerRender();
  };

  const refreshManageReposComponent = async (): Promise<void> => {
    await refreshPinnedRepoListItems();
    refreshBranchesForPinnedRepos();
    refreshUnpinnedRepoListItems();
  };

  const refreshPinnedRepoListItems = async (): Promise<void> => {
    pinnedReposProps.repos = [];
    triggerRender();

    try {
      const response = await junoClient.getPinnedRepos(
        explorer.notebookManager?.gitHubOAuthService.getTokenObservable()()?.scope
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
            } as RepoListItem)
        );

        pinnedReposProps.repos = pinnedRepos;
        triggerRender();
      }
    } catch (error) {
      handleError(error, "GitHubReposPane/refreshPinnedReposListItems", "Failed to fetch pinned repos");
    }
  };

  const refreshBranchesForPinnedRepos = (): void => {
    pinnedReposProps.repos.map((item) => {
      if (!branchesProps[item.key]) {
        branchesProps[item.key] = {
          branches: [],
          lastPageInfo: undefined,
          hasMore: true,
          isLoading: true,
          loadMore: (): Promise<void> => loadMoreBranches(item.repo),
        };
        loadMoreBranches(item.repo);
      }
    });
  };

  const refreshUnpinnedRepoListItems = async (): Promise<void> => {
    setAllGitHubRepos([]);
    setAllGitHubReposLastPageInfo(undefined);
    unpinnedReposProps.repos = [];
    loadMoreUnpinnedRepos();
  };

  const connectToGitHub = (scope: string): void => {
    setLoadingTrue();
    TelemetryProcessor.trace(Action.NotebooksGitHubAuthorize, ActionModifiers.Mark, {
      dataExplorerArea: Areas.Notebook,
      scopesSelected: scope,
    });
    explorer.notebookManager?.gitHubOAuthService.startOAuth(scope);
  };

  const triggerRender = (): void => {
    gitHubReposAdapter.triggerRender();
  };

  return (
    <GenericRightPaneComponent {...genericPaneProps}>
      <div className="panelFormWrapper">
        <div className="panelMainContent">
          <GitHubReposComponent {...gitHubReposProps} />
        </div>
      </div>
    </GenericRightPaneComponent>
  );
};
