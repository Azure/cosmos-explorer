import * as ko from "knockout";
import * as ViewModels from "../../Contracts/ViewModels";
import TabsBase from "../Tabs/TabsBase";
import { useSelectedNode } from "../useSelectedNode";

describe("useSelectedNode.getState()", () => {
  const mockTab = {
    tabKind: ViewModels.CollectionTabKind.Documents,
  } as TabsBase;

  // TODO isDataNodeSelected needs a better design and refactor, but for now, we protect some of the code paths
  describe("isDataNodeSelected", () => {
    afterEach(() => useSelectedNode.getState().setSelectedNode(undefined));
    it("it should not select if no selected node", () => {
      const isDataNodeSelected = useSelectedNode.getState().isDataNodeSelected(mockTab, "foo", "bar", undefined);
      expect(isDataNodeSelected).toBeFalsy();
    });

    it("it should not select incorrect subnodekinds", () => {
      useSelectedNode.getState().setSelectedNode({
        nodeKind: "nodeKind",
        rid: "rid",
        id: ko.observable<string>("id"),
      });
      const isDataNodeSelected = useSelectedNode.getState().isDataNodeSelected(mockTab, "foo", "bar", undefined);
      expect(isDataNodeSelected).toBeFalsy();
    });

    it("it should not select if no active tab", () => {
      useSelectedNode.getState().setSelectedNode({
        nodeKind: "nodeKind",
        rid: "rid",
        id: ko.observable<string>("id"),
      });
      const isDataNodeSelected = useSelectedNode.getState().isDataNodeSelected(undefined, "foo", "bar", undefined);
      expect(isDataNodeSelected).toBeFalsy();
    });

    it("should select if correct database node regardless of subnodekinds", () => {
      const subNodeKind = ViewModels.CollectionTabKind.Documents;
      useSelectedNode.getState().setSelectedNode({
        nodeKind: "Database",
        rid: "dbrid",
        id: ko.observable<string>("dbid"),
        selectedSubnodeKind: ko.observable<ViewModels.CollectionTabKind>(subNodeKind),
      } as ViewModels.TreeNode);
      const isDataNodeSelected = useSelectedNode
        .getState()
        .isDataNodeSelected(mockTab, "dbid", undefined, [ViewModels.CollectionTabKind.Documents]);
      expect(isDataNodeSelected).toBeTruthy();
    });

    it("should select correct collection node (documents or graph node)", () => {
      let subNodeKind = ViewModels.CollectionTabKind.Documents;
      let activeTab = {
        tabKind: subNodeKind,
      } as TabsBase;
      useSelectedNode.getState().setSelectedNode({
        nodeKind: "Collection",
        rid: "collrid",
        databaseId: "dbid",
        id: ko.observable<string>("collid"),
        selectedSubnodeKind: ko.observable<ViewModels.CollectionTabKind>(subNodeKind),
      } as ViewModels.TreeNode);
      let isDataNodeSelected = useSelectedNode
        .getState()
        .isDataNodeSelected(activeTab, "dbid", "collid", [subNodeKind]);
      expect(isDataNodeSelected).toBeTruthy();

      subNodeKind = ViewModels.CollectionTabKind.Graph;
      activeTab = {
        tabKind: subNodeKind,
      } as TabsBase;
      useSelectedNode.getState().setSelectedNode({
        nodeKind: "Collection",
        rid: "collrid",
        databaseId: "dbid",
        id: ko.observable<string>("collid"),
        selectedSubnodeKind: ko.observable<ViewModels.CollectionTabKind>(subNodeKind),
      } as ViewModels.TreeNode);
      isDataNodeSelected = useSelectedNode.getState().isDataNodeSelected(activeTab, "dbid", "collid", [subNodeKind]);
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
      const isDataNodeSelected = useSelectedNode
        .getState()
        .isDataNodeSelected(activeTab, "dbid", "collid", [ViewModels.CollectionTabKind.Settings]);
      expect(isDataNodeSelected).toBeFalsy();
    });
  });
});
