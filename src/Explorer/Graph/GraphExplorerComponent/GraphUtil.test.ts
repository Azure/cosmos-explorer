import * as sinon from "sinon";
import { GraphData, GremlinEdge, GremlinVertex } from "./GraphData";
import { GraphExplorer } from "./GraphExplorer";
import * as GraphUtil from "./GraphUtil";
const OUT_E_MATCHER = "g\\.V\\(.*\\).outE\\(\\).*\\.as\\('e'\\).inV\\(\\)\\.as\\('v'\\)\\.select\\('e', *'v'\\)";
const IN_E_MATCHER = "g\\.V\\(.*\\).inE\\(\\).*\\.as\\('e'\\).outV\\(\\)\\.as\\('v'\\)\\.select\\('e', *'v'\\)";

describe("Process Gremlin vertex", () => {
  let graphData: GraphData<GremlinVertex, GremlinEdge>;

  beforeEach(() => {
    graphData = new GraphData();
    sinon.spy(graphData, "addEdge");
  });

  it("Should create incoming edge from vertex", () => {
    const v: GremlinVertex = {
      id: "id",
      label: "label",
      inE: {
        inEdge: [{ id: "id1", outV: "outV1" }],
      },
    };
    GraphUtil.createEdgesfromNode(v, graphData);
    const expectedEdge: GremlinEdge = { id: "id1", inV: "id", outV: "outV1", label: "inEdge" };
    const actualEdge = (<sinon.SinonSpy>graphData.addEdge).getCall(0).args[0];
    expect(actualEdge).toEqual(expectedEdge);
  });
  it("Should create outgoing edge from vertex", () => {
    const v: GremlinVertex = {
      id: "id",
      label: "label",
      outE: {
        outEdge: [{ id: "id2", inV: "inV2" }],
      },
    };
    GraphUtil.createEdgesfromNode(v, graphData);
    const expectedEdge: GremlinEdge = { id: "id2", inV: "inV2", outV: "id", label: "outEdge" };
    const actualEdge = (<sinon.SinonSpy>graphData.addEdge).getCall(0).args[0];
    expect(actualEdge).toEqual(expectedEdge);
  });

  it("Should remember new nodes", () => {
    const v: GremlinVertex = {
      id: "id",
      label: "label",
      inE: {
        inEdge: [{ id: "id1", outV: "outV1" }],
      },
      outE: {
        outEdge: [
          { id: "id2", inV: "inV2" },
          { id: "id3", inV: "inV3" },
        ],
      },
    };
    const newNodes = {};
    GraphUtil.createEdgesfromNode(v, graphData, newNodes);
    const keys = Object.keys(newNodes);
    expect(keys.length).toEqual(3);
    expect(keys.indexOf("outV1")).toBeGreaterThan(-1);
    expect(keys.indexOf("inV2")).toBeGreaterThan(-1);
    expect(keys.indexOf("inV3")).toBeGreaterThan(-1);
  });
});

describe("getLimitedArrayString()", () => {
  const expectedEmptyResult = { result: "", consumedCount: 0 };
  it("should handle null array", () => {
    expect(GraphUtil.getLimitedArrayString(undefined, 10)).toEqual(expectedEmptyResult);
  });

  it("should handle empty array", () => {
    expect(GraphUtil.getLimitedArrayString([], 10)).toEqual(expectedEmptyResult);
  });

  it("should handle 1st element exceeding max limit", () => {
    expect(GraphUtil.getLimitedArrayString(["123", "1", "2"], 4)).toEqual(expectedEmptyResult);
  });

  it("should handle nth element makes it exceed max limit", () => {
    const expected = {
      result: "'1','2'",
      consumedCount: 2,
    };
    expect(GraphUtil.getLimitedArrayString(["1", "2", "12345", "4", "5"], 10)).toEqual(expected);
  });

  it("should consume all elements if limit never exceeding limit", () => {
    const expected = {
      result: "'1','22','3'",
      consumedCount: 3,
    };
    expect(GraphUtil.getLimitedArrayString(["1", "22", "3"], 12)).toEqual(expected);
  });
});

describe("fetchEdgeVertexPairs()", () => {
  const pkid = "'id'";
  const max = GraphExplorer.WITHOUT_STEP_ARGS_MAX_CHARS;
  const startIndex = 0;
  const pageSize = max - 10; // stay below the limit

  it("should perform outE() query", () => {
    expect(GraphUtil.createFetchEdgePairQuery(true, pkid, [], startIndex, pageSize, max)).toMatch(
      new RegExp(OUT_E_MATCHER, "g"),
    );
  });

  it("should perform inE() query", () => {
    expect(GraphUtil.createFetchEdgePairQuery(false, pkid, [], startIndex, pageSize, max)).toMatch(
      new RegExp(IN_E_MATCHER, "g"),
    );
  });

  it("should contain .has(id, without()) step which contains excludedIds", () => {
    expect(GraphUtil.createFetchEdgePairQuery(true, pkid, ["id1", "id2"], startIndex, pageSize, max)).toMatch(
      /\.has\(id, *without\('id1', *'id2'\)\)/g,
    );
  });

  it("should not contain .without() when excludedIds is empty step", () => {
    expect(GraphUtil.createFetchEdgePairQuery(true, pkid, [], startIndex, pageSize, max)).toMatch(/^((?!without).)*$/g);
  });

  it("should fetch with .limit() and not .range() step if excludedIds not too big", () => {
    const regex = new RegExp(`\\.limit\\(${pageSize}\\)`, "g");
    expect(GraphUtil.createFetchEdgePairQuery(true, pkid, ["id1", "id2"], startIndex, pageSize, max)).toMatch(regex);
    expect(GraphUtil.createFetchEdgePairQuery(true, pkid, ["id1", "id2"], startIndex, pageSize, max)).toMatch(
      /^((?!range).)*$/g,
    );
  });

  it("should fetch with .range() and not .limit() step if excludedIds is too big", () => {
    const excludedIds = ["id1", "id2", "ids3"];
    const smallLimit = 8; // just enough to consume only id1
    const start = 12;
    const size = 15;
    const expectedStart = 12 - 1; // Request to start from 12, but exclude id1 (1 element), so we start from 11
    const regex = new RegExp(`\\.range\\(${expectedStart}, *${expectedStart + size}\\)`, "g");
    expect(GraphUtil.createFetchEdgePairQuery(true, pkid, excludedIds, start, size, smallLimit)).toMatch(regex);
    expect(GraphUtil.createFetchEdgePairQuery(true, pkid, excludedIds, start, size, smallLimit)).toMatch(
      /^((?!limit).)*$/g,
    );
  });
});

describe("Trim graph when loading new edges", () => {
  const grandpa: GremlinVertex = { id: "grandpa", label: "label" };
  const root: GremlinVertex = { id: "root", label: "label", _ancestorsId: [grandpa.id] };
  const johndoe: GremlinVertex = { id: "johndoe", label: "label" };
  let graphData: GraphData<GremlinVertex, GremlinEdge>;

  beforeEach(() => {
    graphData = new GraphData();
    graphData.addVertex(grandpa);
    graphData.addVertex(root);
    graphData.addVertex(johndoe);
    GraphUtil.trimGraph(root, graphData);
  });

  it("should not remove current root", () => {
    expect(graphData.hasVertexId(root.id)).toBe(true);
  });

  it("should not remove ancestors of current root", () => {
    expect(graphData.hasVertexId(grandpa.id)).toBe(true);
  });

  it("should make all ancestors fixed position", () => {
    expect(root._isFixedPosition).toBe(true);
    expect(grandpa._isFixedPosition).toBe(true);
  });

  it("should remove any other vertices", () => {
    expect(graphData.hasVertexId(johndoe.id)).toBe(false);
  });
});

describe("Add root child to graph", () => {
  const root: GremlinVertex = { id: "root", label: "label" };
  const kiddo: GremlinVertex = { id: "kiddo", label: "label" };
  let graphData: GraphData<GremlinVertex, GremlinEdge>;

  beforeEach(() => {
    graphData = new GraphData();
    graphData.addVertex(root);
    graphData.addVertex(kiddo);

    GraphUtil.addRootChildToGraph(root, kiddo, graphData);
  });

  it("should add child to graph", () => {
    expect(graphData.hasVertexId(kiddo.id)).toBe(true);
  });

  it("should add root to child ancestors", () => {
    expect(!!kiddo._ancestorsId && kiddo._ancestorsId.indexOf(root.id) > -1).toBe(true);
  });
});
