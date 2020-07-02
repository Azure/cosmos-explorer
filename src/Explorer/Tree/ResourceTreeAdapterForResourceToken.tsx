import * as ko from "knockout";
import * as MostRecentActivity from "../MostRecentActivity/MostRecentActivity";
import * as React from "react";
import * as ViewModels from "../../Contracts/ViewModels";
import { CosmosClient } from "../../Common/CosmosClient";
import { NotebookContentItem } from "../Notebook/NotebookContentItem";
import { ReactAdapter } from "../../Bindings/ReactBindingHandler";
import { TreeComponent, TreeNode } from "../Controls/TreeComponent/TreeComponent";
import CollectionIcon from "../../../images/tree-collection.svg";

export class ResourceTreeAdapterForResourceToken implements ReactAdapter {
  public parameters: ko.Observable<number>;
  public myNotebooksContentRoot: NotebookContentItem;

  public constructor(private container: ViewModels.Explorer) {
    this.parameters = ko.observable(Date.now());

    this.container.resourceTokenCollection.subscribe((collection: ViewModels.CollectionBase) => this.triggerRender());
    this.container.selectedNode.subscribe((newValue: any) => this.triggerRender());
    this.container.activeTab.subscribe((newValue: ViewModels.Tab) => this.triggerRender());

    this.triggerRender();
  }

  public renderComponent(): JSX.Element {
    const dataRootNode = this.buildCollectionNode();
    return <TreeComponent className="dataResourceTree" rootNode={dataRootNode} />;
  }

  public buildCollectionNode(): TreeNode {
    const collection: ViewModels.CollectionBase = this.container.resourceTokenCollection();
    if (!collection) {
      return {
        label: undefined,
        isExpanded: true,
        children: [],
      };
    }

    const children: TreeNode[] = [];
    children.push({
      label: "Items",
      onClick: () => {
        collection.onDocumentDBDocumentsClick();
        // push to most recent
        this.container.mostRecentActivity.addItem(CosmosClient.databaseAccount().id, {
          type: MostRecentActivity.Type.OpenCollection,
          title: collection.id(),
          description: "Data",
          data: collection.rid,
        });
      },
      isSelected: () => this.isDataNodeSelected(collection.rid, "Collection", ViewModels.CollectionTabKind.Documents),
    });

    const collectionNode: TreeNode = {
      label: collection.id(),
      iconSrc: CollectionIcon,
      isExpanded: true,
      children,
      className: "collectionHeader",
      onClick: () => {
        // Rewritten version of expandCollapseCollection
        this.container.selectedNode(collection);
        this.container.onUpdateTabsButtons([]);
        collection.refreshActiveTab();
      },
      isSelected: () => this.isDataNodeSelected(collection.rid, "Collection", undefined),
    };

    return {
      label: undefined,
      isExpanded: true,
      children: [collectionNode],
    };
  }

  private getActiveTab(): ViewModels.Tab {
    const activeTabs: ViewModels.Tab[] = this.container.openedTabs().filter((tab: ViewModels.Tab) => tab.isActive());
    if (activeTabs.length) {
      return activeTabs[0];
    }
    return undefined;
  }

  private isDataNodeSelected(rid: string, nodeKind: string, subnodeKind: ViewModels.CollectionTabKind): boolean {
    if (!this.container.selectedNode || !this.container.selectedNode()) {
      return false;
    }
    const selectedNode = this.container.selectedNode();

    if (subnodeKind) {
      return selectedNode.rid === rid && selectedNode.nodeKind === nodeKind;
    } else {
      const activeTab = this.getActiveTab();
      let selectedSubnodeKind;
      if (nodeKind === "Database" && (selectedNode as ViewModels.Database).selectedSubnodeKind) {
        selectedSubnodeKind = (selectedNode as ViewModels.Database).selectedSubnodeKind();
      } else if (nodeKind === "Collection" && (selectedNode as ViewModels.Collection).selectedSubnodeKind) {
        selectedSubnodeKind = (selectedNode as ViewModels.Collection).selectedSubnodeKind();
      }

      return (
        activeTab &&
        activeTab.tabKind === subnodeKind &&
        selectedNode.rid === rid &&
        selectedSubnodeKind !== undefined &&
        selectedSubnodeKind === subnodeKind
      );
    }
  }

  public triggerRender() {
    window.requestAnimationFrame(() => this.parameters(Date.now()));
  }
}
