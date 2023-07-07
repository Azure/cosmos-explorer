import { ConnectionStatusType, QueryCopilotSampleContainerId, QueryCopilotSampleDatabaseId } from "Common/Constants";
import { useNotebook } from "Explorer/Notebook/useNotebook";
import create, { UseStore } from "zustand";
import * as ViewModels from "../Contracts/ViewModels";
import { useTabs } from "../hooks/useTabs";
export interface SelectedNodeState {
  selectedNode: ViewModels.TreeNode;
  setSelectedNode: (node: ViewModels.TreeNode) => void;
  isDatabaseNodeOrNoneSelected: () => boolean;
  findSelectedCollection: () => ViewModels.Collection;
  isDataNodeSelected: (
    databaseId: string,
    collectionId?: string,
    subnodeKinds?: ViewModels.CollectionTabKind[]
  ) => boolean;
  isConnectedToContainer: () => boolean;
  isQueryCopilotCollectionSelected: () => boolean;
}

export const useSelectedNode: UseStore<SelectedNodeState> = create((set, get) => ({
  selectedNode: undefined,
  setSelectedNode: (node: ViewModels.TreeNode) => set({ selectedNode: node }),
  isDatabaseNodeOrNoneSelected: (): boolean => {
    const selectedNode = get().selectedNode;
    return !selectedNode || selectedNode.nodeKind === "Database";
  },
  findSelectedCollection: (): ViewModels.Collection => {
    const selectedNode = get().selectedNode;
    return (selectedNode.nodeKind === "Collection" ? selectedNode : selectedNode.collection) as ViewModels.Collection;
  },
  isDataNodeSelected: (
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

    const activeTab = useTabs.getState().activeTab;
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
  isConnectedToContainer: (): boolean => {
    return useNotebook.getState().connectionInfo?.status === ConnectionStatusType.Connected;
  },
  isQueryCopilotCollectionSelected: (): boolean => {
    const selectedNode = get().selectedNode;
    if (
      selectedNode &&
      selectedNode.id() === QueryCopilotSampleContainerId &&
      (selectedNode as ViewModels.Collection)?.databaseId === QueryCopilotSampleDatabaseId
    ) {
      return true;
    }
    return false;
  },
}));
