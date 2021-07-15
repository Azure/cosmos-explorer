import { cloneDeep } from "lodash";
import create, { SetState, UseStore } from "zustand";
import DeleteIcon from "../../../images/delete.svg";
import GalleryIcon from "../../../images/GalleryIcon.svg";
import FileIcon from "../../../images/notebook/file-cosmos.svg";
import CopyIcon from "../../../images/notebook/Notebook-copy.svg";
import NewNotebookIcon from "../../../images/notebook/Notebook-new.svg";
import NotebookIcon from "../../../images/notebook/Notebook-resource.svg";
import PublishIcon from "../../../images/notebook/publish_content.svg";
import RefreshIcon from "../../../images/refresh-cosmos.svg";
import { Areas } from "../Common/Constants";
import * as ViewModels from "../Contracts/ViewModels";
import { TreeNode, TreeNodeMenuItem } from "../Explorer/Controls/TreeComponent/TreeComponent";
import Explorer from "../Explorer/Explorer";
import { mostRecentActivity } from "../Explorer/MostRecentActivity/MostRecentActivity";
import { NotebookContentItem, NotebookContentItemType } from "../Explorer/Notebook/NotebookContentItem";
import { NotebookUtil } from "../Explorer/Notebook/NotebookUtil";
import { useNotebook } from "../Explorer/Notebook/useNotebook";
import { Action, ActionModifiers, Source } from "../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../UserContext";
import * as GitHubUtils from "../Utils/GitHubUtils";

export const MyNotebooksTitle = "My Notebooks";
export const GitHubReposTitle = "GitHub repos";
const PseudoDirPath = "PsuedoDir";

interface ResourceTreeState {
  myNotebooksContentRoot: NotebookContentItem;
  gitHubNotebooksContentRoot: NotebookContentItem;
  notebooksTree: TreeNode;
  buildNotebooksTree: (container: Explorer) => void;
  deleteNode: (item: NotebookContentItem) => void;
  findNode: (item: NotebookContentItem, rootNode: TreeNode) => TreeNode;
}

export const useResourceTree: UseStore<ResourceTreeState> = create((set, get) => ({
  myNotebooksContentRoot: undefined,
  gitHubNotebooksContentRoot: undefined,
  notebooksTree: undefined,
  buildNotebooksTree: (container: Explorer) => buildNotebooksTree(container, set),
  deleteNode: (item: NotebookContentItem) => {
    const notebooksTree = get().notebooksTree;
    const parentNode = get().findNode(item.parent, notebooksTree);
    parentNode.children = parentNode.children.filter((node) => node.data?.path !== item.path);
    set({ notebooksTree: cloneDeep(notebooksTree) });
  },
  findNode: (item: NotebookContentItem, rootNode: TreeNode) => {
    const currentNode = rootNode || get().notebooksTree;

    if (currentNode) {
      if (currentNode.data?.path === item.path) {
        return currentNode;
      }

      for (let childNode of currentNode.children) {
        const node = get().findNode(item, childNode);
        if (node) {
          return node;
        }
      }
    }

    return undefined;
  },
}));

const buildNotebooksTree = (container: Explorer, set: SetState<ResourceTreeState>): void => {
  const notebooksTree: TreeNode = {
    label: undefined,
    isExpanded: true,
    children: [],
  };

  notebooksTree.children.push(buildGalleryNotebooksTree(container));
  notebooksTree.children.push(buildMyNotebooksTree(container));

  if (container.notebookManager?.gitHubOAuthService.isLoggedIn()) {
    // collapse all other notebook nodes
    notebooksTree.children.forEach((node) => (node.isExpanded = false));
    notebooksTree.children.push(buildGitHubNotebooksTree(container));
  }

  set({ notebooksTree: notebooksTree });
};

const buildGalleryNotebooksTree = (container: Explorer): TreeNode => {
  return {
    label: "Gallery",
    iconSrc: GalleryIcon,
    className: "notebookHeader galleryHeader",
    onClick: () => container.openGallery(),
    isSelected: () => {
      const activeTab = container.tabsManager.activeTab();
      return activeTab && activeTab.tabKind === ViewModels.CollectionTabKind.Gallery;
    },
  };
};

const buildMyNotebooksTree = (container: Explorer): TreeNode => {
  const myNotebooksContentRoot: NotebookContentItem = {
    name: MyNotebooksTitle,
    path: useNotebook.getState().notebookBasePath,
    type: NotebookContentItemType.Directory,
  };

  const myNotebooksTree: TreeNode = buildNotebookDirectoryNode(
    container,
    myNotebooksContentRoot,
    (item: NotebookContentItem) => {
      container.openNotebook(item).then((hasOpened) => {
        if (hasOpened) {
          mostRecentActivity.notebookWasItemOpened(userContext.databaseAccount?.id, item);
        }
      });
    }
  );

  myNotebooksTree.isExpanded = true;
  myNotebooksTree.isAlphaSorted = true;
  // Remove "Delete" menu item from context menu
  myNotebooksTree.contextMenu = myNotebooksTree.contextMenu.filter((menuItem) => menuItem.label !== "Delete");
  return myNotebooksTree;
};

const buildGitHubNotebooksTree = (container: Explorer): TreeNode => {
  const gitHubNotebooksContentRoot = {
    name: GitHubReposTitle,
    path: PseudoDirPath,
    type: NotebookContentItemType.Directory,
  };

  const gitHubNotebooksTree: TreeNode = buildNotebookDirectoryNode(
    container,
    gitHubNotebooksContentRoot,
    (item: NotebookContentItem) => {
      container.openNotebook(item).then((hasOpened) => {
        if (hasOpened) {
          mostRecentActivity.notebookWasItemOpened(userContext.databaseAccount?.id, item);
        }
      });
    }
  );

  gitHubNotebooksTree.contextMenu = [
    {
      label: "Manage GitHub settings",
      onClick: () => container.openGitHubReposPanel("Manage GitHub settings"),
    },
    {
      label: "Disconnect from GitHub",
      onClick: () => {
        TelemetryProcessor.trace(Action.NotebooksGitHubDisconnect, ActionModifiers.Mark, {
          dataExplorerArea: Areas.Notebook,
        });
        container.notebookManager?.gitHubOAuthService.logout();
      },
    },
  ];

  gitHubNotebooksTree.isExpanded = true;
  gitHubNotebooksTree.isAlphaSorted = true;

  return gitHubNotebooksTree;
};

const buildChildNodes = (
  container: Explorer,
  item: NotebookContentItem,
  onFileClick: (item: NotebookContentItem) => void
): TreeNode[] => {
  if (!item || !item.children) {
    return [];
  } else {
    return item.children.map((item) => {
      const result =
        item.type === NotebookContentItemType.Directory
          ? buildNotebookDirectoryNode(container, item, onFileClick)
          : buildNotebookFileNode(container, item, onFileClick);
      result.timestamp = item.timestamp;
      return result;
    });
  }
};

const buildNotebookFileNode = (
  container: Explorer,
  item: NotebookContentItem,
  onFileClick: (item: NotebookContentItem) => void
): TreeNode => {
  return {
    label: item.name,
    iconSrc: NotebookUtil.isNotebookFile(item.path) ? NotebookIcon : FileIcon,
    className: "notebookHeader",
    onClick: () => onFileClick(item),
    isSelected: () => {
      const activeTab = container.tabsManager.activeTab();
      return (
        activeTab &&
        activeTab.tabKind === ViewModels.CollectionTabKind.NotebookV2 &&
        /* TODO Redesign Tab interface so that resource tree doesn't need to know about NotebookV2Tab.
                   NotebookV2Tab could be dynamically imported, but not worth it to just get this type right.
                 */
        (activeTab as any).notebookPath() === item.path
      );
    },
    contextMenu: createFileContextMenu(container, item),
    data: item,
  };
};

const createFileContextMenu = (container: Explorer, item: NotebookContentItem): TreeNodeMenuItem[] => {
  let items: TreeNodeMenuItem[] = [
    {
      label: "Rename",
      iconSrc: NotebookIcon,
      onClick: () => container.renameNotebook(item),
    },
    {
      label: "Delete",
      iconSrc: DeleteIcon,
      onClick: () => {
        container.showOkCancelModalDialog(
          "Confirm delete",
          `Are you sure you want to delete "${item.name}"`,
          "Delete",
          () => container.deleteNotebookFile(item),
          "Cancel",
          undefined
        );
      },
    },
    {
      label: "Copy to ...",
      iconSrc: CopyIcon,
      onClick: () => copyNotebook(container, item),
    },
    {
      label: "Download",
      iconSrc: NotebookIcon,
      onClick: () => container.downloadFile(item),
    },
  ];

  if (item.type === NotebookContentItemType.Notebook) {
    items.push({
      label: "Publish to gallery",
      iconSrc: PublishIcon,
      onClick: async () => {
        TelemetryProcessor.trace(Action.NotebooksGalleryClickPublishToGallery, ActionModifiers.Mark, {
          source: Source.ResourceTreeMenu,
        });

        const content = await container.readFile(item);
        if (content) {
          await container.publishNotebook(item.name, content);
        }
      },
    });
  }

  // "Copy to ..." isn't needed if github locations are not available
  if (!container.notebookManager?.gitHubOAuthService.isLoggedIn()) {
    items = items.filter((item) => item.label !== "Copy to ...");
  }

  return items;
};

const copyNotebook = async (container: Explorer, item: NotebookContentItem) => {
  const content = await container.readFile(item);
  if (content) {
    container.copyNotebook(item.name, content);
  }
};

const createDirectoryContextMenu = (container: Explorer, item: NotebookContentItem): TreeNodeMenuItem[] => {
  let items: TreeNodeMenuItem[] = [
    {
      label: "Refresh",
      iconSrc: RefreshIcon,
      onClick: () => container.refreshContentItem(item).then(() => triggerRender()),
    },
    {
      label: "Delete",
      iconSrc: DeleteIcon,
      onClick: () => {
        container.showOkCancelModalDialog(
          "Confirm delete",
          `Are you sure you want to delete "${item.name}?"`,
          "Delete",
          () => container.deleteNotebookFile(item).then(() => triggerRender()),
          "Cancel",
          undefined
        );
      },
    },
    {
      label: "Rename",
      iconSrc: NotebookIcon,
      onClick: () => container.renameNotebook(item),
    },
    {
      label: "New Directory",
      iconSrc: NewNotebookIcon,
      onClick: () => container.onCreateDirectory(item),
    },
    {
      label: "New Notebook",
      iconSrc: NewNotebookIcon,
      onClick: () => container.onNewNotebookClicked(item),
    },
    {
      label: "Upload File",
      iconSrc: NewNotebookIcon,
      onClick: () => container.openUploadFilePanel(item),
    },
  ];

  // For GitHub paths remove "Delete", "Rename", "New Directory", "Upload File"
  if (GitHubUtils.fromContentUri(item.path)) {
    items = items.filter(
      (item) =>
        item.label !== "Delete" &&
        item.label !== "Rename" &&
        item.label !== "New Directory" &&
        item.label !== "Upload File"
    );
  }

  return items;
};

const buildNotebookDirectoryNode = (
  container: Explorer,
  item: NotebookContentItem,
  onFileClick: (item: NotebookContentItem) => void
): TreeNode => {
  return {
    label: item.name,
    iconSrc: undefined,
    className: "notebookHeader",
    isAlphaSorted: true,
    isLeavesParentsSeparate: true,
    onClick: () => {
      if (!item.children) {
        container.refreshContentItem(item).then(() => triggerRender());
      }
    },
    isSelected: () => {
      const activeTab = container.tabsManager.activeTab();
      return (
        activeTab &&
        activeTab.tabKind === ViewModels.CollectionTabKind.NotebookV2 &&
        /* TODO Redesign Tab interface so that resource tree doesn't need to know about NotebookV2Tab.
                   NotebookV2Tab could be dynamically imported, but not worth it to just get this type right.
                 */
        (activeTab as any).notebookPath() === item.path
      );
    },
    contextMenu: item.path !== PseudoDirPath ? createDirectoryContextMenu(container, item) : undefined,
    data: item,
    children: buildChildNodes(container, item, onFileClick),
  };
};
