import _ from "underscore";
import create, { UseStore } from "zustand";
import * as ViewModels from "../Contracts/ViewModels";
import TabsBase from "./Tabs/TabsBase";
import { useDatabases } from "./useDatabases";

export interface SelectedNodeState {
  selectedNode: ViewModels.TreeNode;
  setSelectedNode: (node: ViewModels.TreeNode) => void;
  isDatabaseNodeOrNoneSelected: () => boolean;
  findSelectedDatabase: () => ViewModels.Database;
  findSelectedCollection: () => ViewModels.Collection;
  isDataNodeSelected: (
    activeTab: TabsBase,
    databaseId: string,
    collectionId?: string,
    subnodeKinds?: ViewModels.CollectionTabKind[]
  ) => boolean;
}

export const useSelectedNode: UseStore<SelectedNodeState> = create((set, get) => ({
  selectedNode: undefined,
  setSelectedNode: (node: ViewModels.TreeNode) => set({ selectedNode: node }),
  isDatabaseNodeOrNoneSelected: (): boolean => {
    const selectedNode = get().selectedNode;
    return !selectedNode || selectedNode.nodeKind === "Database";
  },
  findSelectedDatabase: (): ViewModels.Database => {
    const selectedNode = get().selectedNode;
    if (!selectedNode) {
      return undefined;
    }
    if (selectedNode.nodeKind === "Database") {
      return _.find(
        useDatabases.getState().databases,
        (database: ViewModels.Database) => database.id() === selectedNode.id()
      );
    }

    if (selectedNode.nodeKind === "Collection") {
      return selectedNode.database;
    }

    return selectedNode.collection?.database;
  },
  findSelectedCollection: (): ViewModels.Collection => {
    const selectedNode = get().selectedNode;
    return (selectedNode.nodeKind === "Collection" ? selectedNode : selectedNode.collection) as ViewModels.Collection;
  },
  isDataNodeSelected: (
    activeTab: TabsBase,
    databaseId: string,
    collectionId?: string,
    subnodeKinds?: ViewModels.CollectionTabKind[]
  ): boolean => {
    const selectedNode = get().selectedNode;
    if (!selectedNode) {
      return false;
    }

    const isNodeSelected = collectionId
      ? (selectedNode as ViewModels.Collection).databaseId === databaseId && selectedNode.id() === collectionId
      : selectedNode.id() === databaseId;

    if (!isNodeSelected) {
      return false;
    }

    if (subnodeKinds === undefined || !Array.isArray(subnodeKinds)) {
      return true;
    }

    const selectedSubnodeKind = collectionId
      ? (selectedNode as ViewModels.Collection).selectedSubnodeKind()
      : (selectedNode as ViewModels.Database).selectedSubnodeKind();

    return (
      activeTab &&
      subnodeKinds.includes(activeTab.tabKind) &&
      selectedSubnodeKind !== undefined &&
      subnodeKinds.includes(selectedSubnodeKind)
    );
  },
}));
