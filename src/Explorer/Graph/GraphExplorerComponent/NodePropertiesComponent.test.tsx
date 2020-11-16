import React from "react";
import { mount, ReactWrapper } from "enzyme";
import { NodePropertiesComponent, NodePropertiesComponentProps, Mode } from "./NodePropertiesComponent";
import { GraphHighlightedNodeData, EditedProperties, EditedEdges, PossibleVertex } from "./GraphExplorer";

describe("Property pane", () => {
  const title = "My Title";
  const nodeId = "NodeId";
  const label = "My label";
  const properties = { key: ["value"] };

  const highlightedNode: GraphHighlightedNodeData = {
    id: nodeId,
    label: label,
    properties: properties,
    areNeighborsUnknown: false,
    sources: [
      {
        name: "sourceName",
        id: "sourceId",
        edgeId: "edgeId",
        edgeLabel: "sourceEdgeLabel"
      }
    ],
    targets: [
      {
        name: "targetName",
        id: "targetId",
        edgeId: "edgeId",
        edgeLabel: "targetEdgeLabel"
      }
    ]
  };

  const createMockProps = (): NodePropertiesComponentProps => {
    return {
      expandedTitle: title,
      isCollapsed: false,
      onCollapsedChanged: (newValue: boolean): void => {},
      node: highlightedNode,
      getPkIdFromNodeData: (v: GraphHighlightedNodeData): string => null,
      collectionPartitionKeyProperty: null,
      updateVertexProperties: (editedProperties: EditedProperties): Promise<void> => Promise.resolve(),
      selectNode: (id: string): void => {},
      updatePossibleVertices: async (): Promise<PossibleVertex[]> => null,
      possibleEdgeLabels: null,
      editGraphEdges: async (editedEdges: EditedEdges): Promise<any> => undefined,
      deleteHighlightedNode: (): void => {},
      onModeChanged: (newMode: Mode): void => {},
      viewMode: Mode.READONLY_PROP
    };
  };
  let wrapper: ReactWrapper;

  describe("in any state", () => {
    beforeEach(() => {
      const props: NodePropertiesComponentProps = createMockProps();
      wrapper = mount(<NodePropertiesComponent {...props} />);
    });

    afterEach(() => {
      wrapper.unmount();
    });

    it("should display expanded title", () => {
      expect(wrapper.exists(".expandedTitle")).toBe(true);
      expect(wrapper.find(".expandedTitle").text()).toEqual(title);
    });

    it("should display id", () => {
      const cols = wrapper.findWhere((n: ReactWrapper) => n.text() === nodeId).filter(".vertexId");
      expect(cols.length).toBe(1);
    });

    it("should display label", () => {
      const cols = wrapper.findWhere((n: ReactWrapper) => n.text() === label).filter(".vertexLabel");
      expect(cols.length).toBe(1);
    });

    it("should display property key", () => {
      const cols = wrapper.findWhere((n: ReactWrapper) => n.text() === "key").filter(".propertyId");
      expect(cols.length).toBe(1);
    });

    it("should display property value", () => {
      const cols = wrapper.findWhere((n: ReactWrapper) => n.text() === properties["key"][0]).filter(".propertyValue");
      expect(cols.length).toBe(1);
    });
  });

  describe("when neighbors are known", () => {
    beforeEach(() => {
      const props: NodePropertiesComponentProps = createMockProps();
      props.node.areNeighborsUnknown = false;
      wrapper = mount(<NodePropertiesComponent {...props} />);
    });

    afterEach(() => {
      wrapper.unmount();
    });

    it("should display source name", () => {
      const cols = wrapper.findWhere((n: ReactWrapper) => n.text() === "sourceName").filter("a");
      expect(cols.length).toBe(1);
    });

    it("should display source edge label", () => {
      const cols = wrapper.findWhere((n: ReactWrapper) => n.text() === "sourceEdgeLabel").filter("td");
      expect(cols.length).toBe(1);
    });

    it("should display target name", () => {
      const cols = wrapper.findWhere((n: ReactWrapper) => n.text() === "targetName").filter("a");
      expect(cols.length).toBe(1);
    });

    it("should display target edge label", () => {
      const cols = wrapper.findWhere((n: ReactWrapper) => n.text() === "targetEdgeLabel").filter("td");
      expect(cols.length).toBe(1);
    });

    it("should display three edit buttons", () => {
      expect(wrapper.find("span.editBtn").length).toBe(3);
    });
  });

  describe("when neighbors are unknown", () => {
    beforeEach(() => {
      const props: NodePropertiesComponentProps = createMockProps();
      props.node.areNeighborsUnknown = true;
      wrapper = mount(<NodePropertiesComponent {...props} />);
    });

    it("should not display source name", () => {
      const cols = wrapper.findWhere((n: ReactWrapper) => n.text() === "sourceName").filter("a");
      expect(cols.length).toBe(0);
    });

    it("should not display source edge label", () => {
      const cols = wrapper.findWhere((n: ReactWrapper) => n.text() === "sourceEdgeLabel").filter("td");
      expect(cols.length).toBe(0);
    });

    it("should not display target name", () => {
      const cols = wrapper.findWhere((n: ReactWrapper) => n.text() === "targetName").filter("a");
      expect(cols.length).toBe(0);
    });

    it("should not display target edge label", () => {
      const cols = wrapper.findWhere((n: ReactWrapper) => n.text() === "targetEdgeLabel").filter("td");
      expect(cols.length).toBe(0);
    });

    it("should display one edit button", () => {
      expect(wrapper.find("span.editBtn").length).toBe(1);
    });

    afterEach(() => {
      wrapper.unmount();
    });
  });
});
