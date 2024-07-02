import * as ko from "knockout";
import * as ViewModels from "../../Contracts/ViewModels";
import { useTabs } from "../../hooks/useTabs";
import TabsBase from "../Tabs/TabsBase";
import { useSelectedNode } from "../useSelectedNode";

describe("useSelectedNode", () => {
  const mockTab = {
    tabKind: ViewModels.CollectionTabKind.Documents,
  } as TabsBase;

  // TODO isDataNodeSelected needs a better design and refactor, but for now, we protect some of the code paths
  describe("isDataNodeSelected", () => {
    afterEach(() => {
      useSelectedNode.getState().setSelectedNode(undefined);
      useTabs.setState({ activeTab: undefined });
    });
    it("should not select if no selected node", () => {
      useTabs.setState({ activeTab: mockTab });
      const isDataNodeSelected = useSelectedNode.getState().isDataNodeSelected("foo", "bar", undefined);
      expect(isDataNodeSelected).toBeFalsy();
    });

    it("should not select incorrect subnodekinds", () => {
      useTabs.setState({ activeTab: mockTab });
      useSelectedNode.getState().setSelectedNode({
        nodeKind: "nodeKind",
        rid: "rid",
        id: ko.observable<string>("id"),
      });
      const isDataNodeSelected = useSelectedNode.getState().isDataNodeSelected("foo", "bar", undefined);
      expect(isDataNodeSelected).toBeFalsy();
    });

    it("should not select if no active tab", () => {
      useSelectedNode.getState().setSelectedNode({
        nodeKind: "nodeKind",
        rid: "rid",
        id: ko.observable<string>("id"),
      });
      const isDataNodeSelected = useSelectedNode.getState().isDataNodeSelected("foo", "bar", undefined);
      expect(isDataNodeSelected).toBeFalsy();
    });

    it("should select if correct database node regardless of subnodekinds", () => {
      useTabs.setState({ activeTab: mockTab });
      const subNodeKind = ViewModels.CollectionTabKind.Documents;
      useSelectedNode.getState().setSelectedNode({
        nodeKind: "Database",
        rid: "dbrid",
        id: ko.observable<string>("dbid"),
        selectedSubnodeKind: ko.observable<ViewModels.CollectionTabKind>(subNodeKind),
      } as ViewModels.TreeNode);
      const isDataNodeSelected = useSelectedNode
        .getState()
        .isDataNodeSelected("dbid", undefined, [ViewModels.CollectionTabKind.Documents]);
      expect(isDataNodeSelected).toBeTruthy();
    });

    it("should select correct collection node (documents or graph node)", () => {
      let subNodeKind = ViewModels.CollectionTabKind.Documents;
      let activeTab = {
        tabKind: subNodeKind,
      } as TabsBase;
      useTabs.setState({ activeTab });
      useSelectedNode.getState().setSelectedNode({
        nodeKind: "Collection",
        rid: "collrid",
        databaseId: "dbid",
        id: ko.observable<string>("collid"),
        selectedSubnodeKind: ko.observable<ViewModels.CollectionTabKind>(subNodeKind),
      } as ViewModels.TreeNode);
      let isDataNodeSelected = useSelectedNode.getState().isDataNodeSelected("dbid", "collid", [subNodeKind]);
      expect(isDataNodeSelected).toBeTruthy();

      subNodeKind = ViewModels.CollectionTabKind.Graph;
      activeTab = {
        tabKind: subNodeKind,
      } as TabsBase;
      useTabs.setState({ activeTab });
      useSelectedNode.getState().setSelectedNode({
        nodeKind: "Collection",
        rid: "collrid",
        databaseId: "dbid",
        id: ko.observable<string>("collid"),
        selectedSubnodeKind: ko.observable<ViewModels.CollectionTabKind>(subNodeKind),
      } as ViewModels.TreeNode);
      isDataNodeSelected = useSelectedNode.getState().isDataNodeSelected("dbid", "collid", [subNodeKind]);
      expect(isDataNodeSelected).toBeTruthy();
    });

    it("should not select incorrect collection node (e.g. Settings)", () => {
      useSelectedNode.getState().setSelectedNode({
        nodeKind: "Collection",
        rid: "collrid",
        databaseId: "dbid",
        id: ko.observable<string>("collid"),
        selectedSubnodeKind: ko.observable<ViewModels.CollectionTabKind>(ViewModels.CollectionTabKind.Documents),
      } as ViewModels.TreeNode);
      const activeTab = {
        tabKind: ViewModels.CollectionTabKind.Documents,
      } as TabsBase;
      useTabs.setState({ activeTab });
      const isDataNodeSelected = useSelectedNode
        .getState()
        .isDataNodeSelected("dbid", "collid", [ViewModels.CollectionTabKind.Settings]);
      expect(isDataNodeSelected).toBeFalsy();
    });
  });
});
