import { collectionWasOpened } from "Explorer/MostRecentActivity/MostRecentActivity";
import { shouldShowScriptNodes } from "Explorer/Tree/treeNodeUtil";
import { getItemName } from "Utils/APITypeUtils";
import * as ko from "knockout";
import * as React from "react";
import CosmosDBIcon from "../../../images/Azure-Cosmos-DB.svg";
import CollectionIcon from "../../../images/tree-collection.svg";
import { ReactAdapter } from "../../Bindings/ReactBindingHandler";
import * as ViewModels from "../../Contracts/ViewModels";
import { userContext } from "../../UserContext";
import { isServerlessAccount } from "../../Utils/CapabilityUtils";
import { useTabs } from "../../hooks/useTabs";
import * as ResourceTreeContextMenuButtonFactory from "../ContextMenuButtonFactory";
import { LegacyTreeComponent, LegacyTreeNode } from "../Controls/TreeComponent/LegacyTreeComponent";
import Explorer from "../Explorer";
import { useCommandBar } from "../Menus/CommandBar/CommandBarComponentAdapter";
import TabsBase from "../Tabs/TabsBase";
import { useDatabases } from "../useDatabases";
import { useSelectedNode } from "../useSelectedNode";
import StoredProcedure from "./StoredProcedure";
import Trigger from "./Trigger";
import UserDefinedFunction from "./UserDefinedFunction";

export class ResourceTreeAdapter implements ReactAdapter {
  private static readonly DataTitle = "DATA";

  public parameters: ko.Observable<number>;

  public constructor(private container: Explorer) {
    this.parameters = ko.observable(Date.now());

    useSelectedNode.subscribe(() => this.triggerRender());
    useTabs.subscribe(
      () => this.triggerRender(),
      (state) => state.activeTab,
    );
    useDatabases.subscribe(() => this.triggerRender());
    this.triggerRender();
  }

  public renderComponent(): JSX.Element {
    const dataRootNode = this.buildDataTree();
    return <LegacyTreeComponent className="dataResourceTree" rootNode={dataRootNode} />;
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

  public triggerRender() {
    window.requestAnimationFrame(() => this.parameters(Date.now()));
  }
}
