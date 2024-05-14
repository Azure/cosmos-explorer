import { getItemName } from "Utils/APITypeUtils";
import * as ko from "knockout";
import * as React from "react";
import CosmosDBIcon from "../../../images/Azure-Cosmos-DB.svg";
import DeleteIcon from "../../../images/delete.svg";
import CopyIcon from "../../../images/notebook/Notebook-copy.svg";
import NewNotebookIcon from "../../../images/notebook/Notebook-new.svg";
import NotebookIcon from "../../../images/notebook/Notebook-resource.svg";
import FileIcon from "../../../images/notebook/file-cosmos.svg";
import PublishIcon from "../../../images/notebook/publish_content.svg";
import RefreshIcon from "../../../images/refresh-cosmos.svg";
import CollectionIcon from "../../../images/tree-collection.svg";
import { ReactAdapter } from "../../Bindings/ReactBindingHandler";
import { isPublicInternetAccessAllowed } from "../../Common/DatabaseAccountUtility";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { IPinnedRepo } from "../../Juno/JunoClient";
import { Action, ActionModifiers, Source } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../UserContext";
import { isServerlessAccount } from "../../Utils/CapabilityUtils";
import * as GitHubUtils from "../../Utils/GitHubUtils";
import { useTabs } from "../../hooks/useTabs";
import * as ResourceTreeContextMenuButtonFactory from "../ContextMenuButtonFactory";
import { useDialog } from "../Controls/Dialog";
import { LegacyTreeComponent, LegacyTreeNode, LegacyTreeNodeMenuItem } from "../Controls/TreeComponent/LegacyTreeComponent";
import Explorer from "../Explorer";
import { useCommandBar } from "../Menus/CommandBar/CommandBarComponentAdapter";
import { mostRecentActivity } from "../MostRecentActivity/MostRecentActivity";
import { NotebookContentItem, NotebookContentItemType } from "../Notebook/NotebookContentItem";
import { NotebookUtil } from "../Notebook/NotebookUtil";
import { useNotebook } from "../Notebook/useNotebook";
import TabsBase from "../Tabs/TabsBase";
import { useDatabases } from "../useDatabases";
import { useSelectedNode } from "../useSelectedNode";
import { Platform, configContext } from "./../../ConfigContext";
import StoredProcedure from "./StoredProcedure";
import Trigger from "./Trigger";
import UserDefinedFunction from "./UserDefinedFunction";

export class ResourceTreeAdapter implements ReactAdapter {
  public static readonly MyNotebooksTitle = "My Notebooks";
  public static readonly GitHubReposTitle = "GitHub repos";

  private static readonly DataTitle = "DATA";
  private static readonly NotebooksTitle = "NOTEBOOKS";
  private static readonly PseudoDirPath = "PsuedoDir";

  public parameters: ko.Observable<number>;

  public galleryContentRoot: NotebookContentItem;
  public myNotebooksContentRoot: NotebookContentItem;
  public gitHubNotebooksContentRoot: NotebookContentItem;

  public constructor(private container: Explorer) {
    this.parameters = ko.observable(Date.now());

    useSelectedNode.subscribe(() => this.triggerRender());
    useTabs.subscribe(
      () => this.triggerRender(),
      (state) => state.activeTab,
    );
    useNotebook.subscribe(
      () => this.triggerRender(),
      (state) => state.isNotebookEnabled,
    );

    useDatabases.subscribe(() => this.triggerRender());
    this.triggerRender();
  }

  private traceMyNotebookTreeInfo() {
    const myNotebooksTree = this.myNotebooksContentRoot;
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
  }

  public renderComponent(): JSX.Element {
    const dataRootNode = this.buildDataTree();
    return <LegacyTreeComponent className="dataResourceTree" rootNode={dataRootNode} />;
  }

  public async initialize(): Promise<void[]> {
    const refreshTasks: Promise<void>[] = [];

    this.galleryContentRoot = {
      name: "Gallery",
      path: "Gallery",
      type: NotebookContentItemType.File,
    };
    this.myNotebooksContentRoot = {
      name: useNotebook.getState().notebookFolderName,
      path: useNotebook.getState().notebookBasePath,
      type: NotebookContentItemType.Directory,
    };

    // Only if notebook server is available we can refresh
    if (useNotebook.getState().notebookServerInfo?.notebookServerEndpoint) {
      refreshTasks.push(
        this.container.refreshContentItem(this.myNotebooksContentRoot).then(() => {
          this.triggerRender();
          this.traceMyNotebookTreeInfo();
        }),
      );
    }
    this.gitHubNotebooksContentRoot = {
      name: ResourceTreeAdapter.GitHubReposTitle,
      path: ResourceTreeAdapter.PseudoDirPath,
      type: NotebookContentItemType.Directory,
    };

    return Promise.all(refreshTasks);
  }

  public initializeGitHubRepos(pinnedRepos: IPinnedRepo[]): void {
    if (this.gitHubNotebooksContentRoot) {
      this.gitHubNotebooksContentRoot.children = [];
      pinnedRepos?.forEach((pinnedRepo) => {
        const repoFullName = GitHubUtils.toRepoFullName(pinnedRepo.owner, pinnedRepo.name);
        const repoTreeItem: NotebookContentItem = {
          name: repoFullName,
          path: ResourceTreeAdapter.PseudoDirPath,
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

        this.gitHubNotebooksContentRoot.children.push(repoTreeItem);
      });

      this.triggerRender();
    }
  }

  private buildDataTree(): LegacyTreeNode {
    const databaseTreeNodes: LegacyTreeNode[] = useDatabases.getState().databases.map((database: ViewModels.Database) => {
      const databaseNode: LegacyTreeNode = {
        label: database.id(),
        iconSrc: CosmosDBIcon,
        isExpanded: false,
        className: "databaseHeader",
        children: [],
        isSelected: () => useSelectedNode.getState().isDataNodeSelected(database.id()),
        contextMenu: ResourceTreeContextMenuButtonFactory.createDatabaseContextMenu(this.container, database.id()),
        onClick: async (isExpanded) => {
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
          useSelectedNode.getState().setSelectedNode(database);
          useCommandBar.getState().setContextButtons([]);
          useTabs.getState().refreshActiveTab((tab: TabsBase) => tab.collection?.databaseId === database.id());
        },
        onContextMenuOpen: () => useSelectedNode.getState().setSelectedNode(database),
      };

      if (database.isDatabaseShared()) {
        databaseNode.children.push({
          label: "Scale",
          isSelected: () =>
            useSelectedNode
              .getState()
              .isDataNodeSelected(database.id(), undefined, [ViewModels.CollectionTabKind.DatabaseSettings]),
          onClick: database.onSettingsClick.bind(database),
        });
      }

      // Find collections
      database
        .collections()
        .forEach((collection: ViewModels.Collection) =>
          databaseNode.children.push(this.buildCollectionNode(database, collection)),
        );

      database.collections.subscribe((collections: ViewModels.Collection[]) => {
        collections.forEach((collection: ViewModels.Collection) =>
          databaseNode.children.push(this.buildCollectionNode(database, collection)),
        );
      });

      return databaseNode;
    });

    return {
      label: undefined,
      isExpanded: true,
      children: databaseTreeNodes,
    };
  }

  /**
   * This is a rewrite of Collection.ts : showScriptsMenu, showStoredProcedures, showTriggers, showUserDefinedFunctions
   * @param container
   */
  private static showScriptNodes(container: Explorer): boolean {
    return (
      configContext.platform !== Platform.Fabric && (userContext.apiType === "SQL" || userContext.apiType === "Gremlin")
    );
  }

  private buildCollectionNode(database: ViewModels.Database, collection: ViewModels.Collection): LegacyTreeNode {
    const children: LegacyTreeNode[] = [];
    children.push({
      label: getItemName(),
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
      contextMenu: ResourceTreeContextMenuButtonFactory.createCollectionContextMenuButton(this.container, collection),
    });

    if (
      useNotebook.getState().isNotebookEnabled &&
      userContext.apiType === "Mongo" &&
      isPublicInternetAccessAllowed()
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
        label: database.isDatabaseShared() || isServerlessAccount() ? "Settings" : "Scale & Settings",
        onClick: collection.onSettingsClick.bind(collection),
        isSelected: () =>
          useSelectedNode
            .getState()
            .isDataNodeSelected(collection.databaseId, collection.id(), [ViewModels.CollectionTabKind.Settings]),
      });
    }

    const schemaNode: LegacyTreeNode = this.buildSchemaNode(collection);
    if (schemaNode) {
      children.push(schemaNode);
    }

    if (ResourceTreeAdapter.showScriptNodes(this.container)) {
      children.push(this.buildStoredProcedureNode(collection));
      children.push(this.buildUserDefinedFunctionsNode(collection));
      children.push(this.buildTriggerNode(collection));
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
      isExpanded: false,
      children: children,
      className: "collectionHeader",
      contextMenu: ResourceTreeContextMenuButtonFactory.createCollectionContextMenuButton(this.container, collection),
      onClick: () => {
        // Rewritten version of expandCollapseCollection
        useSelectedNode.getState().setSelectedNode(collection);
        useCommandBar.getState().setContextButtons([]);
        useTabs
          .getState()
          .refreshActiveTab(
            (tab: TabsBase) =>
              tab.collection?.id() === collection.id() && tab.collection.databaseId === collection.databaseId,
          );
      },
      onExpanded: () => {
        if (ResourceTreeAdapter.showScriptNodes(this.container)) {
          collection.loadStoredProcedures();
          collection.loadUserDefinedFunctions();
          collection.loadTriggers();
        }
      },
      isSelected: () => useSelectedNode.getState().isDataNodeSelected(collection.databaseId, collection.id()),
      onContextMenuOpen: () => useSelectedNode.getState().setSelectedNode(collection),
    };
  }

  private buildStoredProcedureNode(collection: ViewModels.Collection): LegacyTreeNode {
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
        contextMenu: ResourceTreeContextMenuButtonFactory.createStoreProcedureContextMenuItems(this.container, sp),
      })),
      onClick: () => {
        collection.selectedSubnodeKind(ViewModels.CollectionTabKind.StoredProcedures);
        useTabs
          .getState()
          .refreshActiveTab(
            (tab: TabsBase) =>
              tab.collection?.id() === collection.id() && tab.collection.databaseId === collection.databaseId,
          );
      },
    };
  }

  private buildUserDefinedFunctionsNode(collection: ViewModels.Collection): LegacyTreeNode {
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
        contextMenu: ResourceTreeContextMenuButtonFactory.createUserDefinedFunctionContextMenuItems(
          this.container,
          udf,
        ),
      })),
      onClick: () => {
        collection.selectedSubnodeKind(ViewModels.CollectionTabKind.UserDefinedFunctions);
        useTabs
          .getState()
          .refreshActiveTab(
            (tab: TabsBase) =>
              tab.collection?.id() === collection.id() && tab.collection.databaseId === collection.databaseId,
          );
      },
    };
  }

  private buildTriggerNode(collection: ViewModels.Collection): LegacyTreeNode {
    return {
      label: "Triggers",
      children: collection.triggers().map((trigger: Trigger) => ({
        label: trigger.id(),
        onClick: trigger.open.bind(trigger),
        isSelected: () =>
          useSelectedNode
            .getState()
            .isDataNodeSelected(collection.databaseId, collection.id(), [ViewModels.CollectionTabKind.Triggers]),
        contextMenu: ResourceTreeContextMenuButtonFactory.createTriggerContextMenuItems(this.container, trigger),
      })),
      onClick: () => {
        collection.selectedSubnodeKind(ViewModels.CollectionTabKind.Triggers);
        useTabs
          .getState()
          .refreshActiveTab(
            (tab: TabsBase) =>
              tab.collection?.id() === collection.id() && tab.collection.databaseId === collection.databaseId,
          );
      },
    };
  }

  public buildSchemaNode(collection: ViewModels.Collection): LegacyTreeNode {
    if (collection.analyticalStorageTtl() == undefined) {
      return undefined;
    }

    if (!collection.schema || !collection.schema.fields) {
      return undefined;
    }

    return {
      label: "Schema",
      children: this.getSchemaNodes(collection.schema.fields),
      onClick: () => {
        collection.selectedSubnodeKind(ViewModels.CollectionTabKind.Schema);
        useTabs.getState().refreshActiveTab((tab: TabsBase) => tab.collection && tab.collection.rid === collection.rid);
      },
    };
  }

  private getSchemaNodes(fields: DataModels.IDataField[]): LegacyTreeNode[] {
    const schema: any = {};

    //unflatten
    fields.forEach((field: DataModels.IDataField, fieldIndex: number) => {
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

    const traverse = (obj: any): LegacyTreeNode[] => {
      const children: LegacyTreeNode[] = [];

      if (obj !== null && !Array.isArray(obj) && typeof obj === "object") {
        Object.entries(obj).forEach(([key, value]) => {
          children.push({ label: key, children: traverse(value) });
        });
      } else if (Array.isArray(obj)) {
        return [{ label: obj[0] }, { label: obj[1] }];
      }

      return children;
    };

    return traverse(schema);
  }

  private buildChildNodes(
    item: NotebookContentItem,
    onFileClick: (item: NotebookContentItem) => void,
    createDirectoryContextMenu: boolean,
    createFileContextMenu: boolean,
  ): LegacyTreeNode[] {
    if (!item || !item.children) {
      return [];
    } else {
      return item.children.map((item) => {
        const result =
          item.type === NotebookContentItemType.Directory
            ? this.buildNotebookDirectoryNode(item, onFileClick, createDirectoryContextMenu, createFileContextMenu)
            : this.buildNotebookFileNode(item, onFileClick, createFileContextMenu);
        result.timestamp = item.timestamp;
        return result;
      });
    }
  }

  private buildNotebookFileNode(
    item: NotebookContentItem,
    onFileClick: (item: NotebookContentItem) => void,
    createFileContextMenu: boolean,
  ): LegacyTreeNode {
    return {
      label: item.name,
      iconSrc: NotebookUtil.isNotebookFile(item.path) ? NotebookIcon : FileIcon,
      className: "notebookHeader",
      onClick: () => onFileClick(item),
      isSelected: () => {
        const activeTab = useTabs.getState().activeTab;
        return (
          activeTab &&
          activeTab.tabKind === ViewModels.CollectionTabKind.NotebookV2 &&
          /* TODO Redesign Tab interface so that resource tree doesn't need to know about NotebookV2Tab.
             NotebookV2Tab could be dynamically imported, but not worth it to just get this type right.
           */
          (activeTab as any).notebookPath() === item.path
        );
      },
      contextMenu: createFileContextMenu && this.createFileContextMenu(item),
      data: item,
    };
  }

  private createFileContextMenu(item: NotebookContentItem): LegacyTreeNodeMenuItem[] {
    let items: LegacyTreeNodeMenuItem[] = [
      {
        label: "Rename",
        iconSrc: NotebookIcon,
        onClick: () => this.container.renameNotebook(item),
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
              () => this.container.deleteNotebookFile(item).then(() => this.triggerRender()),
              "Cancel",
              undefined,
            );
        },
      },
      {
        label: "Copy to ...",
        iconSrc: CopyIcon,
        onClick: () => this.copyNotebook(item),
      },
      {
        label: "Download",
        iconSrc: NotebookIcon,
        onClick: () => this.container.downloadFile(item),
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

          const content = await this.container.readFile(item);
          if (content) {
            await this.container.publishNotebook(item.name, content);
          }
        },
      });
    }

    // "Copy to ..." isn't needed if github locations are not available
    if (!this.container.notebookManager?.gitHubOAuthService.isLoggedIn()) {
      items = items.filter((item) => item.label !== "Copy to ...");
    }

    return items;
  }

  private copyNotebook = async (item: NotebookContentItem) => {
    const content = await this.container.readFile(item);
    if (content) {
      this.container.copyNotebook(item.name, content);
    }
  };

  private createDirectoryContextMenu(item: NotebookContentItem): LegacyTreeNodeMenuItem[] {
    let items: LegacyTreeNodeMenuItem[] = [
      {
        label: "Refresh",
        iconSrc: RefreshIcon,
        onClick: () => this.container.refreshContentItem(item).then(() => this.triggerRender()),
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
              () => this.container.deleteNotebookFile(item).then(() => this.triggerRender()),
              "Cancel",
              undefined,
            );
        },
      },
      {
        label: "Rename",
        iconSrc: NotebookIcon,
        onClick: () => this.container.renameNotebook(item),
      },
      {
        label: "New Directory",
        iconSrc: NewNotebookIcon,
        onClick: () => this.container.onCreateDirectory(item),
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
          item.label !== "Upload File",
      );
    }

    return items;
  }

  private buildNotebookDirectoryNode(
    item: NotebookContentItem,
    onFileClick: (item: NotebookContentItem) => void,
    createDirectoryContextMenu: boolean,
    createFileContextMenu: boolean,
  ): LegacyTreeNode {
    return {
      label: item.name,
      iconSrc: undefined,
      className: "notebookHeader",
      isAlphaSorted: true,
      isLeavesParentsSeparate: true,
      onClick: () => {
        if (!item.children) {
          this.container.refreshContentItem(item).then(() => this.triggerRender());
        }
      },
      isSelected: () => {
        const activeTab = useTabs.getState().activeTab;
        return (
          activeTab &&
          activeTab.tabKind === ViewModels.CollectionTabKind.NotebookV2 &&
          /* TODO Redesign Tab interface so that resource tree doesn't need to know about NotebookV2Tab.
             NotebookV2Tab could be dynamically imported, but not worth it to just get this type right.
           */
          (activeTab as any).notebookPath() === item.path
        );
      },
      contextMenu:
        createDirectoryContextMenu && item.path !== ResourceTreeAdapter.PseudoDirPath
          ? this.createDirectoryContextMenu(item)
          : undefined,
      data: item,
      children: this.buildChildNodes(item, onFileClick, createDirectoryContextMenu, createFileContextMenu),
    };
  }

  public triggerRender() {
    window.requestAnimationFrame(() => this.parameters(Date.now()));
  }
}
