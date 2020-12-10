import * as ko from "knockout";
import * as MostRecentActivity from "../MostRecentActivity/MostRecentActivity";
import * as React from "react";
import * as ViewModels from "../../Contracts/ViewModels";
import { NotebookContentItem } from "../Notebook/NotebookContentItem";
import { ReactAdapter } from "../../Bindings/ReactBindingHandler";
import { TreeComponent, TreeNode } from "../Controls/TreeComponent/TreeComponent";
import CollectionIcon from "../../../images/tree-collection.svg";
import Explorer from "../Explorer";
import { userContext } from "../../UserContext";

export class ResourceTreeAdapterForResourceToken implements ReactAdapter {
  public parameters: ko.Observable<number>;
  public myNotebooksContentRoot: NotebookContentItem;

  public constructor(private container: Explorer) {
    this.parameters = ko.observable(Date.now());

    this.container.resourceTokenCollection.subscribe(() => this.triggerRender());
    this.container.selectedNode.subscribe((newValue: any) => this.triggerRender());
    this.container.tabsManager && this.container.tabsManager.activeTab.subscribe(() => this.triggerRender());

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
        this.container.mostRecentActivity.addItem(userContext.databaseAccount?.id, {
          type: MostRecentActivity.Type.OpenCollection,
          title: collection.id(),
          description: "Data",
          data: {
            databaseId: collection.databaseId,
            collectionId: collection.id(),
          },
        });
      },
      isSelected: () =>
        this.isDataNodeSelected(collection.databaseId, collection.id(), ViewModels.CollectionTabKind.Documents),
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
        this.container.tabsManager.refreshActiveTab(
          (tab) => tab.collection?.id() === collection.id() && tab.collection.databaseId === collection.databaseId
        );
      },
      isSelected: () => this.isDataNodeSelected(collection.databaseId, collection.id()),
    };

    return {
      label: undefined,
      isExpanded: true,
      children: [collectionNode],
    };
  }

  public isDataNodeSelected(
    databaseId: string,
    collectionId?: string,
    subnodeKind?: ViewModels.CollectionTabKind
  ): boolean {
    if (!this.container.selectedNode || !this.container.selectedNode()) {
      return false;
    }
    const selectedNode = this.container.selectedNode();
    const isNodeSelected = collectionId
      ? (selectedNode as ViewModels.Collection).databaseId === databaseId && selectedNode.id() === collectionId
      : selectedNode.id() === databaseId;

    if (!isNodeSelected) {
      return false;
    }

    if (!subnodeKind) {
      return true;
    }

    const activeTab = this.container.tabsManager.activeTab();
    const selectedSubnodeKind = collectionId
      ? (selectedNode as ViewModels.Collection).selectedSubnodeKind()
      : (selectedNode as ViewModels.Database).selectedSubnodeKind();

    return activeTab && activeTab.tabKind === subnodeKind && selectedSubnodeKind === subnodeKind;
  }

  public triggerRender() {
    window.requestAnimationFrame(() => this.parameters(Date.now()));
  }
}
