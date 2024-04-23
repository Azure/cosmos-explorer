import { getItemName } from "Utils/APITypeUtils";
import * as ko from "knockout";
import * as React from "react";
import CosmosDBIcon from "../../../images/Azure-Cosmos-DB.svg";
import CollectionIcon from "../../../images/tree-collection.svg";
import { ReactAdapter } from "../../Bindings/ReactBindingHandler";
import { isPublicInternetAccessAllowed } from "../../Common/DatabaseAccountUtility";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { userContext } from "../../UserContext";
import { isServerlessAccount } from "../../Utils/CapabilityUtils";
import { useTabs } from "../../hooks/useTabs";
import * as ResourceTreeContextMenuButtonFactory from "../ContextMenuButtonFactory";
import { TreeComponent, TreeNode } from "../Controls/TreeComponent/TreeComponent";
import Explorer from "../Explorer";
import { useCommandBar } from "../Menus/CommandBar/CommandBarComponentAdapter";
import { mostRecentActivity } from "../MostRecentActivity/MostRecentActivity";
import { useNotebook } from "../Notebook/useNotebook";
import TabsBase from "../Tabs/TabsBase";
import { useDatabases } from "../useDatabases";
import { useSelectedNode } from "../useSelectedNode";
import { Platform, configContext } from "./../../ConfigContext";
import StoredProcedure from "./StoredProcedure";
import Trigger from "./Trigger";
import UserDefinedFunction from "./UserDefinedFunction";

export class ResourceTreeAdapter implements ReactAdapter {
  public parameters: ko.Observable<number>;

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

  public renderComponent(): JSX.Element {
    const dataRootNode = this.buildDataTree();
    return <TreeComponent className="dataResourceTree" rootNode={dataRootNode} />;
  }

  private buildDataTree(): TreeNode {
    const databaseTreeNodes: TreeNode[] = useDatabases.getState().databases.map((database: ViewModels.Database) => {
      const databaseNode: TreeNode = {
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

  private buildCollectionNode(database: ViewModels.Database, collection: ViewModels.Collection): TreeNode {
    const children: TreeNode[] = [];
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

    const schemaNode: TreeNode = this.buildSchemaNode(collection);
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

  private buildStoredProcedureNode(collection: ViewModels.Collection): TreeNode {
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

  private buildUserDefinedFunctionsNode(collection: ViewModels.Collection): TreeNode {
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

  private buildTriggerNode(collection: ViewModels.Collection): TreeNode {
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

  public buildSchemaNode(collection: ViewModels.Collection): TreeNode {
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

  private getSchemaNodes(fields: DataModels.IDataField[]): TreeNode[] {
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

    const traverse = (obj: any): TreeNode[] => {
      const children: TreeNode[] = [];

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

  public triggerRender() {
    window.requestAnimationFrame(() => this.parameters(Date.now()));
  }
}
