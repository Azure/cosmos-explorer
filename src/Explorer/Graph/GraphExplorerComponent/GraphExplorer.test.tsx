jest.mock("../../../Common/dataAccess/queryDocuments");
jest.mock("../../../Common/dataAccess/queryDocumentsPage");
import { mount, ReactWrapper } from "enzyme";
import * as Q from "q";
import React from "react";
import * as sinon from "sinon";
import "../../../../externals/jquery.typeahead.min";
import { queryDocuments } from "../../../Common/dataAccess/queryDocuments";
import { queryDocumentsPage } from "../../../Common/dataAccess/queryDocumentsPage";
import * as DataModels from "../../../Contracts/DataModels";
import * as StorageUtility from "../../../Shared/StorageUtility";
import { TabComponent } from "../../Controls/Tabs/TabComponent";
import { ConsoleDataType } from "../../Menus/NotificationConsole/NotificationConsoleComponent";
import GraphTab from "../../Tabs/GraphTab";
import * as D3ForceGraph from "./D3ForceGraph";
import { GraphData } from "./GraphData";
import { GraphAccessor, GraphExplorer, GraphExplorerProps, GraphHighlightedNodeData } from "./GraphExplorer";

describe("Check whether query result is vertex array", () => {
  it("should reject null as vertex array", () => {
    expect(GraphExplorer.isVerticesNonEmptyArray(null)).toBe(false);
  });
  it("should accept empty array as vertex array", () => {
    expect(GraphExplorer.isVerticesNonEmptyArray([])).toBe(true);
  });
  it("should reject object with primitives as vertex array", () => {
    expect(GraphExplorer.isVerticesNonEmptyArray([1, "2"])).toBe(false);
  });
  it("should reject results missing type as vertex array", () => {
    expect(GraphExplorer.isVerticesNonEmptyArray([{ id: "1" }])).toBe(false);
  });
  it("should check valid vertex array", () => {
    expect(GraphExplorer.isVerticesNonEmptyArray([{ id: "1", type: "vertex" }])).toBe(true);
  });
});

describe("Check whether query result is edge-vertex array", () => {
  it("should reject null as edge-vertex array", () => {
    expect(GraphExplorer.isEdgeVertexPairArray(null)).toBe(false);
  });
  it("should accept empty array as edge-vertex array", () => {
    expect(GraphExplorer.isEdgeVertexPairArray([])).toBe(true);
  });
  it("should reject object with primitives as edge-vertex array", () => {
    expect(GraphExplorer.isEdgeVertexPairArray([1, "2"])).toBe(false);
  });
  it("should reject results missing types as edge-vertex array", () => {
    expect(GraphExplorer.isEdgeVertexPairArray([{ e: {}, v: {} }])).toBe(false);
  });
  it("should check valid edge-vertex array", () => {
    expect(
      GraphExplorer.isEdgeVertexPairArray([
        {
          e: { id: "ide", type: "edge" },
          v: { id: "idv", type: "vertex" },
        },
      ])
    ).toBe(true);
  });
});

describe("Create proper pkid pair", () => {
  it("should enclose string pk with quotes", () => {
    expect(GraphExplorer.generatePkIdPair("test", "id")).toEqual("['test', 'id']");
  });

  it("should not enclose non-string pk with quotes", () => {
    expect(GraphExplorer.generatePkIdPair(2, "id")).toEqual("[2, 'id']");
  });
});

describe("getPkIdFromDocumentId", () => {
  const createFakeDoc = (override: any) => ({
    _rid: "_rid",
    _self: "_self",
    _etag: "_etag",
    _ts: 1234,
    ...override,
  });

  it("should create pkid pair from non-partitioned graph", () => {
    const doc = createFakeDoc({ id: "id" });
    expect(GraphExplorer.getPkIdFromDocumentId(doc, undefined)).toEqual("'id'");
    expect(GraphExplorer.getPkIdFromDocumentId(doc, "_partitiongKey")).toEqual("'id'");
  });

  it("should create pkid pair from partitioned graph (pk as string)", () => {
    const doc = createFakeDoc({ id: "id", mypk: "pkvalue" });
    expect(GraphExplorer.getPkIdFromDocumentId(doc, "mypk")).toEqual("['pkvalue', 'id']");
  });

  it("should create pkid pair from partitioned graph (pk as number)", () => {
    const doc = createFakeDoc({ id: "id", mypk: 234 });
    expect(GraphExplorer.getPkIdFromDocumentId(doc, "mypk")).toEqual("[234, 'id']");
  });

  it("should create pkid pair from partitioned graph (pk as boolean)", () => {
    const doc = createFakeDoc({ id: "id", mypk: true });
    expect(GraphExplorer.getPkIdFromDocumentId(doc, "mypk")).toEqual("[true, 'id']");
  });

  it("should create pkid pair from partitioned graph (pk as valid array value)", () => {
    const doc = createFakeDoc({ id: "id", mypk: [{ id: "someid", _value: "pkvalue" }] });
    expect(GraphExplorer.getPkIdFromDocumentId(doc, "mypk")).toEqual("['pkvalue', 'id']");
  });

  it("should error if id is not a string or number", () => {
    let doc = createFakeDoc({ id: { foo: 1 } });
    try {
      GraphExplorer.getPkIdFromDocumentId(doc, undefined);
      expect(true).toBe(false);
    } catch (e) {
      expect(true).toBe(true);
    }

    doc = createFakeDoc({ id: true });
    try {
      GraphExplorer.getPkIdFromDocumentId(doc, undefined);
      expect(true).toBe(false);
    } catch (e) {
      expect(true).toBe(true);
    }
  });

  it("should error if pk is empty array", () => {
    let doc = createFakeDoc({ mypk: [] });
    try {
      GraphExplorer.getPkIdFromDocumentId(doc, "mypk");
      expect(true).toBe(false);
    } catch (e) {
      expect(true).toBe(true);
    }

    // Array must be [{ id: string, _value: string }]
    doc = createFakeDoc({ mypk: [{ foo: 1 }] });
    try {
      GraphExplorer.getPkIdFromDocumentId(doc, "mypk");
      expect(true).toBe(false);
    } catch (e) {
      expect(true).toBe(true);
    }
  });
});

describe("GraphExplorer", () => {
  const gremlinRU = 789.12;

  const createMockProps = (): GraphExplorerProps => {
    const igraphConfig = GraphTab.createIGraphConfig();
    const igraphConfigUi = GraphTab.createIGraphConfigUiData(igraphConfig);

    return {
      onGraphAccessorCreated: (instance: GraphAccessor): void => {},
      onIsNewVertexDisabledChange: (isEnabled: boolean): void => {},
      onIsPropertyEditing: (isEditing: boolean): void => {},
      onIsGraphDisplayed: (isDisplayed: boolean): void => {},
      onResetDefaultGraphConfigValues: (): void => {},

      onIsFilterQueryLoadingChange: (isFilterQueryLoading: boolean): void => {},
      onIsValidQueryChange: (isValidQuery: boolean): void => {},

      collectionPartitionKeyProperty: "collectionPartitionKeyProperty",
      graphBackendEndpoint: "graphBackendEndpoint",
      databaseId: "databaseId",
      collectionId: "collectionId",
      masterKey: "masterKey",

      onLoadStartKey: 0,
      onLoadStartKeyChange: (newKey: number): void => {},
      resourceId: "resourceId",

      /* TODO Figure out how to make this Knockout-free */
      igraphConfigUiData: igraphConfigUi,
      igraphConfig: igraphConfig,
      setIConfigUiData: (data: string[]): void => {},
    };
  };

  describe("Initial rendering", () => {
    it("should load graph", () => {
      const props: GraphExplorerProps = createMockProps();
      const wrapper = mount(<GraphExplorer {...props} />);
      expect(wrapper.exists(".loadGraphBtn")).toBe(true);
      wrapper.unmount();
    });

    it("should not display graph json switch", () => {
      const props: GraphExplorerProps = createMockProps();
      const wrapper = mount(<GraphExplorer {...props} />);
      expect(wrapper.find(TabComponent).length).toBe(0);
      wrapper.unmount();
    });
  });

  describe("Behavior", () => {
    let graphExplorerInstance: GraphExplorer;
    let wrapper: ReactWrapper;

    let connectStub: sinon.SinonSpy;
    let submitToBackendSpy: sinon.SinonSpy;
    let renderResultAsJsonStub: sinon.SinonSpy;
    let onMiddlePaneInitializedStub: sinon.SinonSpy;
    let mockGraphRenderer: D3ForceGraph.GraphRenderer;

    const DOCDB_G_DOT_V_QUERY =
      "select root.id, root.collectionPartitionKeyProperty from root where IS_DEFINED(root._isEdge) = false order by root._ts asc"; // g.V() in docdb
    const gVRU = 123.456;

    const disableMonacoEditor = (graphExplorer: GraphExplorer) => {
      renderResultAsJsonStub = sinon.stub(graphExplorer, "renderResultAsJson").callsFake(
        (): JSX.Element => {
          return <div>[Monaco Editor Stub]</div>;
        }
      );
    };

    interface AjaxResponse {
      response: any;
      isLast: boolean; // to indicate when to call done()
    }

    interface BackendResponses {
      [query: string]: AjaxResponse;
    }

    const setupMocks = (
      graphExplorer: GraphExplorer,
      backendResponses: BackendResponses,
      done: any,
      ignoreD3Update: boolean
    ) => {
      const complete = (): void => {
        wrapper.update();
        done();
      };

      submitToBackendSpy = sinon.spy(graphExplorer, "submitToBackend");

      disableMonacoEditor(graphExplorer);

      // Calling this d3 function makes nodejs barf. Disable.
      onMiddlePaneInitializedStub = sinon.stub(graphExplorer, "onMiddlePaneInitialized").callsFake(() => {
        // Stub instance of graph renderer
        mockGraphRenderer = {
          selectNode: sinon.spy(),
          resetZoom: sinon.spy(),
          updateGraph: sinon.stub().callsFake(() => complete()),
          enableHighlight: sinon.spy(),
        };
        graphExplorer.d3ForceGraph = mockGraphRenderer;
      });

      const client = graphExplorer.gremlinClient.client;
      connectStub = sinon.stub(client, "connect").callsFake(() => {
        for (let requestId in client.requestsToSend) {
          const requestArgs = client.requestsToSend[requestId].args;
          const query = (requestArgs as any).gremlin;
          const backendResponse = backendResponses[query];
          if (!backendResponse) {
            console.error(`Unknown query ${query}. FIX YOUR UNIT TEST.`);
            Object.keys(backendResponses).forEach((k: string) => {
              console.log(`backendresponses: ${k} = ${backendResponses[k]}`);
            });
            complete();
            return;
          }
          setTimeout(() => {
            delete client.requestsToSend[requestId];
            client.params.successCallback({
              requestId: requestId,
              data: backendResponse.response,
              requestCharge: gremlinRU,
            });

            if (backendResponse.isLast) {
              if (ignoreD3Update) {
                setTimeout(() => complete(), 0);
                return;
              }
            }
          }, 0);
        }
      });
    };

    const createFetchOutEQuery = (vertexId: string, limit: number): string => {
      return `g.V('${vertexId}').outE().limit(${limit}).as('e').inV().as('v').select('e', 'v')`;
    };

    const createFetchInEQuery = (vertexId: string, limit: number): string => {
      return `g.V('${vertexId}').inE().limit(${limit}).as('e').outV().as('v').select('e', 'v')`;
    };

    const isVisible = (selector: string): boolean => {
      return wrapper.exists(selector);
    };

    const bringUpGraphExplorer = (
      docDBResponse: AjaxResponse,
      backendResponses: BackendResponses,
      done: any,
      ignoreD3Update: boolean
    ): GraphExplorer => {
      (queryDocuments as jest.Mock).mockImplementation((container: any, query: string, options: any) => {
        return {
          _query: query,
          nextItem: (callback: (error: any, document: DataModels.DocumentId) => void): void => {},
          hasMoreResults: () => false,
          executeNext: (callback: (error: any, documents: DataModels.DocumentId[], headers: any) => void): void => {},
        };
      });
      (queryDocumentsPage as jest.Mock).mockImplementation(
        (rid: string, iterator: any, firstItemIndex: number, options: any) => {
          return Q.resolve({
            hasMoreResults: false,
            firstItemIndex: firstItemIndex,
            lastItemIndex: 0,
            itemCount: 0,
            documents: docDBResponse.response,
            activityId: "",
            headers: [] as any[],
            requestCharge: gVRU,
          });
        }
      );
      const props: GraphExplorerProps = createMockProps();
      wrapper = mount(<GraphExplorer {...props} />);
      graphExplorerInstance = wrapper.instance() as GraphExplorer;
      setupMocks(graphExplorerInstance, backendResponses, done, ignoreD3Update);
      return graphExplorerInstance;
    };

    const cleanUpStubsWrapper = () => {
      jest.resetAllMocks();
      connectStub.restore();
      submitToBackendSpy.restore();
      renderResultAsJsonStub.restore();
      onMiddlePaneInitializedStub.restore();
      wrapper.unmount();
    };

    beforeAll(() => {
      StorageUtility.LocalStorageUtility.setEntryString(StorageUtility.StorageKey.IsCrossPartitionQueryEnabled, "true");
    });

    describe("Load Graph button", () => {
      beforeEach(async (done) => {
        const backendResponses: BackendResponses = {};
        backendResponses["g.V()"] = backendResponses["g.V('1')"] = {
          response: [{ id: "1", type: "vertex" }],
          isLast: false,
        };
        backendResponses[createFetchOutEQuery("1", GraphExplorer.LOAD_PAGE_SIZE + 1)] = { response: [], isLast: false };
        backendResponses[createFetchInEQuery("1", GraphExplorer.LOAD_PAGE_SIZE + 1)] = { response: [], isLast: true };

        const docDBResponse: AjaxResponse = { response: [{ id: "1" }], isLast: false };

        bringUpGraphExplorer(docDBResponse, backendResponses, done, false);

        wrapper.find(".loadGraphBtn button").simulate("click");
      });

      afterEach(() => {
        cleanUpStubsWrapper();
      });

      it("should not submit g.V() to websocket", () => {
        expect((graphExplorerInstance.submitToBackend as sinon.SinonSpy).calledWith("g.V()")).toBe(false);
      });

      it("should submit g.V() as docdb query with proper parameters", () => {
        expect(queryDocuments).toBeCalledWith("databaseId", "collectionId", DOCDB_G_DOT_V_QUERY, {
          maxItemCount: GraphExplorer.ROOT_LIST_PAGE_SIZE,
          enableCrossPartitionQuery: true,
        });
      });

      it("should call backend thrice (user query, fetch outE, then fetch inE)", () => {
        expect(connectStub.callCount).toBe(3);
      });
    });

    describe("Execute Gremlin Query button", () => {
      beforeEach((done) => {
        const backendResponses: BackendResponses = {};
        backendResponses["g.V()"] = backendResponses["g.V('2')"] = {
          response: [{ id: "2", type: "vertex" }],
          isLast: false,
        };
        backendResponses[createFetchOutEQuery("2", GraphExplorer.LOAD_PAGE_SIZE + 1)] = { response: [], isLast: false };
        backendResponses[createFetchInEQuery("2", GraphExplorer.LOAD_PAGE_SIZE + 1)] = { response: [], isLast: true };

        const docDBResponse: AjaxResponse = { response: [{ id: "2" }], isLast: false };

        bringUpGraphExplorer(docDBResponse, backendResponses, done, false);

        wrapper.find("button.queryButton").simulate("click");
      });

      afterEach(() => {
        cleanUpStubsWrapper();
      });

      it("should not submit g.V() to websocket", () => {
        expect((graphExplorerInstance.submitToBackend as sinon.SinonSpy).calledWith("g.V()")).toBe(false);
      });

      it("should submit g.V() as docdb query with proper parameters", () => {
        expect(queryDocuments).toBeCalledWith("databaseId", "collectionId", DOCDB_G_DOT_V_QUERY, {
          maxItemCount: GraphExplorer.ROOT_LIST_PAGE_SIZE,
          enableCrossPartitionQuery: true,
        });
      });

      it("should call backend thrice (user query, fetch outE, then fetch inE)", () => {
        expect(connectStub.callCount).toBe(3);
      });
    });

    /* jest-enzyme don't appear to track d3's DOM changes, because they are done outside of React.
       Here we test that the proper graph updates are passed to d3 via updateGraphData.
       TODO Testing of the rendering itself from graphData to d3 nodes should be done in D3ForceGraph.
    */
    describe("Render graph results", () => {
      const node1Id = "vertex1";
      const node2Id = "vertex2";
      const edge1Id = "edge1";
      const prop1Id = "p1Id";
      const prop1Val1 = "p1v1";
      const linkLabel = "link1";
      const label1 = "label1";
      const label2 = "label2";

      const edge = {
        id: edge1Id,
        inV: node2Id,
        outV: node1Id,
        label: linkLabel,
        type: "edge",
      };

      beforeEach((done) => {
        const backendResponses: BackendResponses = {};
        // TODO Make this less dependent on spaces, order and quotes
        backendResponses["g.V()"] = backendResponses[`g.V('${node1Id}','${node2Id}')`] = {
          response: [
            {
              id: node1Id,
              label: label1,
              type: "vertex",
              properties: { prop1Id: [{ id: "id123", value: prop1Val1 }] },
            },
            {
              id: node2Id,
              label: label2,
              type: "vertex",
            },
          ],
          isLast: false,
        };

        backendResponses[createFetchOutEQuery(node1Id, GraphExplorer.LOAD_PAGE_SIZE + 1)] = {
          response: [
            {
              e: edge,
              v: {
                id: node2Id,
                label: label2,
                type: "vertex",
              },
            },
          ],
          isLast: false,
        };
        backendResponses[createFetchInEQuery(node1Id, GraphExplorer.LOAD_PAGE_SIZE)] = { response: [], isLast: true };

        backendResponses[createFetchOutEQuery(node2Id, GraphExplorer.LOAD_PAGE_SIZE + 1)] = {
          response: [],
          isLast: false,
        };
        backendResponses[createFetchInEQuery(node2Id, GraphExplorer.LOAD_PAGE_SIZE + 1)] = {
          response: [
            {
              e: {
                id: edge1Id,
                inV: node2Id,
                outV: node1Id,
                label: linkLabel,
                type: "edge",
              },
              v: {
                id: node1Id,
                label: label1,
                type: "vertex",
              },
            },
          ],
          isLast: true,
        };

        const docDBResponse: AjaxResponse = { response: [{ id: node1Id }, { id: node2Id }], isLast: false };

        // Data is a graph with two vertices linked to each other
        bringUpGraphExplorer(docDBResponse, backendResponses, done, false);

        wrapper.find("button.queryButton").simulate("click");
      });

      afterEach(() => {
        cleanUpStubsWrapper();
      });

      // Middle pane and graph
      it("should display middle pane", () => {
        expect(isVisible(".maingraphContainer")).toBe(true);
      });

      it("should not show json results", () => {
        expect(isVisible(".graphJsonEditor")).toBe(false);
      });

      it("should render svg root elements", () => {
        expect(isVisible(".maingraphContainer svg")).toBe(true);
        expect(isVisible(".maingraphContainer svg g#loadMoreIcon")).toBe(true);
        expect(isVisible(".maingraphContainer svg marker")).toBe(true);
        expect(isVisible(".maingraphContainer svg symbol g#triangleRight")).toBe(true);
      });

      it("should update the graph with proper nodes", () => {
        let newGraph = (mockGraphRenderer.updateGraph as sinon.SinonSpy).args[0][0];
        // Hydrate
        const graphData = new GraphData();
        Object.assign(graphData, newGraph);

        expect(graphData.ids).toContain(node1Id);
        expect(graphData.ids).toContain(node2Id);
      });

      it("should update the graph with proper edges", () => {
        let newGraph = (mockGraphRenderer.updateGraph as sinon.SinonSpy).args[0][0];
        // Hydrate
        const graphData = new GraphData();
        Object.assign(graphData, newGraph);

        expect(graphData.edges).toEqual([edge]);
      });

      describe("Expand graph", () => {
        beforeEach(() => {
          wrapper.find(".graphExpandCollapseBtn").simulate("click");
        });

        it("should make left pane disappear", () => {
          expect(isVisible(".leftPane")).toBe(false);
        });

        it("should make right pane disappear", () => {
          expect(isVisible(".rightPane .panelContent")).toBe(false);
        });

        it("should make middle pane stay", () => {
          expect(isVisible(".middlePane")).toBe(true);
        });
      });

      // Left pane
      it("should display left pane", () => {
        expect(isVisible(".leftPane")).toBe(true);
      });

      it("should not display Load More (root nodes)", () => {
        expect(wrapper.exists(".loadMore a")).toBe(false);
      });

      it("should display list of clickable nodes", () => {
        const leftPaneLinks = wrapper.find(".leftPane a");
        expect(leftPaneLinks.length).toBe(2);
        expect(leftPaneLinks.at(0).text()).toBe(node1Id);
        expect(leftPaneLinks.at(1).text()).toBe(node2Id);
      });

      describe("Select root node", () => {
        let loadNeighborsPageStub: sinon.SinonSpy;

        beforeEach((done) => {
          loadNeighborsPageStub = sinon.stub(graphExplorerInstance, "loadNeighborsPage").callsFake(() => {
            return Q.resolve();
          });

          // Find link with node2Id
          const links = wrapper.find(".leftPane a");
          for (let i = 0; i < links.length; i++) {
            const link = links.at(i);
            if (link.text() === node2Id) {
              link.simulate("click");
              setTimeout(done, 0);
              return;
            }
          }
        });

        afterEach(() => {
          loadNeighborsPageStub.restore();
        });

        it("should update node for right pane", () => {
          expect((wrapper.state("highlightedNode") as GraphHighlightedNodeData).id).toBe(node2Id);
          expect(wrapper.state("selectedRootId")).toBe(node2Id);
        });
      });

      // Right pane
      it("should display right pane", () => {
        expect(isVisible(".rightPane")).toBe(true);
      });

      it("should display right pane expanded", () => {
        expect(wrapper.state("isPropertiesCollapsed")).toBe(false);
      });

      describe("Collapsible right pane", () => {
        beforeEach(() => {
          wrapper.find(".graphExpandCollapseBtn").simulate("click");
        });

        it("should make right pane collapse", () => {
          expect(wrapper.state("isPropertiesCollapsed")).toBe(true);
        });
      });

      it("graph autoviz should be enabled by default", () => {
        expect(graphExplorerInstance.isGraphAutoVizDisabled).toBe(false);
      });

      it("should display RU consumption", () => {
        // Find link for query stats
        const links = wrapper.find(".toggleSwitch");
        let isRUDisplayed = false;
        for (let i = 0; i < links.length; i++) {
          const link = links.at(i);
          if (link.text() === GraphExplorer.QUERY_STATS_BUTTON_LABEL) {
            link.simulate("click");

            const values = wrapper.find(".queryMetricsSummary td");
            for (let j = 0; j < values.length; j++) {
              if (Number(values.at(j).text()) === gVRU) {
                isRUDisplayed = true;
                break;
              }
            }
            break;
          }
        }

        expect(isRUDisplayed).toBe(true);
      });
    });

    describe("Handle graph result processing error", () => {
      let reportToConsole: sinon.SinonSpy;
      let processGremlinQueryResultsStub: sinon.SinonSpy;
      let graphExplorerInstance: GraphExplorer;

      beforeEach((done) => {
        const backendResponses: BackendResponses = {};
        // TODO Make this less dependent on spaces, order and quotes
        backendResponses["g.V()"] = {
          response: "invalid response",
          isLast: true,
        };

        const docDBResponse: AjaxResponse = { response: [], isLast: false };

        // Data is a graph with two vertices linked to each other
        graphExplorerInstance = bringUpGraphExplorer(docDBResponse, backendResponses, done, false);
        processGremlinQueryResultsStub = sinon
          .stub(graphExplorerInstance, "processGremlinQueryResults")
          .callsFake(() => {
            done();
            throw new Error("This is an error");
          });
        reportToConsole = sinon.spy(GraphExplorer, "reportToConsole");

        wrapper.find(".loadGraphBtn button").simulate("click");
      });

      afterEach(() => {
        cleanUpStubsWrapper();
        reportToConsole.restore();
        processGremlinQueryResultsStub.restore();
      });

      it("should display error", () => {
        expect(reportToConsole.calledWith(ConsoleDataType.Error)).toBe(true);
      });
    });

    describe("when isGraphAutoVizDisabled setting is true (autoviz disabled)", () => {
      beforeEach((done) => {
        const backendResponses: BackendResponses = {};
        backendResponses["g.V()"] = backendResponses["g.V('3')"] = {
          response: [{ id: "3", type: "vertex" }],
          isLast: true,
        };
        const docDBResponse: AjaxResponse = { response: [{ id: "3" }], isLast: false };

        bringUpGraphExplorer(docDBResponse, backendResponses, done, true);
        graphExplorerInstance.isGraphAutoVizDisabled = true;
        wrapper.find("button.queryButton").simulate("click");
      });

      afterEach(() => {
        cleanUpStubsWrapper();
      });

      it("should show json results", () => {
        expect(isVisible(".graphJsonEditor"));
      });

      it("should not show graph results", () => {
        expect(!isVisible(".middlePane"));
      });
    });
  });
});
