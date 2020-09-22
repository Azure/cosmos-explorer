import * as ko from "knockout";
import * as React from "react";
import { ReactAdapter } from "../../Bindings/ReactBindingHandler";
import { AccordionComponent, AccordionItemComponent } from "../Controls/Accordion/AccordionComponent";
import { TreeComponent, TreeNode, TreeNodeMenuItem } from "../Controls/TreeComponent/TreeComponent";
import * as ViewModels from "../../Contracts/ViewModels";
import { NotebookContentItem, NotebookContentItemType } from "../Notebook/NotebookContentItem";
import { ResourceTreeContextMenuButtonFactory } from "../ContextMenuButtonFactory";
import * as MostRecentActivity from "../MostRecentActivity/MostRecentActivity";
import CopyIcon from "../../../images/notebook/Notebook-copy.svg";
import CosmosDBIcon from "../../../images/Azure-Cosmos-DB.svg";
import CollectionIcon from "../../../images/tree-collection.svg";
import DeleteIcon from "../../../images/delete.svg";
import NotebookIcon from "../../../images/notebook/Notebook-resource.svg";
import RefreshIcon from "../../../images/refresh-cosmos.svg";
import NewNotebookIcon from "../../../images/notebook/Notebook-new.svg";
import FileIcon from "../../../images/notebook/file-cosmos.svg";
import { ArrayHashMap } from "../../Common/ArrayHashMap";
import { NotebookUtil } from "../Notebook/NotebookUtil";
import _ from "underscore";
import { IPinnedRepo } from "../../Juno/JunoClient";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import { Areas } from "../../Common/Constants";
import * as GitHubUtils from "../../Utils/GitHubUtils";
import GalleryIcon from "../../../images/GalleryIcon.svg";
import { Callout, Text, Link, DirectionalHint, Stack, ICalloutProps, ILinkProps } from "office-ui-fabric-react";
import { LocalStorageUtility, StorageKey } from "../../Shared/StorageUtility";
import Explorer from "../Explorer";
import UserDefinedFunction from "./UserDefinedFunction";
import StoredProcedure from "./StoredProcedure";
import Trigger from "./Trigger";
import TabsBase from "../Tabs/TabsBase";
import { userContext } from "../../UserContext";

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

  private koSubsDatabaseIdMap: ArrayHashMap<ko.Subscription>; // database id -> ko subs
  private koSubsCollectionIdMap: ArrayHashMap<ko.Subscription>; // collection id -> ko subs
  private databaseCollectionIdMap: ArrayHashMap<string>; // database id -> collection ids

  public constructor(private container: Explorer) {
    this.parameters = ko.observable(Date.now());

    this.container.selectedNode.subscribe((newValue: any) => this.triggerRender());
    this.container.tabsManager.activeTab.subscribe((newValue: TabsBase) => this.triggerRender());
    this.container.isNotebookEnabled.subscribe(newValue => this.triggerRender());

    this.koSubsDatabaseIdMap = new ArrayHashMap();
    this.koSubsCollectionIdMap = new ArrayHashMap();
    this.databaseCollectionIdMap = new ArrayHashMap();

    this.container.nonSystemDatabases.subscribe((databases: ViewModels.Database[]) => {
      // Clean up old databases
      this.cleanupDatabasesKoSubs(databases.map((database: ViewModels.Database) => database.id()));

      databases.forEach((database: ViewModels.Database) => this.watchDatabase(database));
      this.triggerRender();
    });

    this.container.nonSystemDatabases().forEach((database: ViewModels.Database) => this.watchDatabase(database));
    this.triggerRender();
  }

  public renderComponent(): JSX.Element {
    const dataRootNode = this.buildDataTree();
    const notebooksRootNode = this.buildNotebooksTrees();

    if (this.container.isNotebookEnabled()) {
      return (
        <>
          <AccordionComponent>
            <AccordionItemComponent title={ResourceTreeAdapter.DataTitle} isExpanded={!this.gitHubNotebooksContentRoot}>
              <TreeComponent className="dataResourceTree" rootNode={dataRootNode} />
            </AccordionItemComponent>
            <AccordionItemComponent title={ResourceTreeAdapter.NotebooksTitle}>
              <TreeComponent className="notebookResourceTree" rootNode={notebooksRootNode} />
            </AccordionItemComponent>
          </AccordionComponent>

          {this.galleryContentRoot && this.buildGalleryCallout()}
        </>
      );
    } else {
      return <TreeComponent className="dataResourceTree" rootNode={dataRootNode} />;
    }
  }

  public async initialize(): Promise<void[]> {
    const refreshTasks: Promise<void>[] = [];

    this.galleryContentRoot = {
      name: "Gallery",
      path: "Gallery",
      type: NotebookContentItemType.File
    };

    this.myNotebooksContentRoot = {
      name: ResourceTreeAdapter.MyNotebooksTitle,
      path: this.container.getNotebookBasePath(),
      type: NotebookContentItemType.Directory
    };

    // Only if notebook server is available we can refresh
    if (this.container.notebookServerInfo().notebookServerEndpoint) {
      refreshTasks.push(
        this.container.refreshContentItem(this.myNotebooksContentRoot).then(() => this.triggerRender())
      );
    }

    if (this.container.notebookManager?.gitHubOAuthService.isLoggedIn()) {
      this.gitHubNotebooksContentRoot = {
        name: ResourceTreeAdapter.GitHubReposTitle,
        path: ResourceTreeAdapter.PseudoDirPath,
        type: NotebookContentItemType.Directory
      };
    } else {
      this.gitHubNotebooksContentRoot = undefined;
    }

    return Promise.all(refreshTasks);
  }

  public initializeGitHubRepos(pinnedRepos: IPinnedRepo[]): void {
    if (this.gitHubNotebooksContentRoot) {
      this.gitHubNotebooksContentRoot.children = [];
      pinnedRepos?.forEach(pinnedRepo => {
        const repoFullName = GitHubUtils.toRepoFullName(pinnedRepo.owner, pinnedRepo.name);
        const repoTreeItem: NotebookContentItem = {
          name: repoFullName,
          path: ResourceTreeAdapter.PseudoDirPath,
          type: NotebookContentItemType.Directory,
          children: []
        };

        pinnedRepo.branches.forEach(branch => {
          repoTreeItem.children.push({
            name: branch.name,
            path: GitHubUtils.toContentUri(pinnedRepo.owner, pinnedRepo.name, branch.name, ""),
            type: NotebookContentItemType.Directory
          });
        });

        this.gitHubNotebooksContentRoot.children.push(repoTreeItem);
      });

      this.triggerRender();
    }
  }

  private buildDataTree(): TreeNode {
    const databaseTreeNodes: TreeNode[] = this.container.nonSystemDatabases().map((database: ViewModels.Database) => {
      const databaseNode: TreeNode = {
        label: database.id(),
        iconSrc: CosmosDBIcon,
        isExpanded: false,
        className: "databaseHeader",
        children: [],
        isSelected: () => this.isDataNodeSelected(database.rid, "Database", undefined),
        contextMenu: ResourceTreeContextMenuButtonFactory.createDatabaseContextMenu(this.container, database),
        onClick: async isExpanded => {
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
          database.selectDatabase();
          this.container.onUpdateTabsButtons([]);
          this.container.tabsManager.refreshActiveTab(
            (tab: TabsBase) => tab.collection && tab.collection.getDatabase().rid === database.rid
          );
        },
        onContextMenuOpen: () => this.container.selectedNode(database)
      };

      if (database.isDatabaseShared()) {
        databaseNode.children.push({
          label: "Scale",
          isSelected: () =>
            this.isDataNodeSelected(database.rid, "Database", [ViewModels.CollectionTabKind.DatabaseSettings]),
          onClick: database.onSettingsClick.bind(database)
        });
      }

      // Find collections
      database
        .collections()
        .forEach((collection: ViewModels.Collection) =>
          databaseNode.children.push(this.buildCollectionNode(database, collection))
        );

      database.collections.subscribe((collections: ViewModels.Collection[]) => {
        collections.forEach((collection: ViewModels.Collection) =>
          databaseNode.children.push(this.buildCollectionNode(database, collection))
        );
      });

      return databaseNode;
    });

    return {
      label: undefined,
      isExpanded: true,
      children: databaseTreeNodes
    };
  }

  /**
   * This is a rewrite of Collection.ts : showScriptsMenu, showStoredProcedures, showTriggers, showUserDefinedFunctions
   * @param container
   */
  private static showScriptNodes(container: Explorer): boolean {
    return container.isPreferredApiDocumentDB() || container.isPreferredApiGraph();
  }

  private buildCollectionNode(database: ViewModels.Database, collection: ViewModels.Collection): TreeNode {
    const children: TreeNode[] = [];
    children.push({
      label: collection.getLabel(),
      onClick: () => {
        collection.openTab();
        // push to most recent
        this.container.mostRecentActivity.addItem(userContext.databaseAccount?.id, {
          type: MostRecentActivity.Type.OpenCollection,
          title: collection.id(),
          description: "Data",
          data: collection.rid
        });
      },
      isSelected: () =>
        this.isDataNodeSelected(collection.rid, "Collection", [
          ViewModels.CollectionTabKind.Documents,
          ViewModels.CollectionTabKind.Graph
        ]),
      contextMenu: ResourceTreeContextMenuButtonFactory.createCollectionContextMenuButton(this.container, collection)
    });

    children.push({
      label: database.isDatabaseShared() || this.container.isServerlessEnabled() ? "Settings" : "Scale & Settings",
      onClick: collection.onSettingsClick.bind(collection),
      isSelected: () => this.isDataNodeSelected(collection.rid, "Collection", [ViewModels.CollectionTabKind.Settings])
    });

    if (ResourceTreeAdapter.showScriptNodes(this.container)) {
      children.push(this.buildStoredProcedureNode(collection));
      children.push(this.buildUserDefinedFunctionsNode(collection));
      children.push(this.buildTriggerNode(collection));
    }

    // This is a rewrite of showConflicts
    const showConflicts =
      this.container.databaseAccount &&
      this.container.databaseAccount() &&
      this.container.databaseAccount().properties &&
      this.container.databaseAccount().properties.enableMultipleWriteLocations &&
      collection.rawDataModel &&
      !!collection.rawDataModel.conflictResolutionPolicy;

    if (showConflicts) {
      children.push({
        label: "Conflicts",
        onClick: collection.onConflictsClick.bind(collection),
        isSelected: () =>
          this.isDataNodeSelected(collection.rid, "Collection", [ViewModels.CollectionTabKind.Conflicts])
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
        this.container.selectedNode(collection);
        this.container.onUpdateTabsButtons([]);
        this.container.tabsManager.refreshActiveTab(
          (tab: TabsBase) => tab.collection && tab.collection.rid === collection.rid
        );
      },
      onExpanded: () => {
        if (ResourceTreeAdapter.showScriptNodes(this.container)) {
          collection.loadStoredProcedures();
          collection.loadUserDefinedFunctions();
          collection.loadTriggers();
        }
      },
      isSelected: () => this.isDataNodeSelected(collection.rid, "Collection", undefined),
      onContextMenuOpen: () => this.container.selectedNode(collection)
    };
  }

  private buildStoredProcedureNode(collection: ViewModels.Collection): TreeNode {
    return {
      label: "Stored Procedures",
      children: collection.storedProcedures().map((sp: StoredProcedure) => ({
        label: sp.id(),
        onClick: sp.open.bind(sp),
        isSelected: () =>
          this.isDataNodeSelected(collection.rid, "Collection", [ViewModels.CollectionTabKind.StoredProcedures]),
        contextMenu: ResourceTreeContextMenuButtonFactory.createStoreProcedureContextMenuItems(this.container, sp)
      })),
      onClick: () => {
        collection.selectedSubnodeKind(ViewModels.CollectionTabKind.StoredProcedures);
        this.container.tabsManager.refreshActiveTab(
          (tab: TabsBase) => tab.collection && tab.collection.rid === collection.rid
        );
      }
    };
  }

  private buildUserDefinedFunctionsNode(collection: ViewModels.Collection): TreeNode {
    return {
      label: "User Defined Functions",
      children: collection.userDefinedFunctions().map((udf: UserDefinedFunction) => ({
        label: udf.id(),
        onClick: udf.open.bind(udf),
        isSelected: () =>
          this.isDataNodeSelected(collection.rid, "Collection", [ViewModels.CollectionTabKind.UserDefinedFunctions]),
        contextMenu: ResourceTreeContextMenuButtonFactory.createUserDefinedFunctionContextMenuItems(this.container, udf)
      })),
      onClick: () => {
        collection.selectedSubnodeKind(ViewModels.CollectionTabKind.UserDefinedFunctions);
        this.container.tabsManager.refreshActiveTab(
          (tab: TabsBase) => tab.collection && tab.collection.rid === collection.rid
        );
      }
    };
  }

  private buildTriggerNode(collection: ViewModels.Collection): TreeNode {
    return {
      label: "Triggers",
      children: collection.triggers().map((trigger: Trigger) => ({
        label: trigger.id(),
        onClick: trigger.open.bind(trigger),
        isSelected: () =>
          this.isDataNodeSelected(collection.rid, "Collection", [ViewModels.CollectionTabKind.Triggers]),
        contextMenu: ResourceTreeContextMenuButtonFactory.createTriggerContextMenuItems(this.container, trigger)
      })),
      onClick: () => {
        collection.selectedSubnodeKind(ViewModels.CollectionTabKind.Triggers);
        this.container.tabsManager.refreshActiveTab(
          (tab: TabsBase) => tab.collection && tab.collection.rid === collection.rid
        );
      }
    };
  }

  private buildNotebooksTrees(): TreeNode {
    let notebooksTree: TreeNode = {
      label: undefined,
      isExpanded: true,
      children: []
    };

    if (this.galleryContentRoot) {
      notebooksTree.children.push(this.buildGalleryNotebooksTree());
    }

    if (this.myNotebooksContentRoot) {
      notebooksTree.children.push(this.buildMyNotebooksTree());
    }

    if (this.gitHubNotebooksContentRoot) {
      // collapse all other notebook nodes
      notebooksTree.children.forEach(node => (node.isExpanded = false));
      notebooksTree.children.push(this.buildGitHubNotebooksTree());
    }

    return notebooksTree;
  }

  private buildGalleryCallout(): JSX.Element {
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
        this.triggerRender();
      },
      setInitialFocus: true
    };

    const openGalleryProps: ILinkProps = {
      onClick: () => {
        LocalStorageUtility.setEntryBoolean(StorageKey.GalleryCalloutDismissed, true);
        this.container.openGallery();
        this.triggerRender();
      }
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
  }

  private buildGalleryNotebooksTree(): TreeNode {
    return {
      label: "Gallery",
      iconSrc: GalleryIcon,
      className: "notebookHeader galleryHeader",
      onClick: () => this.container.openGallery(),
      isSelected: () => {
        const activeTab = this.container.tabsManager.activeTab();
        return activeTab && activeTab.tabKind === ViewModels.CollectionTabKind.Gallery;
      }
    };
  }

  private buildMyNotebooksTree(): TreeNode {
    const myNotebooksTree: TreeNode = this.buildNotebookDirectoryNode(
      this.myNotebooksContentRoot,
      (item: NotebookContentItem) => {
        this.container.openNotebook(item).then(hasOpened => {
          if (hasOpened) {
            this.pushItemToMostRecent(item);
          }
        });
      },
      true,
      true
    );

    myNotebooksTree.isExpanded = true;
    myNotebooksTree.isAlphaSorted = true;
    // Remove "Delete" menu item from context menu
    myNotebooksTree.contextMenu = myNotebooksTree.contextMenu.filter(menuItem => menuItem.label !== "Delete");
    return myNotebooksTree;
  }

  private buildGitHubNotebooksTree(): TreeNode {
    const gitHubNotebooksTree: TreeNode = this.buildNotebookDirectoryNode(
      this.gitHubNotebooksContentRoot,
      (item: NotebookContentItem) => {
        this.container.openNotebook(item).then(hasOpened => {
          if (hasOpened) {
            this.pushItemToMostRecent(item);
          }
        });
      },
      true,
      true
    );

    gitHubNotebooksTree.contextMenu = [
      {
        label: "Manage GitHub settings",
        onClick: () => this.container.gitHubReposPane.open()
      },
      {
        label: "Disconnect from GitHub",
        onClick: () => {
          TelemetryProcessor.trace(Action.NotebooksGitHubDisconnect, ActionModifiers.Mark, {
            databaseAccountName: this.container.databaseAccount() && this.container.databaseAccount().name,
            defaultExperience: this.container.defaultExperience && this.container.defaultExperience(),
            dataExplorerArea: Areas.Notebook
          });
          this.container.notebookManager?.gitHubOAuthService.logout();
        }
      }
    ];

    gitHubNotebooksTree.isExpanded = true;
    gitHubNotebooksTree.isAlphaSorted = true;

    return gitHubNotebooksTree;
  }

  private pushItemToMostRecent(item: NotebookContentItem) {
    this.container.mostRecentActivity.addItem(userContext.databaseAccount?.id, {
      type: MostRecentActivity.Type.OpenNotebook,
      title: item.name,
      description: "Notebook",
      data: {
        name: item.name,
        path: item.path
      }
    });
  }

  private buildChildNodes(
    item: NotebookContentItem,
    onFileClick: (item: NotebookContentItem) => void,
    createDirectoryContextMenu: boolean,
    createFileContextMenu: boolean
  ): TreeNode[] {
    if (!item || !item.children) {
      return [];
    } else {
      return item.children.map(item => {
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
    createFileContextMenu: boolean
  ): TreeNode {
    return {
      label: item.name,
      iconSrc: NotebookUtil.isNotebookFile(item.path) ? NotebookIcon : FileIcon,
      className: "notebookHeader",
      onClick: () => onFileClick(item),
      isSelected: () => {
        const activeTab = this.container.tabsManager.activeTab();
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
      data: item
    };
  }

  private createFileContextMenu(item: NotebookContentItem): TreeNodeMenuItem[] {
    let items: TreeNodeMenuItem[] = [
      {
        label: "Rename",
        iconSrc: NotebookIcon,
        onClick: () => this.container.renameNotebook(item)
      },
      {
        label: "Delete",
        iconSrc: DeleteIcon,
        onClick: () => {
          this.container.showOkCancelModalDialog(
            "Confirm delete",
            `Are you sure you want to delete "${item.name}"`,
            "Delete",
            () => this.container.deleteNotebookFile(item).then(() => this.triggerRender()),
            "Cancel",
            undefined
          );
        }
      },
      {
        label: "Copy to ...",
        iconSrc: CopyIcon,
        onClick: () => this.copyNotebook(item)
      },
      {
        label: "Download",
        iconSrc: NotebookIcon,
        onClick: () => this.container.downloadFile(item)
      }
    ];

    // "Copy to ..." isn't needed if github locations are not available
    if (!this.container.notebookManager?.gitHubOAuthService.isLoggedIn()) {
      items = items.filter(item => item.label !== "Copy to ...");
    }

    return items;
  }

  private copyNotebook = async (item: NotebookContentItem) => {
    const content = await this.container.readFile(item);
    if (content) {
      this.container.copyNotebook(item.name, content);
    }
  };

  private createDirectoryContextMenu(item: NotebookContentItem): TreeNodeMenuItem[] {
    let items: TreeNodeMenuItem[] = [
      {
        label: "Refresh",
        iconSrc: RefreshIcon,
        onClick: () => this.container.refreshContentItem(item).then(() => this.triggerRender())
      },
      {
        label: "Delete",
        iconSrc: DeleteIcon,
        onClick: () => {
          this.container.showOkCancelModalDialog(
            "Confirm delete",
            `Are you sure you want to delete "${item.name}?"`,
            "Delete",
            () => this.container.deleteNotebookFile(item).then(() => this.triggerRender()),
            "Cancel",
            undefined
          );
        }
      },
      {
        label: "Rename",
        iconSrc: NotebookIcon,
        onClick: () => this.container.renameNotebook(item).then(() => this.triggerRender())
      },
      {
        label: "New Directory",
        iconSrc: NewNotebookIcon,
        onClick: () => this.container.onCreateDirectory(item)
      },
      {
        label: "New Notebook",
        iconSrc: NewNotebookIcon,
        onClick: () => this.container.onNewNotebookClicked(item)
      },
      {
        label: "Upload File",
        iconSrc: NewNotebookIcon,
        onClick: () => this.container.onUploadToNotebookServerClicked(item)
      }
    ];

    // For GitHub paths remove "Delete", "Rename", "New Directory", "Upload File"
    if (GitHubUtils.fromContentUri(item.path)) {
      items = items.filter(
        item =>
          item.label !== "Delete" &&
          item.label !== "Rename" &&
          item.label !== "New Directory" &&
          item.label !== "Upload File"
      );
    }

    return items;
  }

  private buildNotebookDirectoryNode(
    item: NotebookContentItem,
    onFileClick: (item: NotebookContentItem) => void,
    createDirectoryContextMenu: boolean,
    createFileContextMenu: boolean
  ): TreeNode {
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
        const activeTab = this.container.tabsManager.activeTab();
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
      children: this.buildChildNodes(item, onFileClick, createDirectoryContextMenu, createFileContextMenu)
    };
  }

  public triggerRender() {
    window.requestAnimationFrame(() => this.parameters(Date.now()));
  }

  /**
   * public for testing purposes
   * @param rid
   * @param nodeKind
   * @param subnodeKinds
   */
  public isDataNodeSelected(rid: string, nodeKind: string, subnodeKinds: ViewModels.CollectionTabKind[]): boolean {
    if (!this.container.selectedNode || !this.container.selectedNode()) {
      return false;
    }
    const selectedNode = this.container.selectedNode();

    if (subnodeKinds === undefined || !Array.isArray(subnodeKinds)) {
      return selectedNode.rid === rid && selectedNode.nodeKind === nodeKind;
    } else {
      const activeTab = this.container.tabsManager.activeTab();
      let selectedSubnodeKind;
      if (nodeKind === "Database" && (selectedNode as ViewModels.Database).selectedSubnodeKind) {
        selectedSubnodeKind = (selectedNode as ViewModels.Database).selectedSubnodeKind();
      } else if (nodeKind === "Collection" && (selectedNode as ViewModels.Collection).selectedSubnodeKind) {
        selectedSubnodeKind = (selectedNode as ViewModels.Collection).selectedSubnodeKind();
      }

      return (
        activeTab &&
        subnodeKinds.includes(activeTab.tabKind) &&
        selectedNode.rid === rid &&
        selectedSubnodeKind !== undefined &&
        subnodeKinds.includes(selectedSubnodeKind)
      );
    }
  }

  // ***************  watch all nested ko's inside database
  // TODO Simplify so we don't have to do this

  private watchCollection(databaseId: string, collection: ViewModels.Collection) {
    this.addKoSubToCollectionId(
      databaseId,
      collection.id(),
      collection.storedProcedures.subscribe(() => {
        this.triggerRender();
      })
    );

    this.addKoSubToCollectionId(
      databaseId,
      collection.id(),
      collection.isCollectionExpanded.subscribe(() => {
        this.triggerRender();
      })
    );

    this.addKoSubToCollectionId(
      databaseId,
      collection.id(),
      collection.isStoredProceduresExpanded.subscribe(() => {
        this.triggerRender();
      })
    );
  }

  private watchDatabase(database: ViewModels.Database) {
    const databaseId = database.id();
    const koSub = database.collections.subscribe((collections: ViewModels.Collection[]) => {
      this.cleanupCollectionsKoSubs(
        databaseId,
        collections.map((collection: ViewModels.Collection) => collection.id())
      );

      collections.forEach((collection: ViewModels.Collection) => this.watchCollection(databaseId, collection));
      this.triggerRender();
    });
    this.addKoSubToDatabaseId(databaseId, koSub);

    database.collections().forEach((collection: ViewModels.Collection) => this.watchCollection(databaseId, collection));
  }

  private addKoSubToDatabaseId(databaseId: string, sub: ko.Subscription): void {
    this.koSubsDatabaseIdMap.push(databaseId, sub);
  }

  private addKoSubToCollectionId(databaseId: string, collectionId: string, sub: ko.Subscription): void {
    this.databaseCollectionIdMap.push(databaseId, collectionId);
    this.koSubsCollectionIdMap.push(collectionId, sub);
  }

  private cleanupDatabasesKoSubs(existingDatabaseIds: string[]): void {
    existingDatabaseIds.forEach((databaseId: string) => {
      if (this.koSubsDatabaseIdMap.has(databaseId)) {
        this.koSubsDatabaseIdMap.get(databaseId).forEach((sub: ko.Subscription) => sub.dispose());
        this.koSubsDatabaseIdMap.delete(databaseId);
      }

      if (this.databaseCollectionIdMap.has(databaseId)) {
        this.databaseCollectionIdMap
          .get(databaseId)
          .forEach((collectionId: string) => this.cleanupKoSubsForCollection(databaseId, collectionId));
      }
    });
  }

  private cleanupCollectionsKoSubs(databaseId: string, existingCollectionIds: string[]): void {
    if (!this.databaseCollectionIdMap.has(databaseId)) {
      return;
    }

    const collectionIdsToRemove = this.databaseCollectionIdMap
      .get(databaseId)
      .filter((id: string) => existingCollectionIds.indexOf(id) === -1);

    collectionIdsToRemove.forEach((id: string) => this.cleanupKoSubsForCollection(databaseId, id));
  }

  private cleanupKoSubsForCollection(databaseId: string, collectionId: string) {
    if (!this.koSubsCollectionIdMap.has(collectionId)) {
      return;
    }

    this.koSubsCollectionIdMap.get(collectionId).forEach((sub: ko.Subscription) => sub.dispose());
    this.koSubsCollectionIdMap.delete(collectionId);
    this.databaseCollectionIdMap.remove(databaseId, collectionId);
  }
}
