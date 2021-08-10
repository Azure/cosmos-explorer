import { Callout, DirectionalHint, ICalloutProps, ILinkProps, Link, Stack, Text } from "@fluentui/react";
import * as React from "react";
import shallow from "zustand/shallow";
import DeleteIcon from "../../../images/delete.svg";
import GalleryIcon from "../../../images/GalleryIcon.svg";
import FileIcon from "../../../images/notebook/file-cosmos.svg";
import CopyIcon from "../../../images/notebook/Notebook-copy.svg";
import NewNotebookIcon from "../../../images/notebook/Notebook-new.svg";
import NotebookIcon from "../../../images/notebook/Notebook-resource.svg";
import PublishIcon from "../../../images/notebook/publish_content.svg";
import RefreshIcon from "../../../images/refresh-cosmos.svg";
import { Areas } from "../../Common/Constants";
import * as ViewModels from "../../Contracts/ViewModels";
import { useSidePanel } from "../../hooks/useSidePanel";
import { useTabs } from "../../hooks/useTabs";
import { LocalStorageUtility, StorageKey } from "../../Shared/StorageUtility";
import { Action, ActionModifiers, Source } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../UserContext";
import * as GitHubUtils from "../../Utils/GitHubUtils";
import { AccordionItemComponent } from "../Controls/Accordion/AccordionComponent";
import { useDialog } from "../Controls/Dialog";
import { TreeComponent, TreeNode, TreeNodeMenuItem } from "../Controls/TreeComponent/TreeComponent";
import Explorer from "../Explorer";
import { mostRecentActivity } from "../MostRecentActivity/MostRecentActivity";
import { NotebookContentItem, NotebookContentItemType } from "../Notebook/NotebookContentItem";
import { NotebookUtil } from "../Notebook/NotebookUtil";
import { useNotebook } from "../Notebook/useNotebook";
import { GitHubReposPanel } from "../Panes/GitHubReposPanel/GitHubReposPanel";

export const MyNotebooksTitle = "My Notebooks";
export const GitHubReposTitle = "GitHub repos";

interface NotebooksResourceTreeProps {
  container: Explorer;
}

export const NotebooksResourceTree: React.FC<NotebooksResourceTreeProps> = ({
  container,
}: NotebooksResourceTreeProps): JSX.Element => {
  const {
    isNotebookEnabled,
    myNotebooksContentRoot,
    galleryContentRoot,
    gitHubNotebooksContentRoot,
    updateNotebookItem,
  } = useNotebook(
    (state) => ({
      isNotebookEnabled: state.isNotebookEnabled,
      myNotebooksContentRoot: state.myNotebooksContentRoot,
      galleryContentRoot: state.galleryContentRoot,
      gitHubNotebooksContentRoot: state.gitHubNotebooksContentRoot,
      updateNotebookItem: state.updateNotebookItem,
    }),
    shallow
  );
  const activeTab = useTabs((state) => state.activeTab);
  const pseudoDirPath = "PsuedoDir";

  const buildGalleryCallout = (): JSX.Element => {
    if (
      LocalStorageUtility.hasItem(StorageKey.GalleryCalloutDismissed) &&
      LocalStorageUtility.getEntryBoolean(StorageKey.GalleryCalloutDismissed)
    ) {
      return undefined;
    }

    const calloutProps: ICalloutProps = {
      calloutMaxWidth: 350,
      ariaLabel: "New gallery",
      role: "alertdialog",
      gapSpace: 0,
      target: ".galleryHeader",
      directionalHint: DirectionalHint.leftTopEdge,
      onDismiss: () => {
        LocalStorageUtility.setEntryBoolean(StorageKey.GalleryCalloutDismissed, true);
      },
      setInitialFocus: true,
    };

    const openGalleryProps: ILinkProps = {
      onClick: () => {
        LocalStorageUtility.setEntryBoolean(StorageKey.GalleryCalloutDismissed, true);
        container.openGallery();
      },
    };

    return (
      <Callout {...calloutProps}>
        <Stack tokens={{ childrenGap: 10, padding: 20 }}>
          <Text variant="xLarge" block>
            New gallery
          </Text>
          <Text block>
            Sample notebooks are now combined in gallery. View and try out samples provided by Microsoft and other
            contributors.
          </Text>
          <Link {...openGalleryProps}>Open gallery</Link>
        </Stack>
      </Callout>
    );
  };

  const buildNotebooksTree = (): TreeNode => {
    const notebooksTree: TreeNode = {
      label: undefined,
      isExpanded: true,
      children: [],
    };

    if (galleryContentRoot) {
      notebooksTree.children.push(buildGalleryNotebooksTree());
    }

    if (myNotebooksContentRoot) {
      notebooksTree.children.push(buildMyNotebooksTree());
    }

    if (container.notebookManager?.gitHubOAuthService.isLoggedIn()) {
      // collapse all other notebook nodes
      notebooksTree.children.forEach((node) => (node.isExpanded = false));
      notebooksTree.children.push(buildGitHubNotebooksTree());
    }

    return notebooksTree;
  };

  const buildGalleryNotebooksTree = (): TreeNode => {
    return {
      label: "Gallery",
      iconSrc: GalleryIcon,
      className: "notebookHeader galleryHeader",
      onClick: () => container.openGallery(),
      isSelected: () => activeTab?.tabKind === ViewModels.CollectionTabKind.Gallery,
    };
  };

  const buildMyNotebooksTree = (): TreeNode => {
    const myNotebooksTree: TreeNode = buildNotebookDirectoryNode(
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

  const buildGitHubNotebooksTree = (): TreeNode => {
    const gitHubNotebooksTree: TreeNode = buildNotebookDirectoryNode(
      gitHubNotebooksContentRoot,
      (item: NotebookContentItem) => {
        container.openNotebook(item).then((hasOpened) => {
          if (hasOpened) {
            mostRecentActivity.notebookWasItemOpened(userContext.databaseAccount?.id, item);
          }
        });
      },
      true
    );

    gitHubNotebooksTree.contextMenu = [
      {
        label: "Manage GitHub settings",
        onClick: () =>
          useSidePanel
            .getState()
            .openSidePanel(
              "Manage GitHub settings",
              <GitHubReposPanel
                explorer={container}
                gitHubClientProp={container.notebookManager.gitHubClient}
                junoClientProp={container.notebookManager.junoClient}
              />
            ),
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
    item: NotebookContentItem,
    onFileClick: (item: NotebookContentItem) => void,
    isGithubTree?: boolean
  ): TreeNode[] => {
    if (!item || !item.children) {
      return [];
    } else {
      return item.children.map((item) => {
        const result =
          item.type === NotebookContentItemType.Directory
            ? buildNotebookDirectoryNode(item, onFileClick, isGithubTree)
            : buildNotebookFileNode(item, onFileClick, isGithubTree);
        result.timestamp = item.timestamp;
        return result;
      });
    }
  };

  const buildNotebookFileNode = (
    item: NotebookContentItem,
    onFileClick: (item: NotebookContentItem) => void,
    isGithubTree?: boolean
  ): TreeNode => {
    return {
      label: item.name,
      iconSrc: NotebookUtil.isNotebookFile(item.path) ? NotebookIcon : FileIcon,
      className: "notebookHeader",
      onClick: () => onFileClick(item),
      isSelected: () => {
        return (
          activeTab &&
          activeTab.tabKind === ViewModels.CollectionTabKind.NotebookV2 &&
          /* TODO Redesign Tab interface so that resource tree doesn't need to know about NotebookV2Tab.
                     NotebookV2Tab could be dynamically imported, but not worth it to just get this type right.
                   */
          (activeTab as any).notebookPath() === item.path
        );
      },
      contextMenu: createFileContextMenu(container, item, isGithubTree),
      data: item,
    };
  };

  const createFileContextMenu = (
    container: Explorer,
    item: NotebookContentItem,
    isGithubTree?: boolean
  ): TreeNodeMenuItem[] => {
    let items: TreeNodeMenuItem[] = [
      {
        label: "Rename",
        iconSrc: NotebookIcon,
        onClick: () => container.renameNotebook(item, isGithubTree),
      },
      {
        label: "Delete",
        iconSrc: DeleteIcon,
        onClick: () => {
          useDialog
            .getState()
            .showOkCancelModalDialog(
              "Confirm delete",
              `Are you sure you want to delete "${item.name}"`,
              "Delete",
              () => container.deleteNotebookFile(item, isGithubTree),
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

  const createDirectoryContextMenu = (
    container: Explorer,
    item: NotebookContentItem,
    isGithubTree?: boolean
  ): TreeNodeMenuItem[] => {
    let items: TreeNodeMenuItem[] = [
      {
        label: "Refresh",
        iconSrc: RefreshIcon,
        onClick: () => loadSubitems(item, isGithubTree),
      },
      {
        label: "Delete",
        iconSrc: DeleteIcon,
        onClick: () => {
          useDialog
            .getState()
            .showOkCancelModalDialog(
              "Confirm delete",
              `Are you sure you want to delete "${item.name}?"`,
              "Delete",
              () => container.deleteNotebookFile(item, isGithubTree),
              "Cancel",
              undefined
            );
        },
      },
      {
        label: "Rename",
        iconSrc: NotebookIcon,
        onClick: () => container.renameNotebook(item, isGithubTree),
      },
      {
        label: "New Directory",
        iconSrc: NewNotebookIcon,
        onClick: () => container.onCreateDirectory(item, isGithubTree),
      },
      {
        label: "New Notebook",
        iconSrc: NewNotebookIcon,
        onClick: () => container.onNewNotebookClicked(item, isGithubTree),
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
    item: NotebookContentItem,
    onFileClick: (item: NotebookContentItem) => void,
    isGithubTree?: boolean
  ): TreeNode => {
    return {
      label: item.name,
      iconSrc: undefined,
      className: "notebookHeader",
      isAlphaSorted: true,
      isLeavesParentsSeparate: true,
      onClick: () => {
        if (!item.children) {
          loadSubitems(item, isGithubTree);
        }
      },
      isSelected: () => {
        return (
          activeTab &&
          activeTab.tabKind === ViewModels.CollectionTabKind.NotebookV2 &&
          /* TODO Redesign Tab interface so that resource tree doesn't need to know about NotebookV2Tab.
                     NotebookV2Tab could be dynamically imported, but not worth it to just get this type right.
                   */
          (activeTab as any).notebookPath() === item.path
        );
      },
      contextMenu: item.path !== pseudoDirPath ? createDirectoryContextMenu(container, item, isGithubTree) : undefined,
      data: item,
      children: buildChildNodes(item, onFileClick, isGithubTree),
    };
  };

  const loadSubitems = async (item: NotebookContentItem, isGithubTree?: boolean): Promise<void> => {
    const updatedItem = await container.notebookManager?.notebookContentClient?.updateItemChildren(item);
    updateNotebookItem(updatedItem, isGithubTree);
  };

  return isNotebookEnabled ? (
    <AccordionItemComponent title={"NOTEBOOKS"}>
      <TreeComponent className="notebookResourceTree" rootNode={buildNotebooksTree()} />
      {buildGalleryCallout()}
    </AccordionItemComponent>
  ) : (
    <></>
  );
};
