import { TreeNodeMenuItem } from "Explorer/Controls/TreeComponent/TreeNodeComponent";
import { collectionWasOpened } from "Explorer/MostRecentActivity/MostRecentActivity";
import { shouldShowScriptNodes } from "Explorer/Tree/treeNodeUtil";
import { getItemName } from "Utils/APITypeUtils";
import * as ko from "knockout";
import * as React from "react";
import CosmosDBIcon from "../../../images/Azure-Cosmos-DB.svg";
import DeleteIcon from "../../../images/delete.svg";
import CopyIcon from "../../../images/notebook/Notebook-copy.svg";
import NewNotebookIcon from "../../../images/notebook/Notebook-new.svg";
import NotebookIcon from "../../../images/notebook/Notebook-resource.svg";
import FileIcon from "../../../images/notebook/file-cosmos.svg";
import RefreshIcon from "../../../images/refresh-cosmos.svg";
import CollectionIcon from "../../../images/tree-collection.svg";
import { ReactAdapter } from "../../Bindings/ReactBindingHandler";
import { isPublicInternetAccessAllowed } from "../../Common/DatabaseAccountUtility";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../UserContext";
import { isServerlessAccount } from "../../Utils/CapabilityUtils";
import { useTabs } from "../../hooks/useTabs";
import * as ResourceTreeContextMenuButtonFactory from "../ContextMenuButtonFactory";
import { useDialog } from "../Controls/Dialog";
import { LegacyTreeComponent, LegacyTreeNode } from "../Controls/TreeComponent/LegacyTreeComponent";
import Explorer from "../Explorer";
import { useCommandBar } from "../Menus/CommandBar/CommandBarComponentAdapter";
import { NotebookContentItem, NotebookContentItemType } from "../Notebook/NotebookContentItem";
import { NotebookUtil } from "../Notebook/NotebookUtil";
import { useNotebook } from "../Notebook/useNotebook";
import TabsBase from "../Tabs/TabsBase";
import { useDatabases } from "../useDatabases";
import { useSelectedNode } from "../useSelectedNode";
import StoredProcedure from "./StoredProcedure";
import Trigger from "./Trigger";
import UserDefinedFunction from "./UserDefinedFunction";

export class ResourceTreeAdapter implements ReactAdapter {
  public static readonly MyNotebooksTitle = "My Notebooks";

  private static readonly DataTitle = "DATA";
  private static readonly NotebooksTitle = "NOTEBOOKS";
  private static readonly PseudoDirPath = "PsuedoDir";

  public parameters: ko.Observable<number>;

  public myNotebooksContentRoot: NotebookContentItem;

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

    this.myNotebooksContentRoot = {
      name: useNotebook.getState().notebookFolderName,
      path: useNotebook.getState().notebookBasePath,
      type: NotebookContentItemType.Directory,
    };

    return Promise.all(refreshTasks);
  }

  private buildDataTree(): LegacyTreeNode {
    const databaseTreeNodes: LegacyTreeNode[] = useDatabases
      .getState()
      .databases.map((database: ViewModels.Database) => {
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

  private buildCollectionNode(database: ViewModels.Database, collection: ViewModels.Collection): LegacyTreeNode {
    const children: LegacyTreeNode[] = [];
    children.push({
      label: getItemName(),
      onClick: () => {
        collection.openTab();
        // push to most recent
        collectionWasOpened(userContext.databaseAccount?.name, collection);
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

    if (shouldShowScriptNodes()) {
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
        if (shouldShowScriptNodes()) {
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
      contextMenu: createFileContextMenu && this.createFileContextMenu(),
      data: item,
    };
  }

  private createFileContextMenu(): TreeNodeMenuItem[] {
    return [];
  }

  private createDirectoryContextMenu(): TreeNodeMenuItem[] {
    return [];
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
      onClick: undefined,
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
          ? this.createDirectoryContextMenu()
          : undefined,
      data: item,
      children: this.buildChildNodes(item, onFileClick, createDirectoryContextMenu, createFileContextMenu),
    };
  }

  public triggerRender() {
    window.requestAnimationFrame(() => this.parameters(Date.now()));
  }
}
