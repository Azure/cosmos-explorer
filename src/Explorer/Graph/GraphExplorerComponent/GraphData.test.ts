import { GraphData, GremlinVertex, GremlinEdge } from "./GraphData";

describe("Graph Data", () => {
  it("should set only one node as root", () => {
    const graphData = new GraphData<GremlinVertex, GremlinEdge>();
    const v1: GremlinVertex = { id: "1", label: null };
    const v2: GremlinVertex = { id: "2", label: null };
    const v3: GremlinVertex = { id: "3", label: null };
    v3._isRoot = true;

    graphData.addVertex(v1);
    graphData.addVertex(v2);
    graphData.addVertex(v3);

    graphData.setAsRoot("2");
    graphData.setAsRoot("1");

    // Count occurences of roots
    const roots = graphData.vertices.filter((v: any) => {
      return v._isRoot;
    });

    expect(roots.length).toBe(1);
    expect(graphData.getVertexById("1")._isRoot).toBeDefined();
    expect(graphData.getVertexById("2")._isRoot).not.toBeDefined();
    expect(graphData.getVertexById("3")._isRoot).not.toBeDefined();
  });

  it("should properly find root id", () => {
    const graphData = new GraphData();
    const v1: GremlinVertex = { id: "1", label: null };
    const v2: GremlinVertex = { id: "2", label: null };
    const v3: GremlinVertex = { id: "3", label: null };

    graphData.addVertex(v1);
    graphData.addVertex(v2);
    graphData.addVertex(v3);

    graphData.setAsRoot("1");

    expect(graphData.findRootNodeId()).toBe("1");
  });

  it("should remove edge from graph", () => {
    const graphData = new GraphData();

    graphData.addVertex({ id: "v1", label: null });
    graphData.addVertex({ id: "v2", label: null });
    graphData.addVertex({ id: "v3", label: null });

    graphData.addEdge({ id: "e1", inV: "v1", outV: "v2", label: null });
    graphData.addEdge({ id: "e2", inV: "v1", outV: "v3", label: null });

    // in edge
    graphData.removeEdge("e1", false);
    expect(graphData.edges.length).toBe(1);
    expect(graphData).not.toContain(jasmine.objectContaining({ id: "e1" }));

    // out edge
    graphData.removeEdge("e2", false);
    expect(graphData.edges.length).toBe(0);
    expect(graphData).not.toContain(jasmine.objectContaining({ id: "e2" }));
  });

  it("should get string node property", () => {
    const stringValue = "blah";
    const value = GraphData.getNodePropValue(
      {
        id: "id",
        label: "label",
        properties: {
          testString: [{ id: "123", value: stringValue }],
        },
      },
      "testString",
    );

    expect(value).toEqual(stringValue);
  });

  it("should get number node property", () => {
    const numberValue = 2;
    const value = GraphData.getNodePropValue(
      {
        id: "id",
        label: "label",
        properties: {
          testString: [{ id: "123", value: numberValue }],
        },
      },
      "testString",
    );

    expect(value).toEqual(numberValue);
  });

  it("should get boolean node property", () => {
    const booleanValue = true;
    const value = GraphData.getNodePropValue(
      {
        id: "id",
        label: "label",
        properties: {
          testString: [{ id: "123", value: booleanValue }],
        },
      },
      "testString",
    );

    expect(value).toEqual(booleanValue);
  });
});
