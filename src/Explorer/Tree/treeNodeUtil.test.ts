import { TreeNode } from "Explorer/Controls/TreeComponent/TreeNodeComponent";
import Explorer from "Explorer/Explorer";
import { useCommandBar } from "Explorer/Menus/CommandBar/CommandBarComponentAdapter";
import TabsBase from "Explorer/Tabs/TabsBase";
import { createSampleDataTreeNodes } from "Explorer/Tree/treeNodeUtil";
import { useDatabases } from "Explorer/useDatabases";
import { useSelectedNode } from "Explorer/useSelectedNode";
import { useTabs } from "hooks/useTabs";
import ko from "knockout";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";

jest.mock("Explorer/Explorer", () => {
  class MockExplorer {
  }

  return MockExplorer;
});

// Defining this value outside the mock, AND prefixing the name with 'mock' is required by Jest's mocking logic.
let nextTabIndex = 0;
class MockTab extends TabsBase {
  constructor(tabOptions: Pick<ViewModels.TabOptions, 'tabKind'> & Partial<ViewModels.TabOptions>) {
    const tabIndex = nextTabIndex++;
    const options = {
      title: `Mock Tab ${tabIndex}`,
      tabPath: `mockTabs/tab${tabIndex}`,
      ...tabOptions,
    } as ViewModels.TabOptions;
    super(options);
  }

  onActivate = jest.fn();
}

/** A basic test collection that can be expanded on in tests. */
const baseCollection = {
  container: new Explorer(),
  databaseId: "testDatabase",
  id: ko.observable<string>("testCollection"),
  defaultTtl: ko.observable<number>(5),
  analyticalStorageTtl: ko.observable<number>(undefined),
  selectedSubnodeKind: ko.observable<ViewModels.CollectionTabKind>(),
  indexingPolicy: ko.observable<DataModels.IndexingPolicy>({
    automatic: true,
    indexingMode: "consistent",
    includedPaths: [],
    excludedPaths: [],
  }),
  uniqueKeyPolicy: {} as DataModels.UniqueKeyPolicy,
  usageSizeInKB: ko.observable(100),
  offer: ko.observable<DataModels.Offer>({
    autoscaleMaxThroughput: undefined,
    manualThroughput: 10000,
    minimumThroughput: 6000,
    id: "offer",
    offerReplacePending: false,
  }),
  conflictResolutionPolicy: ko.observable<DataModels.ConflictResolutionPolicy>(
    {} as DataModels.ConflictResolutionPolicy,
  ),
  changeFeedPolicy: ko.observable<DataModels.ChangeFeedPolicy>({} as DataModels.ChangeFeedPolicy),
  geospatialConfig: ko.observable<DataModels.GeospatialConfig>({} as DataModels.GeospatialConfig),
  getDatabase: () => { },
  partitionKey: {
    paths: [],
    kind: "hash",
    version: 2,
  },
  partitionKeyProperties: ["testPartitionKey"],
  readSettings: () => { },
  onDocumentDBDocumentsClick: jest.fn(),
  onNewQueryClick: jest.fn(),
} as unknown as ViewModels.Collection;

/** Configures app state so that useSelectedNode.getState().isDataNodeSelected() returns true for the provided arguments. */
function selectDataNode(node: ViewModels.Database | ViewModels.CollectionBase, subnodeKind?: ViewModels.CollectionTabKind) {
  useSelectedNode.getState().setSelectedNode(node);

  if (subnodeKind !== undefined) {
    node.selectedSubnodeKind(subnodeKind);
    useTabs.getState().activateNewTab(new MockTab({ tabKind: subnodeKind, node }));
  }
}

describe("createSampleDataTreeNodes", () => {
  let sampleDataResourceTokenCollection: ViewModels.Collection;
  let nodes: TreeNode[];

  beforeEach(() => {
    jest.resetAllMocks();
    const collection = { ...baseCollection };
    useDatabases.setState({ sampleDataResourceTokenCollection: collection });
    useSelectedNode.setState({ selectedNode: undefined });

    sampleDataResourceTokenCollection = collection;
    nodes = createSampleDataTreeNodes(sampleDataResourceTokenCollection);
  });

  it("creates the expected tree nodes", () => {
    expect(createSampleDataTreeNodes(useDatabases.getState().sampleDataResourceTokenCollection)).toMatchSnapshot();
  });

  describe("the collection node", () => {
    let collectionNode: TreeNode;
    beforeEach(() => {
      collectionNode = nodes[0].children[0];
    });

    it("selects the collection when context menu opened", () => {
      collectionNode.onContextMenuOpen();

      expect(useSelectedNode.getState().selectedNode).toBe(sampleDataResourceTokenCollection);
    });

    it("refreshes active tab if it's related to the collection", () => {
      const relatedTab = new MockTab({
        tabKind: ViewModels.CollectionTabKind.Documents,
        node: sampleDataResourceTokenCollection,
        collection: sampleDataResourceTokenCollection,
      });
      useTabs.setState({ openedTabs: [relatedTab], activeTab: relatedTab });

      collectionNode.onClick();
      expect(useSelectedNode.getState().selectedNode).toBe(sampleDataResourceTokenCollection);
      expect(useCommandBar.getState().contextButtons).toHaveLength(0);
      expect(relatedTab.onActivate).toHaveBeenCalled()
    });

    it("is selected when a tab for the collection is active", () => {
      expect(collectionNode.isSelected()).toStrictEqual(false);

      selectDataNode(sampleDataResourceTokenCollection, ViewModels.CollectionTabKind.Settings);

      expect(collectionNode.isSelected()).toStrictEqual(true);
    });

    it("does not refresh active tab if it's not related to the collection", () => {
      const unrelatedTab = new MockTab({
        tabKind: ViewModels.CollectionTabKind.Settings,
      });
      useTabs.setState({ openedTabs: [unrelatedTab], activeTab: unrelatedTab });

      collectionNode.onClick();
      expect(useSelectedNode.getState().selectedNode).toBe(sampleDataResourceTokenCollection);
      expect(useCommandBar.getState().contextButtons).toHaveLength(0);
      expect(unrelatedTab.onActivate).not.toHaveBeenCalled()
    });

    it("opens a new SQL query tab when 'New SQL Query' option in context menu is clicked", () => {
      const newQueryMenuItem = collectionNode.contextMenu.find((item) => item.label === "New SQL Query");

      expect(sampleDataResourceTokenCollection.onNewQueryClick).not.toHaveBeenCalled();
      newQueryMenuItem.onClick();
      expect(sampleDataResourceTokenCollection.onNewQueryClick).toHaveBeenCalled();
    });

    describe("the 'Items' subnode", () => {
      let itemsNode: TreeNode;
      beforeEach(() => {
        itemsNode = collectionNode.children[0];
      });

      it("triggers the collection's click handler when clicked", () => {
        expect(sampleDataResourceTokenCollection.onDocumentDBDocumentsClick).not.toHaveBeenCalled();
        itemsNode.onClick();
        expect(sampleDataResourceTokenCollection.onDocumentDBDocumentsClick).toHaveBeenCalled();
      });

      it("is selected when the documents tab for the collection is active", () => {
        expect(itemsNode.isSelected()).toStrictEqual(false);

        selectDataNode(sampleDataResourceTokenCollection, ViewModels.CollectionTabKind.Documents);

        expect(itemsNode.isSelected()).toStrictEqual(true);
      });

      it("opens a new SQL query tab when 'New SQL Query' option in context menu is clicked", () => {
        const newQueryMenuItem = itemsNode.contextMenu.find((item) => item.label === "New SQL Query");

        expect(sampleDataResourceTokenCollection.onNewQueryClick).not.toHaveBeenCalled();
        newQueryMenuItem.onClick();
        expect(sampleDataResourceTokenCollection.onNewQueryClick).toHaveBeenCalled();
      });
    });
  })
});