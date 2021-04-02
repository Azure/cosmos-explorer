import * as ko from "knockout";
import * as ViewModels from "../../Contracts/ViewModels";
import Explorer from "../Explorer";
import TabsBase from "../Tabs/TabsBase";
import { ResourceTreeAdapter } from "./ResourceTreeAdapter";

describe("ResourceTreeAdapter", () => {
  const mockContainer = (): Explorer =>
    (({
      selectedNode: ko.observable<ViewModels.TreeNode>({
        nodeKind: "nodeKind",
        rid: "rid",
        id: ko.observable<string>("id"),
      }),
      tabsManager: {
        activeTab: ko.observable<TabsBase>({
          tabKind: ViewModels.CollectionTabKind.Documents,
        } as TabsBase),
      },
      isNotebookEnabled: ko.observable<boolean>(true),
      databases: ko.observable<ViewModels.Database[]>([]),
    } as unknown) as Explorer);

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
      explorer.selectedNode(({
        nodeKind: "Database",
        rid: "dbrid",
        id: ko.observable<string>("dbid"),
        selectedSubnodeKind: ko.observable<ViewModels.CollectionTabKind>(subNodeKind),
      } as unknown) as ViewModels.TreeNode);
      const resourceTreeAdapter = new ResourceTreeAdapter(explorer);
      const isDataNodeSelected = resourceTreeAdapter.isDataNodeSelected("dbid", undefined, [
        ViewModels.CollectionTabKind.Documents,
      ]);
      expect(isDataNodeSelected).toBeTruthy();
    });

    it("should select correct collection node (documents or graph node)", () => {
      let subNodeKind = ViewModels.CollectionTabKind.Documents;
      const explorer = mockContainer();
      explorer.tabsManager.activeTab({
        tabKind: subNodeKind,
      } as TabsBase);
      explorer.selectedNode(({
        nodeKind: "Collection",
        rid: "collrid",
        databaseId: "dbid",
        id: ko.observable<string>("collid"),
        selectedSubnodeKind: ko.observable<ViewModels.CollectionTabKind>(subNodeKind),
      } as unknown) as ViewModels.TreeNode);
      const resourceTreeAdapter = new ResourceTreeAdapter(explorer);
      let isDataNodeSelected = resourceTreeAdapter.isDataNodeSelected("dbid", "collid", [subNodeKind]);
      expect(isDataNodeSelected).toBeTruthy();

      subNodeKind = ViewModels.CollectionTabKind.Graph;
      explorer.tabsManager.activeTab({
        tabKind: subNodeKind,
      } as TabsBase);
      explorer.selectedNode(({
        nodeKind: "Collection",
        rid: "collrid",
        databaseId: "dbid",
        id: ko.observable<string>("collid"),
        selectedSubnodeKind: ko.observable<ViewModels.CollectionTabKind>(subNodeKind),
      } as unknown) as ViewModels.TreeNode);
      isDataNodeSelected = resourceTreeAdapter.isDataNodeSelected("dbid", "collid", [subNodeKind]);
      expect(isDataNodeSelected).toBeTruthy();
    });

    it("should not select incorrect collection node (e.g. Settings)", () => {
      const explorer = mockContainer();
      explorer.selectedNode(({
        nodeKind: "Collection",
        rid: "collrid",
        databaseId: "dbid",
        id: ko.observable<string>("collid"),
        selectedSubnodeKind: ko.observable<ViewModels.CollectionTabKind>(ViewModels.CollectionTabKind.Documents),
      } as unknown) as ViewModels.TreeNode);
      explorer.tabsManager.activeTab({
        tabKind: ViewModels.CollectionTabKind.Documents,
      } as TabsBase);
      const resourceTreeAdapter = new ResourceTreeAdapter(explorer);
      const isDataNodeSelected = resourceTreeAdapter.isDataNodeSelected("dbid", "collid", [
        ViewModels.CollectionTabKind.Settings,
      ]);
      expect(isDataNodeSelected).toBeFalsy();
    });
  });
});
