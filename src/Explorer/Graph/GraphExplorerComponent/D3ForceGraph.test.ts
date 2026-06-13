/*eslint-disable jest/no-test-callback */
import * as sinon from "sinon";
import GraphTab from "../../Tabs/GraphTab";
import { D3Link, D3Node, GraphData } from "../GraphExplorerComponent/GraphData";
import { D3ForceGraph, D3GraphNodeData, LoadMoreDataAction } from "./D3ForceGraph";

describe("D3ForceGraph", () => {
  const v1Id = "v1";
  const l1: D3Link = {
    id: "id1",
    inV: v1Id,
    outV: "v2",
    label: "l1",
    source: null,
    target: null,
  };

  it("should count neighbors", () => {
    const l2: D3Link = {
      id: "id1",
      inV: "v2",
      outV: v1Id,
      label: "l2",
      source: null,
      target: null,
    };

    const l3: D3Link = {
      id: "id1",
      inV: v1Id,
      outV: "v3",
      label: "l3",
      source: null,
      target: null,
    };

    const links = [l1, l2, l3];
    const count = D3ForceGraph.countEdges(links);

    expect(count.get(v1Id)).toBe(3);
    expect(count.get("v2")).toBe(2);
    expect(count.get("v3")).toBe(1);
  });

  describe("Behavior", () => {
    let forceGraph: D3ForceGraph;
    let rootNode: SVGSVGElement;

    const newGraph: GraphData<D3Node, D3Link> = new GraphData();
    newGraph.addVertex({
      id: v1Id,
      label: "vlabel1",
      _isRoot: true,
    });
    newGraph.addVertex({
      id: "v2",
      label: "vlabel2",
    });
    newGraph.addEdge(l1);

    beforeAll(() => {
      rootNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      rootNode.setAttribute("class", "maingraph");
    });

    afterAll(() => {
      rootNode.remove();
    });

    beforeEach(() => {
      forceGraph = new D3ForceGraph({
        igraphConfig: GraphTab.createIGraphConfig(),
        onHighlightedNode: sinon.spy(),
        //eslint-disable-next-line
        onLoadMoreData: (action: LoadMoreDataAction): void => {},

        // parent to graph
        onInitialized: sinon.spy(),

        // For unit testing purposes
        onGraphUpdated: null,
      });

      forceGraph.init(rootNode);
    });

    afterEach(() => {
      forceGraph.destroy();
    });

    it("should render graph d3 nodes and edges", (done) => {
      forceGraph.params.onGraphUpdated = () => {
        expect($(rootNode).find(".nodes").length).toBe(1);
        expect($(rootNode).find(".links").length).toBe(1);
        done();
      };

      forceGraph.updateGraph(newGraph);
    });

    it("should render vertices (as circle)", (done) => {
      forceGraph.params.onGraphUpdated = () => {
        expect($(rootNode).find(".node circle").length).toBe(2);
        done();
      };

      forceGraph.updateGraph(newGraph);
    });

    it("should render vertex label", (done) => {
      forceGraph.params.onGraphUpdated = () => {
        expect($(rootNode).find(`text:contains(${v1Id})`).length).toBe(1);
        done();
      };

      forceGraph.updateGraph(newGraph);
    });

    it("should render root vertex", (done) => {
      forceGraph.params.onGraphUpdated = () => {
        expect($(rootNode).find(".node.root").length).toBe(1);
        done();
      };

      forceGraph.updateGraph(newGraph);
    });

    it("should render edge", (done) => {
      forceGraph.params.onGraphUpdated = () => {
        expect($(rootNode).find("path.link").length).toBe(1);
        done();
      };

      forceGraph.updateGraph(newGraph);
    });

    it("should call onInitialized callback", () => {
      expect((forceGraph.params.onInitialized as sinon.SinonSpy).calledOnce).toBe(true);
    });

    it("should call onHighlightedNode callback when mouse hovering over node", () => {
      forceGraph.params.onGraphUpdated = () => {
        const mouseoverEvent = document.createEvent("Events");
        mouseoverEvent.initEvent("mouseover", true, false);
        $(rootNode).find(".node")[0].dispatchEvent(mouseoverEvent); // [0] is v1 vertex
        expect($(rootNode).find(".node")[0]).toBe(1);

        // onHighlightedNode is always called once to clear the selection
        expect((forceGraph.params.onHighlightedNode as sinon.SinonSpy).calledTwice).toBe(true);

        const onHighlightedNode = (forceGraph.params.onHighlightedNode as sinon.SinonSpy).args[1][0] as D3GraphNodeData;
        expect(onHighlightedNode).not.toBe(null);
        expect(onHighlightedNode.id).toEqual(v1Id);
      };

      forceGraph.updateGraph(newGraph, forceGraph.igraphConfig);
    });
  });
});
