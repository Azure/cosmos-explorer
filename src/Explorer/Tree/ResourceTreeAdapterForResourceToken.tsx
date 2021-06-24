import * as ko from "knockout";
import * as React from "react";
import CollectionIcon from "../../../images/tree-collection.svg";
import { ReactAdapter } from "../../Bindings/ReactBindingHandler";
import * as ViewModels from "../../Contracts/ViewModels";
import { userContext } from "../../UserContext";
import { TreeComponent, TreeNode } from "../Controls/TreeComponent/TreeComponent";
import Explorer from "../Explorer";
import { useCommandBar } from "../Menus/CommandBar/CommandBarComponentAdapter";
import { mostRecentActivity } from "../MostRecentActivity/MostRecentActivity";
import { NotebookContentItem } from "../Notebook/NotebookContentItem";
import { useSelectedNode } from "../useSelectedNode";

export class ResourceTreeAdapterForResourceToken implements ReactAdapter {
  public parameters: ko.Observable<number>;
  public myNotebooksContentRoot: NotebookContentItem;

  public constructor(private container: Explorer) {
    this.parameters = ko.observable(Date.now());

    this.container.resourceTokenCollection.subscribe(() => this.triggerRender());
    useSelectedNode.subscribe(() => this.triggerRender());
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
        mostRecentActivity.collectionWasOpened(userContext.databaseAccount?.id, collection);
      },
      isSelected: () =>
        useSelectedNode
          .getState()
          .isDataNodeSelected(this.container.tabsManager.activeTab(), collection.databaseId, collection.id(), [
            ViewModels.CollectionTabKind.Documents,
          ]),
    });

    const collectionNode: TreeNode = {
      label: collection.id(),
      iconSrc: CollectionIcon,
      isExpanded: true,
      children,
      className: "collectionHeader",
      onClick: () => {
        // Rewritten version of expandCollapseCollection
        useSelectedNode.getState().setSelectedNode(collection);
        useCommandBar.getState().setContextButtons([]);
        this.container.tabsManager.refreshActiveTab(
          (tab) => tab.collection?.id() === collection.id() && tab.collection.databaseId === collection.databaseId
        );
      },
      isSelected: () =>
        useSelectedNode
          .getState()
          .isDataNodeSelected(this.container.tabsManager.activeTab(), collection.databaseId, collection.id()),
    };

    return {
      label: undefined,
      isExpanded: true,
      children: [collectionNode],
    };
  }

  public triggerRender() {
    window.requestAnimationFrame(() => this.parameters(Date.now()));
  }
}
