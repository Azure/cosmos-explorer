import { useState } from "react";
import { Notebook } from "../Common/Constants";
import Explorer from "../Explorer/Explorer";
import { NotebookContentItem, NotebookContentItemType } from "../Explorer/Notebook/NotebookContentItem";
import { IPinnedRepo } from "../Juno/JunoClient";
import { Action, ActionModifiers } from "../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../Shared/Telemetry/TelemetryProcessor";
import * as GitHubUtils from "../Utils/GitHubUtils";

export const DataTitle = "DATA";
export const NotebooksTitle = "NOTEBOOKS";
export const PseudoDirPath = "PseudoDir";

export interface NotebookHooks {
  lastRefreshTime: number;
  galleryContentRoot: NotebookContentItem;
  myNotebooksContentRoot: NotebookContentItem;
  gitHubNotebooksContentRoot: NotebookContentItem;

  refreshList: () => void;
  initializeGitHubRepos: (pinnedRepos: IPinnedRepo[]) => void;
  getMyNotebooksContentRoot: () => NotebookContentItem;
}

export const useNotebooks = (context: { container: Explorer }): NotebookHooks => {
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(undefined);
  const [galleryContentRoot, setGalleryContentRoot] = useState<NotebookContentItem>(undefined);
  const [myNotebooksContentRoot, setMyNotebooksContentRoot] = useState<NotebookContentItem>(undefined);
  const [gitHubNotebooksContentRoot, setGitHubNotebooksContentRoot] = useState<NotebookContentItem>(undefined);

  const refreshList = (): void => {
    initialize();
    setLastRefreshTime(new Date().getTime());
  };

  // TODO For now, we need to rely on this, as setMyNotebooksContentRoot() is not synchronous
  let _myNotebooksContentRoot: NotebookContentItem = undefined;
  const _setMyNotebooksContentRoot = (newValue: NotebookContentItem) => {
    _myNotebooksContentRoot = newValue;
    setMyNotebooksContentRoot(newValue);
  };

  const initialize = (): Promise<void[]> => {
    const refreshTasks: Promise<void>[] = [];

    setGalleryContentRoot({
      name: "Gallery",
      path: "Gallery",
      type: NotebookContentItemType.File,
    });

    const _myNotebooksContentRoot = {
      name: Notebook.MyNotebooksTitle,
      path: context.container.getNotebookBasePath(),
      type: NotebookContentItemType.Directory,
    };
    _setMyNotebooksContentRoot(_myNotebooksContentRoot);

    // Only if notebook server is available we can refresh
    if (context.container.notebookServerInfo().notebookServerEndpoint) {
      refreshTasks.push(
        context.container.refreshContentItem(_myNotebooksContentRoot).then((root) => {
          _setMyNotebooksContentRoot({ ...root });
          traceMyNotebookTreeInfo(root);
        })
      );
    }

    initializeGitHubNotebooksContentRoot();
    return Promise.all(refreshTasks);
  };

  const traceMyNotebookTreeInfo = (myNotebooksTree: NotebookContentItem) => {
    if (myNotebooksTree.children) {
      // Count 1st generation children (tree is lazy-loaded)
      const nodeCounts = { files: 0, notebooks: 0, directories: 0 };
      myNotebooksTree.children.forEach((treeNode) => {
        switch ((treeNode as NotebookContentItem).type) {
          case NotebookContentItemType.File:
            nodeCounts.files++;
            break;
          case NotebookContentItemType.Directory:
            nodeCounts.directories++;
            break;
          case NotebookContentItemType.Notebook:
            nodeCounts.notebooks++;
            break;
          default:
            break;
        }
      });
      TelemetryProcessor.trace(Action.RefreshResourceTreeMyNotebooks, ActionModifiers.Mark, { ...nodeCounts });
    }
  };

  const initializeGitHubNotebooksContentRoot = (): NotebookContentItem => {
    let root: NotebookContentItem = undefined;

    if (context.container.notebookManager?.gitHubOAuthService.isLoggedIn()) {
      root = {
        name: Notebook.GitHubReposTitle,
        path: PseudoDirPath,
        type: NotebookContentItemType.Directory,
      };
    }
    setGitHubNotebooksContentRoot(root);
    return root;
  };

  const initializeGitHubRepos = (pinnedRepos: IPinnedRepo[]): void => {
    const _gitHubNotebooksContentRoot = initializeGitHubNotebooksContentRoot();

    if (_gitHubNotebooksContentRoot) {
      _gitHubNotebooksContentRoot.children = [];

      pinnedRepos?.forEach((pinnedRepo) => {
        const repoFullName = GitHubUtils.toRepoFullName(pinnedRepo.owner, pinnedRepo.name);
        const repoTreeItem: NotebookContentItem = {
          name: repoFullName,
          path: PseudoDirPath,
          type: NotebookContentItemType.Directory,
          children: [],
        };

        pinnedRepo.branches.forEach((branch) => {
          repoTreeItem.children.push({
            name: branch.name,
            path: GitHubUtils.toContentUri(pinnedRepo.owner, pinnedRepo.name, branch.name, ""),
            type: NotebookContentItemType.Directory,
          });
        });

        _gitHubNotebooksContentRoot.children.push(repoTreeItem);
      });

      setGitHubNotebooksContentRoot({ ..._gitHubNotebooksContentRoot });
    }
  };

  return {
    lastRefreshTime,
    galleryContentRoot,
    myNotebooksContentRoot,
    gitHubNotebooksContentRoot,
    refreshList,
    initializeGitHubRepos,
    getMyNotebooksContentRoot: () => _myNotebooksContentRoot,
  };
};
