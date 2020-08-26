import Explorer from "../Explorer";
import * as ko from "knockout";
import { ResourceTreeAdapter } from "./ResourceTreeAdapter";
import * as ViewModels from "../../Contracts/ViewModels";
import TabsBase from "../Tabs/TabsBase";
import { assert } from "console";

describe("ResourceTreeAdapter", () => {

  const mockContainer = (): Explorer => ({
    selectedNode: ko.observable<ViewModels.TreeNode>({
      nodeKind: "nodeKind",
      rid: "rid",
      id: ko.observable<string>("id")
    }),
    tabsManager: {
      activeTab: ko.observable<TabsBase>({
        tabKind: ViewModels.CollectionTabKind.Documents
      } as TabsBase)
    },
    isNotebookEnabled: ko.observable<boolean>(true),
    nonSystemDatabases: ko.observable<ViewModels.Database[]>([])

  }) as unknown as Explorer;

  // TODO isDataNodeSelected needs a better design and refactor, but for now, we protect some of the code paths
  describe("isDataNodeSelected", () => {
    it("it should not select if no selected node", () => {
      const explorer = mockContainer();
      explorer.selectedNode(undefined);
      const resourceTreeAdapter = new ResourceTreeAdapter(explorer);
      const isDataNodeSelected = resourceTreeAdapter.isDataNodeSelected("foo", "bar", undefined);
      expect(isDataNodeSelected).toBeFalsy();
    });

    it("it should not select incorrect subnodekinds", () => {
      const resourceTreeAdapter = new ResourceTreeAdapter(mockContainer());
      const isDataNodeSelected = resourceTreeAdapter.isDataNodeSelected("foo", "bar", undefined);
      expect(isDataNodeSelected).toBeFalsy();
    });

    it("it should not select if no active tab", () => {
      const explorer = mockContainer();
      explorer.tabsManager.activeTab(undefined);
      const resourceTreeAdapter = new ResourceTreeAdapter(explorer);
      const isDataNodeSelected = resourceTreeAdapter.isDataNodeSelected("foo", "bar", undefined);
      expect(isDataNodeSelected).toBeFalsy();
    });

    it("should select if correct database node regardless of subnodekinds", () => {
      const subNodeKind = ViewModels.CollectionTabKind.Documents;
      const explorer = mockContainer();
      explorer.selectedNode({
        nodeKind: "Database",
        rid: "dbrid",
        id: ko.observable<string>("id"),
        selectedSubnodeKind: ko.observable<ViewModels.CollectionTabKind>(subNodeKind)
      } as any)
      const resourceTreeAdapter = new ResourceTreeAdapter(explorer);
      const isDataNodeSelected = resourceTreeAdapter.isDataNodeSelected("dbrid", "Database", [ViewModels.CollectionTabKind.Documents]);
      expect(isDataNodeSelected).toBeTruthy();
    });

    it("should select correct collection node (documents or graph node)", () => {
      let subNodeKind = ViewModels.CollectionTabKind.Documents;
      const explorer = mockContainer();
      explorer.tabsManager.activeTab({
        tabKind: subNodeKind
      } as TabsBase);
      explorer.selectedNode({
        nodeKind: "Collection",
        rid: "collrid",
        id: ko.observable<string>("id"),
        selectedSubnodeKind: ko.observable<ViewModels.CollectionTabKind>(subNodeKind)
      } as any)
      const resourceTreeAdapter = new ResourceTreeAdapter(explorer);
      let isDataNodeSelected = resourceTreeAdapter.isDataNodeSelected("collrid", "Collection", [subNodeKind]);
      expect(isDataNodeSelected).toBeTruthy();

      subNodeKind = ViewModels.CollectionTabKind.Graph;
      explorer.tabsManager.activeTab({
        tabKind: subNodeKind
      } as TabsBase);
      explorer.selectedNode({
        nodeKind: "Collection",
        rid: "collrid",
        id: ko.observable<string>("id"),
        selectedSubnodeKind: ko.observable<ViewModels.CollectionTabKind>(subNodeKind)
      } as any)
      isDataNodeSelected = resourceTreeAdapter.isDataNodeSelected("collrid", "Collection", [subNodeKind]);
      expect(isDataNodeSelected).toBeTruthy();
    });

    it("should not select incorrect collection node (e.g. Settings)", () => {
      const explorer = mockContainer();
      explorer.selectedNode({
        nodeKind: "Collection",
        rid: "collrid",
        id: ko.observable<string>("id"),
        selectedSubnodeKind: ko.observable<ViewModels.CollectionTabKind>(ViewModels.CollectionTabKind.Documents)
      } as any);
      explorer.tabsManager.activeTab({
          tabKind: ViewModels.CollectionTabKind.Documents
        } as TabsBase);
      const resourceTreeAdapter = new ResourceTreeAdapter(explorer);
      const isDataNodeSelected = resourceTreeAdapter.isDataNodeSelected("collrid", "Collection", [ViewModels.CollectionTabKind.Settings]);
      expect(isDataNodeSelected).toBeFalsy();
    });
  });
});