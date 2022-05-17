import { Callout, DirectionalHint, ICalloutProps, ILinkProps, Link, Stack, Text } from "@fluentui/react";
import { useTeachingBubble } from "hooks/useTeachingBubble";
import * as React from "react";
import shallow from "zustand/shallow";
import CosmosDBIcon from "../../../images/Azure-Cosmos-DB.svg";
import DeleteIcon from "../../../images/delete.svg";
import GalleryIcon from "../../../images/GalleryIcon.svg";
import FileIcon from "../../../images/notebook/file-cosmos.svg";
import CopyIcon from "../../../images/notebook/Notebook-copy.svg";
import NewNotebookIcon from "../../../images/notebook/Notebook-new.svg";
import NotebookIcon from "../../../images/notebook/Notebook-resource.svg";
import PublishIcon from "../../../images/notebook/publish_content.svg";
import RefreshIcon from "../../../images/refresh-cosmos.svg";
import CollectionIcon from "../../../images/tree-collection.svg";
import { Areas, ConnectionStatusType, Notebook } from "../../Common/Constants";
import { isPublicInternetAccessAllowed } from "../../Common/DatabaseAccountUtility";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { useSidePanel } from "../../hooks/useSidePanel";
import { useTabs } from "../../hooks/useTabs";
import { LocalStorageUtility, StorageKey } from "../../Shared/StorageUtility";
import { Action, ActionModifiers, Source } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../UserContext";
import { isServerlessAccount } from "../../Utils/CapabilityUtils";
import * as GitHubUtils from "../../Utils/GitHubUtils";
import * as ResourceTreeContextMenuButtonFactory from "../ContextMenuButtonFactory";
import { AccordionComponent, AccordionItemComponent } from "../Controls/Accordion/AccordionComponent";
import { useDialog } from "../Controls/Dialog";
import { TreeComponent, TreeNode, TreeNodeMenuItem } from "../Controls/TreeComponent/TreeComponent";
import Explorer from "../Explorer";
import { useCommandBar } from "../Menus/CommandBar/CommandBarComponentAdapter";
import { mostRecentActivity } from "../MostRecentActivity/MostRecentActivity";
import { NotebookContentItem, NotebookContentItemType } from "../Notebook/NotebookContentItem";
import { NotebookUtil } from "../Notebook/NotebookUtil";
import { useNotebook } from "../Notebook/useNotebook";
import { GitHubReposPanel } from "../Panes/GitHubReposPanel/GitHubReposPanel";
import TabsBase from "../Tabs/TabsBase";
import { useDatabases } from "../useDatabases";
import { useSelectedNode } from "../useSelectedNode";
import StoredProcedure from "./StoredProcedure";
import Trigger from "./Trigger";
import UserDefinedFunction from "./UserDefinedFunction";

export const MyNotebooksTitle = "My Notebooks";
export const GitHubReposTitle = "GitHub repos";

interface ResourceTreeProps {
  container: Explorer;
}

export const ResourceTree: React.FC<ResourceTreeProps> = ({ container }: ResourceTreeProps): JSX.Element => {
  const databases = useDatabases((state) => state.databases);
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
  const { activeTab, refreshActiveTab } = useTabs();
  const showScriptNodes = userContext.apiType === "SQL" || userContext.apiType === "Gremlin";
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

    if (!useNotebook.getState().isPhoenixNotebooks) {
      notebooksTree.children.push(buildNotebooksTemporarilyDownTree());
    } else {
      if (galleryContentRoot) {
        notebooksTree.children.push(buildGalleryNotebooksTree());
      }

      if (
        myNotebooksContentRoot &&
        useNotebook.getState().isPhoenixNotebooks &&
        useNotebook.getState().connectionInfo.status === ConnectionStatusType.Connected
      ) {
        notebooksTree.children.push(buildMyNotebooksTree());
      }
      if (container.notebookManager?.gitHubOAuthService.isLoggedIn()) {
        // collapse all other notebook nodes
        notebooksTree.children.forEach((node) => (node.isExpanded = false));
        notebooksTree.children.push(buildGitHubNotebooksTree(true));
      }
    }
    return notebooksTree;
  };

  const buildNotebooksTemporarilyDownTree = (): TreeNode => {
    return {
      label: Notebook.temporarilyDownMsg,
      className: "clickDisabled",
    };
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
        container.openNotebook(item);
      }
    );

    myNotebooksTree.isExpanded = true;
    myNotebooksTree.isAlphaSorted = true;
    // Remove "Delete" menu item from context menu
    myNotebooksTree.contextMenu = myNotebooksTree.contextMenu.filter((menuItem) => menuItem.label !== "Delete");
    return myNotebooksTree;
  };

  const buildGitHubNotebooksTree = (isConnected: boolean): TreeNode => {
    const gitHubNotebooksTree: TreeNode = buildNotebookDirectoryNode(
      gitHubNotebooksContentRoot,
      (item: NotebookContentItem) => {
        container.openNotebook(item);
      },
      true
    );
    const manageGitContextMenu: TreeNodeMenuItem[] = [
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
    gitHubNotebooksTree.contextMenu = manageGitContextMenu;
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

    if (item.type === NotebookContentItemType.Notebook && userContext.features.publicGallery) {
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

    //disallow renaming of temporary notebook workspace
    if (item?.path === useNotebook.getState().notebookBasePath) {
      items = items.filter((item) => item.label !== "Rename");
    }

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

  const buildDataTree = (): TreeNode => {
    const databaseTreeNodes: TreeNode[] = databases.map((database: ViewModels.Database) => {
      const databaseNode: TreeNode = {
        label: database.id(),
        iconSrc: CosmosDBIcon,
        isExpanded: database.isDatabaseExpanded(),
        className: "databaseHeader",
        children: [],
        isSelected: () => useSelectedNode.getState().isDataNodeSelected(database.id()),
        contextMenu: ResourceTreeContextMenuButtonFactory.createDatabaseContextMenu(container, database.id()),
        onClick: async (isExpanded) => {
          useSelectedNode.getState().setSelectedNode(database);
          // Rewritten version of expandCollapseDatabase():
          if (isExpanded) {
            database.collapseDatabase();
          } else {
            if (databaseNode.children?.length === 0) {
              databaseNode.isLoading = true;
            }
            await database.expandDatabase();
          }
          databaseNode.isLoading = false;
          useCommandBar.getState().setContextButtons([]);
          refreshActiveTab((tab: TabsBase) => tab.collection?.databaseId === database.id());
        },
        onContextMenuOpen: () => useSelectedNode.getState().setSelectedNode(database),
      };

      if (database.isDatabaseShared()) {
        databaseNode.children.push({
          id: database.id() === "SampleDB" ? "sampleScaleSettings" : "",
          label: "Scale",
          isSelected: () =>
            useSelectedNode
              .getState()
              .isDataNodeSelected(database.id(), undefined, [ViewModels.CollectionTabKind.DatabaseSettingsV2]),
          onClick: database.onSettingsClick.bind(database),
        });
      }

      // Find collections
      database
        .collections()
        .forEach((collection: ViewModels.Collection) =>
          databaseNode.children.push(buildCollectionNode(database, collection))
        );

      database.collections.subscribe((collections: ViewModels.Collection[]) => {
        collections.forEach((collection: ViewModels.Collection) =>
          databaseNode.children.push(buildCollectionNode(database, collection))
        );
      });

      return databaseNode;
    });

    return {
      label: undefined,
      isExpanded: true,
      children: databaseTreeNodes,
    };
  };

  const buildCollectionNode = (database: ViewModels.Database, collection: ViewModels.Collection): TreeNode => {
    const children: TreeNode[] = [];
    children.push({
      label: collection.getLabel(),
      id: collection.databaseId === "SampleDB" && collection.id() === "SampleContainer" ? "sampleItems" : "",
      onClick: () => {
        collection.openTab();
        // push to most recent
        mostRecentActivity.collectionWasOpened(userContext.databaseAccount?.id, collection);
      },
      isSelected: () =>
        useSelectedNode
          .getState()
          .isDataNodeSelected(collection.databaseId, collection.id(), [
            ViewModels.CollectionTabKind.Documents,
            ViewModels.CollectionTabKind.Graph,
          ]),
      contextMenu: ResourceTreeContextMenuButtonFactory.createCollectionContextMenuButton(container, collection),
    });

    if (
      isNotebookEnabled &&
      userContext.apiType === "Mongo" &&
      isPublicInternetAccessAllowed() &&
      useNotebook.getState().isPhoenixFeatures
    ) {
      children.push({
        label: "Schema (Preview)",
        onClick: collection.onSchemaAnalyzerClick.bind(collection),
        isSelected: () =>
          useSelectedNode
            .getState()
            .isDataNodeSelected(collection.databaseId, collection.id(), [ViewModels.CollectionTabKind.SchemaAnalyzer]),
      });
    }

    if (userContext.apiType !== "Cassandra" || !isServerlessAccount()) {
      children.push({
        id:
          collection.databaseId === "SampleDB" && collection.id() === "SampleContainer" && !database.isDatabaseShared()
            ? "sampleScaleSettings"
            : "",
        label: database.isDatabaseShared() || isServerlessAccount() ? "Settings" : "Scale & Settings",
        onClick: collection.onSettingsClick.bind(collection),
        isSelected: () =>
          useSelectedNode
            .getState()
            .isDataNodeSelected(collection.databaseId, collection.id(), [
              ViewModels.CollectionTabKind.CollectionSettingsV2,
            ]),
      });
    }

    const schemaNode: TreeNode = buildSchemaNode(collection);
    if (schemaNode) {
      children.push(schemaNode);
    }

    if (showScriptNodes) {
      children.push(buildStoredProcedureNode(collection));
      children.push(buildUserDefinedFunctionsNode(collection));
      children.push(buildTriggerNode(collection));
    }

    // This is a rewrite of showConflicts
    const showConflicts =
      userContext?.databaseAccount?.properties.enableMultipleWriteLocations &&
      collection.rawDataModel &&
      !!collection.rawDataModel.conflictResolutionPolicy;

    if (showConflicts) {
      children.push({
        label: "Conflicts",
        onClick: collection.onConflictsClick.bind(collection),
        isSelected: () =>
          useSelectedNode
            .getState()
            .isDataNodeSelected(collection.databaseId, collection.id(), [ViewModels.CollectionTabKind.Conflicts]),
      });
    }

    return {
      label: collection.id(),
      iconSrc: CollectionIcon,
      isExpanded: collection.isCollectionExpanded(),
      children: children,
      className: "collectionHeader",
      contextMenu: ResourceTreeContextMenuButtonFactory.createCollectionContextMenuButton(container, collection),
      onClick: () => {
        // Rewritten version of expandCollapseCollection
        useSelectedNode.getState().setSelectedNode(collection);
        useCommandBar.getState().setContextButtons([]);
        refreshActiveTab(
          (tab: TabsBase) =>
            tab.collection?.id() === collection.id() && tab.collection.databaseId === collection.databaseId
        );
      },
      onExpanded: () => {
        // TODO: For testing purpose only, remove after
        if (collection.databaseId === "SampleDB" && collection.id() === "SampleContainer") {
          useTeachingBubble.getState().setIsSampleDBExpanded(true);
        }
        if (showScriptNodes) {
          collection.loadStoredProcedures();
          collection.loadUserDefinedFunctions();
          collection.loadTriggers();
        }
      },
      isSelected: () => useSelectedNode.getState().isDataNodeSelected(collection.databaseId, collection.id()),
      onContextMenuOpen: () => useSelectedNode.getState().setSelectedNode(collection),
    };
  };

  const buildStoredProcedureNode = (collection: ViewModels.Collection): TreeNode => {
    return {
      label: "Stored Procedures",
      children: collection.storedProcedures().map((sp: StoredProcedure) => ({
        label: sp.id(),
        onClick: sp.open.bind(sp),
        isSelected: () =>
          useSelectedNode
            .getState()
            .isDataNodeSelected(collection.databaseId, collection.id(), [
              ViewModels.CollectionTabKind.StoredProcedures,
            ]),
        contextMenu: ResourceTreeContextMenuButtonFactory.createStoreProcedureContextMenuItems(container, sp),
      })),
      onClick: async () => {
        await collection.loadStoredProcedures();
        collection.selectedSubnodeKind(ViewModels.CollectionTabKind.StoredProcedures);
        refreshActiveTab(
          (tab: TabsBase) =>
            tab.collection?.id() === collection.id() && tab.collection.databaseId === collection.databaseId
        );
      },
    };
  };

  const buildUserDefinedFunctionsNode = (collection: ViewModels.Collection): TreeNode => {
    return {
      label: "User Defined Functions",
      children: collection.userDefinedFunctions().map((udf: UserDefinedFunction) => ({
        label: udf.id(),
        onClick: udf.open.bind(udf),
        isSelected: () =>
          useSelectedNode
            .getState()
            .isDataNodeSelected(collection.databaseId, collection.id(), [
              ViewModels.CollectionTabKind.UserDefinedFunctions,
            ]),
        contextMenu: ResourceTreeContextMenuButtonFactory.createUserDefinedFunctionContextMenuItems(container, udf),
      })),
      onClick: async () => {
        await collection.loadUserDefinedFunctions();
        collection.selectedSubnodeKind(ViewModels.CollectionTabKind.UserDefinedFunctions);
        refreshActiveTab(
          (tab: TabsBase) =>
            tab.collection?.id() === collection.id() && tab.collection.databaseId === collection.databaseId
        );
      },
    };
  };

  const buildTriggerNode = (collection: ViewModels.Collection): TreeNode => {
    return {
      label: "Triggers",
      children: collection.triggers().map((trigger: Trigger) => ({
        label: trigger.id(),
        onClick: trigger.open.bind(trigger),
        isSelected: () =>
          useSelectedNode
            .getState()
            .isDataNodeSelected(collection.databaseId, collection.id(), [ViewModels.CollectionTabKind.Triggers]),
        contextMenu: ResourceTreeContextMenuButtonFactory.createTriggerContextMenuItems(container, trigger),
      })),
      onClick: async () => {
        await collection.loadTriggers();
        collection.selectedSubnodeKind(ViewModels.CollectionTabKind.Triggers);
        refreshActiveTab(
          (tab: TabsBase) =>
            tab.collection?.id() === collection.id() && tab.collection.databaseId === collection.databaseId
        );
      },
    };
  };

  const buildSchemaNode = (collection: ViewModels.Collection): TreeNode => {
    if (collection.analyticalStorageTtl() === undefined) {
      return undefined;
    }

    if (!collection.schema || !collection.schema.fields) {
      return undefined;
    }

    return {
      label: "Schema",
      children: getSchemaNodes(collection.schema.fields),
      onClick: () => {
        collection.selectedSubnodeKind(ViewModels.CollectionTabKind.Schema);
        refreshActiveTab((tab: TabsBase) => tab.collection && tab.collection.rid === collection.rid);
      },
    };
  };

  const getSchemaNodes = (fields: DataModels.IDataField[]): TreeNode[] => {
    const schema: any = {};

    //unflatten
    fields.forEach((field: DataModels.IDataField) => {
      const path: string[] = field.path.split(".");
      const fieldProperties = [field.dataType.name, `HasNulls: ${field.hasNulls}`];
      let current: any = {};
      path.forEach((name: string, pathIndex: number) => {
        if (pathIndex === 0) {
          if (schema[name] === undefined) {
            if (pathIndex === path.length - 1) {
              schema[name] = fieldProperties;
            } else {
              schema[name] = {};
            }
          }
          current = schema[name];
        } else {
          if (current[name] === undefined) {
            if (pathIndex === path.length - 1) {
              current[name] = fieldProperties;
            } else {
              current[name] = {};
            }
          }
          current = current[name];
        }
      });
    });

    const traverse = (obj: any): TreeNode[] => {
      const children: TreeNode[] = [];

      if (obj !== undefined && !Array.isArray(obj) && typeof obj === "object") {
        Object.entries(obj).forEach(([key, value]) => {
          children.push({ label: key, children: traverse(value) });
        });
      } else if (Array.isArray(obj)) {
        return [{ label: obj[0] }, { label: obj[1] }];
      }

      return children;
    };

    return traverse(schema);
  };

  const loadSubitems = async (item: NotebookContentItem, isGithubTree?: boolean): Promise<void> => {
    const updatedItem = await container.notebookManager?.notebookContentClient?.updateItemChildren(item);
    updateNotebookItem(updatedItem, isGithubTree);
  };

  const dataRootNode = buildDataTree();

  if (isNotebookEnabled) {
    return (
      <>
        <AccordionComponent>
          <AccordionItemComponent title={"DATA"} isExpanded={!gitHubNotebooksContentRoot}>
            <TreeComponent className="dataResourceTree" rootNode={dataRootNode} />
          </AccordionItemComponent>
          <AccordionItemComponent title={"NOTEBOOKS"}>
            <TreeComponent className="notebookResourceTree" rootNode={buildNotebooksTree()} />
          </AccordionItemComponent>
        </AccordionComponent>

        {buildGalleryCallout()}
      </>
    );
  }

  return <TreeComponent className="dataResourceTree" rootNode={dataRootNode} />;
};
