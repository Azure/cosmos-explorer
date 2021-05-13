import { FeedOptions, ItemDefinition, QueryIterator, Resource } from "@azure/cosmos";
import * as Q from "q";
import * as React from "react";
import LoadGraphIcon from "../../../../images/LoadGraph.png";
import LoadingIndicatorIcon from "../../../../images/LoadingIndicator_3Squares.gif";
import * as Constants from "../../../Common/Constants";
import { queryDocuments } from "../../../Common/dataAccess/queryDocuments";
import { queryDocumentsPage } from "../../../Common/dataAccess/queryDocumentsPage";
import { getErrorMessage } from "../../../Common/ErrorHandlingUtils";
import * as DataModels from "../../../Contracts/DataModels";
import * as ViewModels from "../../../Contracts/ViewModels";
import { InputProperty } from "../../../Contracts/ViewModels";
import * as StorageUtility from "../../../Shared/StorageUtility";
import { LocalStorageUtility, StorageKey } from "../../../Shared/StorageUtility";
import { Action } from "../../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";
import { logConsoleError, logConsoleInfo, logConsoleProgress } from "../../../Utils/NotificationConsoleUtils";
import { EditorReact } from "../../Controls/Editor/EditorReact";
import * as InputTypeaheadComponent from "../../Controls/InputTypeahead/InputTypeaheadComponent";
import * as TabComponent from "../../Controls/Tabs/TabComponent";
import { ConsoleDataType } from "../../Menus/NotificationConsole/NotificationConsoleComponent";
import { IGraphConfig } from "../../Tabs/GraphTab";
import { ArraysByKeyCache } from "./ArraysByKeyCache";
import * as D3ForceGraph from "./D3ForceGraph";
import { EdgeInfoCache } from "./EdgeInfoCache";
import * as GraphData from "./GraphData";
import * as GraphUtil from "./GraphUtil";
import { GraphVizComponentProps } from "./GraphVizComponent";
import * as GremlinClient from "./GremlinClient";
import * as LeftPane from "./LeftPaneComponent";
import { MiddlePaneComponent } from "./MiddlePaneComponent";
import * as NodeProperties from "./NodePropertiesComponent";
import { QueryContainerComponent } from "./QueryContainerComponent";
export interface GraphAccessor {
  applyFilter: () => void;
  addVertex: (v: ViewModels.NewVertexData) => Q.Promise<void>;
  shareIGraphConfig: (igraphConfig: IGraphConfig) => void;
}

export interface GraphExplorerProps {
  /* Command bar */
  onGraphAccessorCreated: (instance: GraphAccessor) => void;
  onIsNewVertexDisabledChange: (isEnabled: boolean) => void;
  onIsPropertyEditing: (isEditing: boolean) => void;
  onIsGraphDisplayed: (isDisplayed: boolean) => void;
  onResetDefaultGraphConfigValues: () => void;

  onIsFilterQueryLoadingChange: (isFilterQueryLoading: boolean) => void;
  onIsValidQueryChange: (isValidQuery: boolean) => void;

  collectionPartitionKeyProperty: string;
  graphBackendEndpoint: string;
  databaseId: string;
  collectionId: string;
  masterKey: string;

  onLoadStartKey: number;
  onLoadStartKeyChange: (newKey: number) => void;
  resourceId: string;

  igraphConfigUiData: ViewModels.IGraphConfigUiData;
  igraphConfig: IGraphConfig;

  setIConfigUiData?: (data: string[]) => void;
}

export interface GraphHighlightedNodeData {
  id: string;
  label: string;
  properties: { [id: string]: ViewModels.GremlinPropertyValueType[] };
  areNeighborsUnknown: boolean;
  sources: NeighborVertexBasicInfo[];
  targets: NeighborVertexBasicInfo[];
}

export interface NeighborVertexBasicInfo {
  name: string;
  id: string;
  edgeId: string;
  edgeLabel: string;
}

export interface GraphExplorerError {
  title: string;
  details?: string;
}

type Id2NodeMap = { [id: string]: GraphData.GremlinVertex }; // Node lookup table by id: id <--> node

enum FilterQueryStatus {
  NoResult,
  GraphEmptyResult,
  GraphResult,
  Loading,
  NonGraphResult,
  ErrorResult,
}

interface GraphExplorerState {
  /* Left Pane */
  isFilterGraphEmptyResult: boolean;
  selectedRootId: string;
  hasMoreRoots: boolean;

  /* Middle Pane */
  isTabsContentExpanded: boolean;
  isBackendExecuting: boolean;

  /* Right Pane */
  isPropertiesCollapsed: boolean;
  highlightedNode: GraphHighlightedNodeData;
  possibleEdgeLabels: InputTypeaheadComponent.Item[];
  nodePropertiesViewMode: NodeProperties.Mode;

  /* Internal */
  rootMap: Id2NodeMap;

  /* Outside of graph area */
  latestPartialQueries: InputTypeaheadComponent.Item[];
  isNewVertexDisabled: boolean;
  resultDisplay: ResultDisplay;
  filterQueryError: string;
  filterQueryWarning: string;
  filterQueryStatus: FilterQueryStatus;
  change: string;

  igraphConfigUiData: ViewModels.IGraphConfigUiData;
  igraphConfig: IGraphConfig;
}

export interface EditedProperties {
  pkId: string; // either: `"id"` (non-partitioned collection) or `"pk","id"` (partitioned collection)
  readOnlyProperties: ViewModels.InputProperty[];
  existingProperties: ViewModels.InputProperty[];
  addedProperties: ViewModels.InputProperty[];
  droppedKeys: string[]; // to calculate what was dropped
}

export interface PossibleVertex extends InputTypeaheadComponent.Item {
  value: string;
  caption: string;
}

export interface EditedEdges {
  vertexId: string;
  currentNeighbors: NeighborVertexBasicInfo[];
  droppedIds: string[];
  addedEdges: GraphNewEdgeData[]; // ids
}

export interface GraphNewEdgeData {
  label: string;
  inputInV: string;
  inputOutV: string;
}

interface EdgeVertexPair {
  e: GraphData.GremlinEdge;
  v: GraphData.GremlinVertex;
}

enum ResultDisplay {
  None,
  Graph,
  Json,
  Stats,
}

interface UserQueryResult {
  requestCharge: string;
}

type PartitionKeyValueType = string | number | boolean;

export class GraphExplorer extends React.Component<GraphExplorerProps, GraphExplorerState> {
  public static readonly LOAD_PAGE_SIZE = 10; // nb of nodes to load at a time
  public static readonly PAGE_ALL = 1000;
  private static readonly VERTEX_CACHE_SIZE = 500;
  private static readonly EDGE_VERTEX_CACHE_MAX_SIZE = 500;
  public static readonly WITHOUT_STEP_ARGS_MAX_CHARS = 10000; // maximums char size of the without() step parameter
  public static readonly ROOT_LIST_PAGE_SIZE = 100;
  private static readonly MAX_LATEST_QUERIES = 10;
  private static readonly MAX_RESULT_SIZE = 10000;

  private static readonly TAB_INDEX_JSON = 0;
  private static readonly TAB_INDEX_GRAPH = 1;
  private static readonly TAB_INDEX_STATS = 2;

  private static readonly DISPLAY_DEFAULT_PROPERTY_KEY = "name"; // display this property by default if exists
  private static readonly REQUEST_CHARGE_UNKNOWN_MSG = "Request charge unknown";

  /* TODO Move this out of GraphExplorer */
  public static readonly NONE_CHOICE = "None";
  public static readonly QUERY_STATS_BUTTON_LABEL = "Query Stats";

  /* *********************************** */

  public d3ForceGraph: D3ForceGraph.GraphRenderer;
  private originalGraphData: GraphData.GraphData<GraphData.GremlinVertex, GraphData.GremlinEdge>; // Original data untouched by d3

  // Cache Gremlin query results for navigation
  private outECache: ArraysByKeyCache<EdgeVertexPair>;
  private inECache: ArraysByKeyCache<EdgeVertexPair>;
  private edgeInfoCache: EdgeInfoCache;

  private executeCounter: number;
  public gremlinClient: GremlinClient.GremlinClient;
  private queryRawData: string;
  private queryTotalRequestCharge: string;

  private currentDocDBQueryInfo: {
    iterator: QueryIterator<ItemDefinition & Resource>;
    index: number;
    query: string;
  };

  // Outside of graph
  private static readonly DEFAULT_QUERY = "g.V()";
  private queryResultTabs: TabComponent.Tab[];
  public isGraphAutoVizDisabled: boolean;

  // For caching only
  private lastReportedIsPropertyEditing: boolean;
  private lastReportedIsNewVertexDisabled: boolean;

  public getNodeProperties: string[];
  public igraphConfigUi: ViewModels.IGraphConfigUiData;
  public constructor(props: GraphExplorerProps) {
    super(props);
    this.state = {
      isFilterGraphEmptyResult: false,
      selectedRootId: null,
      hasMoreRoots: false,
      isTabsContentExpanded: false,
      isBackendExecuting: false,
      isPropertiesCollapsed: false,
      highlightedNode: null,
      possibleEdgeLabels: [],
      nodePropertiesViewMode: NodeProperties.Mode.READONLY_PROP,
      rootMap: {},
      latestPartialQueries: [],
      isNewVertexDisabled: false,
      resultDisplay: ResultDisplay.None,
      filterQueryError: null,
      filterQueryWarning: null,
      filterQueryStatus: FilterQueryStatus.NoResult,
      change: null,
      igraphConfigUiData: this.props.igraphConfigUiData,
      igraphConfig: this.props.igraphConfig,
    };

    // Not part of React state
    this.originalGraphData = new GraphData.GraphData();
    this.outECache = new ArraysByKeyCache<EdgeVertexPair>(GraphExplorer.EDGE_VERTEX_CACHE_MAX_SIZE);
    this.inECache = new ArraysByKeyCache<EdgeVertexPair>(GraphExplorer.EDGE_VERTEX_CACHE_MAX_SIZE);
    this.edgeInfoCache = new EdgeInfoCache(GraphExplorer.VERTEX_CACHE_SIZE);
    this.executeCounter = 0;

    this.queryResultTabs = [
      {
        title: "JSON",
        content: {
          className: "graphJsonEditor graphTabContent",
          render: () => this.renderResultAsJson(),
        },
        isVisible: () => true,
      },
      {
        title: "Graph",
        content: {
          className: "graphTabContent",
          render: () => this.renderResultAsGraph(),
        },
        isVisible: () => this.state.filterQueryStatus === FilterQueryStatus.GraphResult,
      },
      {
        title: GraphExplorer.QUERY_STATS_BUTTON_LABEL,
        content: {
          className: "graphTabContent",
          render: () => this.renderResultStats(),
        },
        isVisible: () => true,
      },
    ];

    this.queryRawData = null;
    this.queryTotalRequestCharge = GraphExplorer.REQUEST_CHARGE_UNKNOWN_MSG;
    this.isGraphAutoVizDisabled = LocalStorageUtility.hasItem(StorageKey.IsGraphAutoVizDisabled)
      ? LocalStorageUtility.getEntryBoolean(StorageKey.IsGraphAutoVizDisabled)
      : false;

    this.gremlinClient = new GremlinClient.GremlinClient();
    if (this.props.graphBackendEndpoint) {
      this.setGremlinParams();
    }

    const selectedNode = this.state.highlightedNode;

    props.onGraphAccessorCreated({
      applyFilter: this.submitQuery.bind(this),
      addVertex: this.addVertex.bind(this),
      shareIGraphConfig: this.shareIGraphConfig.bind(this),
    });
  } // constructor

  public shareIGraphConfig(igraphConfig: IGraphConfig) {
    this.setState({
      igraphConfig: { ...igraphConfig },
    });

    const selectedNode = this.state.highlightedNode;
    if (selectedNode) {
      this.updatePropertiesPane(selectedNode.id);
      this.setResultDisplay(GraphExplorer.TAB_INDEX_GRAPH);
    }
  }

  /**
   * If pk is a string, return ["pk", "id"]
   * else return [pk, "id"]
   * @param pk
   * @param id
   */
  public static generatePkIdPair(pk: PartitionKeyValueType, id: string) {
    const pkStr = typeof pk === "string" ? `'${pk}'` : `${pk}`;
    return `[${pkStr}, '${GraphUtil.escapeSingleQuotes(id)}']`;
  }

  public updateVertexProperties(editedProperties: EditedProperties): Q.Promise<GremlinClient.GremlinRequestResult> {
    const partitionKeyProperty = this.props.collectionPartitionKeyProperty;

    // aggregate all the properties, remove dropped ones
    let finalProperties = editedProperties.existingProperties.concat(editedProperties.addedProperties);

    // Compose the query
    let pkId = editedProperties.pkId;
    let updateQueryFragment = "";

    finalProperties.forEach((p) => {
      // Partition key cannot be updated
      if (p.key === partitionKeyProperty) {
        return;
      }

      // DO NOT UPDATE Multi-value properties (as this is not supported)
      if (p.values.length === 1) {
        updateQueryFragment += `.Property("${GraphUtil.escapeDoubleQuotes(p.key)}", ${GraphUtil.getQuotedPropValue(
          p.values[0]
        )})`;
      }
    });

    let promise: Q.Promise<GremlinClient.GremlinRequestResult> = null;

    // Compute dropped keys (partition key cannot be dropped)
    const droppedKeys: string[] = [];
    $.each(editedProperties.droppedKeys, (index: number, key: string) => {
      if (key !== partitionKeyProperty) {
        droppedKeys.push(key);
      }
    });

    if (updateQueryFragment.length === 0 && droppedKeys.length === 0) {
      GraphExplorer.reportToConsole(ConsoleDataType.Info, "Nothing to update");
      this.setNodePropertiesViewMode(NodeProperties.Mode.READONLY_PROP);
      return Q.resolve({
        data: [],
        isIncomplete: false,
      });
    }

    if (droppedKeys.length > 0) {
      // TODO Wait for dropping to end. Can we drop all of them in a single query?
      // Must execute these drops sequentially to avoid a 500 "{"Message":"An error has occurred."}"
      promise = this.submitToBackend(
        `g.V(${pkId}).properties("${GraphUtil.escapeDoubleQuotes(droppedKeys[0])}").drop()`
      );
      for (let i = 1; i < droppedKeys.length; i++) {
        promise = promise.then(() => {
          return this.submitToBackend(
            `g.V(${pkId}).properties("${GraphUtil.escapeDoubleQuotes(droppedKeys[i])}").drop()`
          );
        });
      }
    } else {
      promise = Q.resolve({
        data: [],
        isIncomplete: false,
      });
    }

    // Now when drops are done, update remaining properties
    // Note: execute g.V(id) if updateQueryFragment is '' (nothing to update), in order to get a vertex response
    // to update the in-memory graph
    promise = promise.then(() => {
      return this.submitToBackend(`g.V(${pkId})${updateQueryFragment}`);
    });

    // Update in-memory graph and close editor
    promise
      .then((result: GremlinClient.GremlinRequestResult) => {
        // Update graph style dropdown options
        this.collectNodeProperties(this.originalGraphData.vertices);

        // Update graph (in case property is being shown)
        this.updateInMemoryGraph(result.data);
        this.updateGraphData(this.originalGraphData, this.state.igraphConfig);
      })
      .then(
        () => {
          this.setNodePropertiesViewMode(NodeProperties.Mode.READONLY_PROP);
        },
        (error: string) => {
          GraphExplorer.reportToConsole(ConsoleDataType.Error, "Failed to update vertex properties: " + error);
        }
      );

    return promise;
  }

  /**
   * Called from ko binding
   * @param id
   */
  public selectNode(id: string) {
    if (!this.d3ForceGraph) {
      console.warn("Attempting to select node, but d3ForceGraph not initialized, yet.");
      return;
    }

    this.d3ForceGraph.selectNode(id);
  }

  public deleteHighlightedNode() {
    if (!this.state.highlightedNode) {
      GraphExplorer.reportToConsole(ConsoleDataType.Error, "No highlighted node to remove.");
      return;
    }
    const id = this.state.highlightedNode.id;
    this.submitToBackend(`g.V(${this.getPkIdFromNodeData(this.state.highlightedNode)}).drop()`).then(
      () => {
        // Remove vertex from local cache
        const graphData = this.originalGraphData;
        graphData.removeVertex(id, false);
        this.updateGraphData(graphData, this.state.igraphConfig);
        this.setState({ highlightedNode: null });

        // Remove from root map
        const rootMap = this.state.rootMap;
        delete rootMap[id];
        this.setState({ rootMap: rootMap });

        if (this.getPossibleRootNodes().length > 0) {
          this.selectRootNode(this.getPossibleRootNodes()[0].id);
        }
      },
      (error: string) => {
        GraphExplorer.reportToConsole(
          ConsoleDataType.Error,
          `Failed to remove node (Gremlin failed to execute). id=${id} : ${error}`
        );
      }
    );
  }

  /**
   * Is of type: {e: GremlinEdge, v: GremlinVertex}[]
   * @param data
   */
  public static isEdgeVertexPairArray(data: any) {
    if (!(data instanceof Array)) {
      GraphExplorer.reportToConsole(ConsoleDataType.Info, "Query result not an array", data);
      return false;
    }

    let pairs: any[] = data;
    for (let i = 0; i < pairs.length; i++) {
      const item = pairs[i];
      if (
        !item.hasOwnProperty("e") ||
        !item.hasOwnProperty("v") ||
        !item["e"].hasOwnProperty("id") ||
        !item["e"].hasOwnProperty("type") ||
        item["e"].type !== "edge" ||
        !item["v"].hasOwnProperty("id") ||
        !item["v"].hasOwnProperty("type") ||
        item["v"].type !== "vertex"
      ) {
        return false;
      }
    }
    return true;
  }

  /**
   * Query outgoing edge + vertex pairs: starting from startIndex and fetch pageSize items
   * @param outE true: fetch outE, false: fetch inE
   * @param vertex
   * @param startIndex
   * @param pageSize
   */
  public fetchEdgeVertexPairs(
    outE: boolean,
    vertex: GraphData.GremlinVertex,
    startIndex: number,
    pageSize: number
  ): Q.Promise<EdgeVertexPair[]> {
    if (startIndex < 0) {
      const error = `Attempt to fetch edge-vertex pairs with negative index: outE:${outE}, vertex id:${vertex.id}, startIndex:${startIndex}, pageSize:${pageSize}`;
      GraphExplorer.reportToConsole(ConsoleDataType.Error, error);
      throw error;
    }

    // Try hitting cache first
    const cache = outE ? this.outECache : this.inECache;
    const pairs = cache.retrieve(vertex.id, startIndex, pageSize);
    if (pairs != null && pairs.length === pageSize) {
      const msg = `Retrieved ${pairs.length} ${outE ? "outE" : "inE"} edges from cache for vertex id: ${vertex.id}`;
      GraphExplorer.reportToConsole(ConsoleDataType.Info, msg);
      return Q.resolve(pairs);
    }

    const excludedEdgeIds = outE ? vertex._outEdgeIds : vertex._inEdgeIds;
    const gremlinQuery = GraphUtil.createFetchEdgePairQuery(
      outE,
      this.getPkIdFromVertex(vertex),
      excludedEdgeIds,
      startIndex,
      pageSize,
      GraphExplorer.WITHOUT_STEP_ARGS_MAX_CHARS
    );

    return this.submitToBackend(gremlinQuery).then((result: GremlinClient.GremlinRequestResult) => {
      const data = result.data;
      if (data === null) {
        const error = `Failed to load incoming edge/pairs for ${vertex.id} (query result is null)`;
        GraphExplorer.reportToConsole(ConsoleDataType.Error, error);
        throw error;
      }

      // Check if result is an array of edge/vertex pairs
      if (!GraphExplorer.isEdgeVertexPairArray(data)) {
        const error = `Failed to load incoming edge/pairs for ${vertex.id} (query result not a valid array of edge/vertex pairs)`;
        GraphExplorer.reportToConsole(ConsoleDataType.Error, error, data);
        throw error;
      }

      // Cache result
      const pairs = data as EdgeVertexPair[];
      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];
        cache.insert(vertex.id, startIndex + i, pair);

        // Merge with possible cached edge information
        this.edgeInfoCache.mergeEdgeInfo(pair.v);
      }

      return pairs;
    });
  }

  /**
   * Query a page of neighbors using Gremlin and update what to show in the graph
   * Always fetch all outE first, because they live in the same partition as vertex. inE() is a fan-out expensive query.
   * @param vertex Vertex whose neighbors we want to load
   * @param graphData loaded vertices are stored in there
   * @param generation Generation of vertex parameter. This method is recursive, keep track of distance from root node. 0=root node
   * @param offsetIndex Index at which we start loading the nodes (in case of paging)
   * @param return promise: for caller to execute code when fetching is done
   */
  public loadNeighborsPage(
    vertex: GraphData.GremlinVertex,
    graphData: GraphData.GraphData<GraphData.GremlinVertex, GraphData.GremlinEdge>,
    offsetIndex: number
  ): Q.Promise<GraphData.GraphData<GraphData.GremlinVertex, GraphData.GremlinEdge>> {
    const updateGraphData = () => {
      // Cache results
      this.edgeInfoCache.addVertex(vertex);

      graphData.setAsRoot(vertex.id);
      this.updateGraphData(graphData, this.state.igraphConfig);
    };

    vertex._outEdgeIds = vertex._outEdgeIds || [];
    vertex._inEdgeIds = vertex._inEdgeIds || [];
    if (
      offsetIndex >= vertex._outEdgeIds.length + vertex._inEdgeIds.length &&
      vertex._outEAllLoaded &&
      vertex._inEAllLoaded
    ) {
      console.info("No more edges to load for vertex " + vertex.id);
      updateGraphData();
      return Q.resolve(graphData);
    }

    // TODO For now, discard previously loaded edges and fetch again.
    // The following assumes that outE's are loaded before inE's
    if (offsetIndex <= vertex._outEdgeIds.length) {
      vertex._outEdgeIds.splice(offsetIndex, vertex._outEdgeIds.length - offsetIndex);
      vertex._inEdgeIds = [];
      vertex._outEAllLoaded = false;
      vertex._inEAllLoaded = false;
    } else if (offsetIndex <= vertex._outEdgeIds.length + vertex._inEdgeIds.length) {
      const relativeOffset = offsetIndex - vertex._outEdgeIds.length;
      vertex._inEdgeIds.splice(relativeOffset, vertex._inEdgeIds.length - relativeOffset);
    }

    GraphUtil.trimGraph(vertex, graphData);
    const totalEdgesToFetch = GraphExplorer.LOAD_PAGE_SIZE + 1;
    let addedEdgesNb = 0;

    let promise: Q.Promise<number> = null;
    if (!vertex._outEAllLoaded) {
      promise = this.fetchEdgeVertexPairs(true, vertex, offsetIndex, totalEdgesToFetch).then(
        (pairs: EdgeVertexPair[]) => {
          vertex._outEAllLoaded = pairs.length < totalEdgesToFetch;

          const pairsToAdd = pairs.slice(0, GraphExplorer.LOAD_PAGE_SIZE);
          pairsToAdd.forEach((p: EdgeVertexPair) => {
            GraphData.GraphData.addOutE(vertex, p.e.label, p.e);
            GraphUtil.addRootChildToGraph(vertex, p.v, graphData);
            graphData.addEdge(p.e);
            vertex._outEdgeIds.push(p.e.id);

            // Cache results (graphdata now contains a vertex with inE's filled in)
            this.edgeInfoCache.addVertex(graphData.getVertexById(p.v.id));
          });
          addedEdgesNb += pairsToAdd.length;
          return pairs.length;
        }
      );
    } else {
      promise = Q.resolve(0);
    }

    promise = promise.then(
      (outEPairsNb: number): Q.Promise<number> => {
        const inEdgesToFetch = totalEdgesToFetch - outEPairsNb;
        if (!vertex._inEAllLoaded && inEdgesToFetch > 0) {
          let start: number;
          if (offsetIndex <= vertex._outEdgeIds.length) {
            start = 0;
          } else {
            start = offsetIndex - vertex._outEdgeIds.length;
          }

          return this.fetchEdgeVertexPairs(false, vertex, start, inEdgesToFetch).then(
            (pairs: EdgeVertexPair[]): number => {
              vertex._inEAllLoaded = pairs.length < inEdgesToFetch;

              const pairsToAdd = pairs.slice(0, GraphExplorer.LOAD_PAGE_SIZE - outEPairsNb);
              pairsToAdd.forEach((p: EdgeVertexPair) => {
                GraphData.GraphData.addInE(vertex, p.e.label, p.e);
                GraphUtil.addRootChildToGraph(vertex, p.v, graphData);
                graphData.addEdge(p.e);
                vertex._inEdgeIds.push(p.e.id);

                // Cache results (graphdata now contains a vertex with outE's filled in)
                this.edgeInfoCache.addVertex(graphData.getVertexById(p.v.id));
              });
              addedEdgesNb += pairsToAdd.length;
              return outEPairsNb + pairs.length;
            }
          );
        } else {
          return Q.resolve(outEPairsNb);
        }
      }
    );

    return promise.then((nbPairsFetched: number) => {
      if (offsetIndex >= GraphExplorer.LOAD_PAGE_SIZE || !vertex._outEAllLoaded || !vertex._inEAllLoaded) {
        vertex._pagination = {
          total:
            (vertex._pagination && vertex._pagination.total) ||
            (vertex._outEAllLoaded && vertex._inEAllLoaded
              ? vertex._outEdgeIds.length + vertex._inEdgeIds.length
              : null),
          currentPage: {
            start: offsetIndex,
            end: offsetIndex + addedEdgesNb,
          },
        };
      }
      updateGraphData();
      return graphData;
    });
  }

  /**
   * Submit graph query to Gremlin backend
   * @param cmd
   */
  public submitToBackend(cmd: string): Q.Promise<GremlinClient.GremlinRequestResult> {
    const clearConsoleProgress = GraphExplorer.reportToConsole(ConsoleDataType.InProgress, `Executing: ${cmd}`);
    this.setExecuteCounter(this.executeCounter + 1);

    return this.gremlinClient.execute(cmd).then(
      (result: GremlinClient.GremlinRequestResult) => {
        this.setExecuteCounter(this.executeCounter - 1);
        clearConsoleProgress();
        if (result.isIncomplete) {
          const msg = `The query results are too large and only partial results are displayed for: ${cmd}`;
          GraphExplorer.reportToConsole(ConsoleDataType.Error, msg);
          this.setState({ filterQueryWarning: msg });
        }
        GraphExplorer.reportToConsole(
          ConsoleDataType.Info,
          `Executed: ${cmd} ${GremlinClient.GremlinClient.getRequestChargeString(result.totalRequestCharge)}`
        );
        return result;
      },
      (err: string) => {
        this.setExecuteCounter(this.executeCounter - 1);
        GraphExplorer.reportToConsole(ConsoleDataType.Error, `Gremlin query failed: ${cmd}`, err);
        clearConsoleProgress();
        throw err;
      }
    );
  }

  /**
   * Execute DocDB query and get all results
   */
  public async executeNonPagedDocDbQuery(query: string): Promise<DataModels.DocumentId[]> {
    try {
      // TODO maxItemCount: this reduces throttling, but won't cap the # of results
      const iterator: QueryIterator<ItemDefinition & Resource> = queryDocuments(
        this.props.databaseId,
        this.props.collectionId,
        query,
        {
          maxItemCount: GraphExplorer.PAGE_ALL,
          enableCrossPartitionQuery:
            StorageUtility.LocalStorageUtility.getEntryString(
              StorageUtility.StorageKey.IsCrossPartitionQueryEnabled
            ) === "true",
        } as FeedOptions
      );
      const response = await iterator.fetchNext();

      return response?.resources;
    } catch (error) {
      GraphExplorer.reportToConsole(
        ConsoleDataType.Error,
        `Failed to execute non-paged query ${query}. Reason:${error}`,
        error
      );
      return null;
    }
  }

  /**
   * Create a new edge in docdb and update graph
   * @param e
   */
  public createNewEdge(e: GraphNewEdgeData): Q.Promise<any> {
    const q = `g.V('${GraphUtil.escapeSingleQuotes(e.inputOutV)}').addE('${GraphUtil.escapeSingleQuotes(
      e.label
    )}').To(g.V('${GraphUtil.escapeSingleQuotes(e.inputInV)}'))`;
    return this.submitToBackend(q).then(
      (result: GremlinClient.GremlinRequestResult) => {
        const edges: GraphData.GremlinEdge[] = result.data;
        if (!edges) {
          GraphExplorer.reportToConsole(ConsoleDataType.Error, "Failed to create edge (empty response).");
          return;
        }

        // update graph
        if (!edges || edges.length < 1) {
          GraphExplorer.reportToConsole(ConsoleDataType.Error, "Failed to create edge (no edge in response).");
          return;
        }

        let edge = edges[0];
        let graphData = this.originalGraphData;
        graphData.addEdge(edge);

        // Allow loadNeighbors to load list new edge
        if (graphData.hasVertexId(edge.inV)) {
          graphData.getVertexById(edge.inV)._outEAllLoaded = false;
        }
        if (graphData.hasVertexId(edge.outV)) {
          graphData.getVertexById(edge.outV)._inEAllLoaded = false;
        }

        this.updateGraphData(graphData, this.state.igraphConfig);
      },
      (error: string) => {
        GraphExplorer.reportToConsole(
          ConsoleDataType.Error,
          "Failed to create edge (Gremlin query failed to execute): " + error
        );
      }
    );
  }

  /**
   * This opposite of createNewEdge.
   * Manually update in-memory graph.
   * @param edgeId
   */
  public removeEdge(edgeId: string): Q.Promise<any> {
    return this.submitToBackend(`g.E('${GraphUtil.escapeSingleQuotes(edgeId)}').drop()`).then(
      () => {
        let graphData = this.originalGraphData;
        graphData.removeEdge(edgeId, false);
        this.updateGraphData(graphData, this.state.igraphConfig);
      },
      (error: string) => {
        GraphExplorer.reportToConsole(
          ConsoleDataType.Error,
          "Failed to remove edge (Gremlin query failed to execute): " + error
        );
      }
    );
  }

  /**
   * Check if these data is an array of vertices
   * @param data
   */
  public static isVerticesNonEmptyArray(data: any): boolean {
    if (!(data instanceof Array)) {
      GraphExplorer.reportToConsole(ConsoleDataType.Error, "Query result not an array", data);
      return false;
    }

    let vertices: any[] = data;
    if (vertices.length > 0) {
      let v0 = vertices[0];
      if (!v0.hasOwnProperty("id") || !v0.hasOwnProperty("type") || v0.type !== "vertex") {
        return false;
      }
    }
    return true;
  }

  public processGremlinQueryResults(result: GremlinClient.GremlinRequestResult): void {
    const data = result.data as any;
    this.setFilterQueryStatus(FilterQueryStatus.GraphEmptyResult);

    if (data === null) {
      GraphExplorer.reportToConsole(ConsoleDataType.Error, "Filter query result is null.");
    } else {
      // Check if result is an array of vertices
      if (!GraphExplorer.isVerticesNonEmptyArray(data)) {
        GraphExplorer.reportToConsole(ConsoleDataType.Info, "Query result is not a graph");
        this.setFilterQueryStatus(FilterQueryStatus.NonGraphResult);
      } else {
        const vertices: GraphData.GremlinVertex[] = data;

        this.addToPossibleRootNodesList(vertices);

        if (vertices.length === 0) {
          // Clean graph
          this.updateGraphData(new GraphData.GraphData(), this.state.igraphConfig);
          this.setState({ highlightedNode: null });
          GraphExplorer.reportToConsole(ConsoleDataType.Info, "Query result is empty");
        }

        this.setFilterQueryStatus(FilterQueryStatus.GraphResult);
      }
    }
  }

  /**
   * User executes query
   */
  public async submitQuery(query: string): Promise<void> {
    // Clear any progress indicator
    this.executeCounter = 0;
    this.setState({
      rootMap: {},
      hasMoreRoots: false,
      selectedRootId: null,
    });
    this.setFilterQueryStatus(FilterQueryStatus.Loading);

    // Clear cache
    this.outECache.clear();
    this.inECache.clear();
    this.edgeInfoCache.clear();

    // Remember query
    this.pushToLatestQueryFragments(query);

    try {
      let result: UserQueryResult;
      if (query.toLocaleLowerCase() === "g.V()".toLocaleLowerCase()) {
        result = await this.executeDocDbGVQuery();
      } else {
        result = await this.executeGremlinQuery(query);
      }

      this.queryTotalRequestCharge = result.requestCharge;
    } catch (error) {
      const errorMsg = `Failure in submitting query: ${query}: ${getErrorMessage(error)}`;
      GraphExplorer.reportToConsole(ConsoleDataType.Error, errorMsg);
      this.setState({
        filterQueryError: errorMsg,
      });
    }
  }

  /**
   *  Create a new vertex in the graph
   * @param v
   */
  public addVertex(v: ViewModels.NewVertexData): Q.Promise<void> {
    if (!v) {
      return Q.reject("Missing vertex");
    }

    let q = `g.AddV('${GraphUtil.escapeSingleQuotes(v.label)}')`;

    $.each(v.properties, (index: number, item: InputProperty) => {
      q += `.Property('${GraphUtil.escapeSingleQuotes(item.key)}', ${GraphUtil.getQuotedPropValue(item.values[0])})`;
    });

    return this.submitToBackend(q).then(
      (result: GremlinClient.GremlinRequestResult) => {
        const vertices: GraphData.GremlinVertex[] = result.data;
        if (!vertices) {
          const err = "Failed to create vertex (no data in new vertex response)";
          GraphExplorer.reportToConsole(ConsoleDataType.Error, err, vertices);
          throw { title: err };
        }

        if (vertices == null || vertices.length < 1) {
          const err = "Failed to create vertex (no vertex in response)";
          GraphExplorer.reportToConsole(ConsoleDataType.Error, err, vertices);
          throw { title: err };
        }

        let vertex = vertices[0];
        const graphData = this.originalGraphData;
        graphData.addVertex(vertex);
        this.updateGraphData(graphData, this.state.igraphConfig);
        this.collectNodeProperties(this.originalGraphData.vertices);

        // Keep new vertex selected
        this.updatePropertiesPane(vertex.id);

        this.setFilterQueryStatus(FilterQueryStatus.GraphResult);

        // Add to Results list
        const rootMap = this.state.rootMap;
        rootMap[vertex.id] = vertex;
        this.setState({ rootMap: rootMap });
        setTimeout(() => {
          this.selectRootNode(vertex.id);
        }, 0);
      },
      (error: string) => {
        const title = "Failed to create vertex (Gremlin query failed to execute)";
        GraphExplorer.reportToConsole(ConsoleDataType.Error, title + " :" + error);
        throw { title: title, detail: error };
      }
    );
  }

  /* ************* React life-cycle methods *********** */
  public render(): JSX.Element {
    const currentTabIndex = ((resultDisplay: ResultDisplay): number => {
      switch (resultDisplay) {
        case ResultDisplay.Graph:
          return GraphExplorer.TAB_INDEX_GRAPH;
        case ResultDisplay.Stats:
          return GraphExplorer.TAB_INDEX_STATS;
        case ResultDisplay.Json:
        case ResultDisplay.None:
        default:
          return GraphExplorer.TAB_INDEX_JSON;
      }
    })(this.state.resultDisplay);

    return (
      <React.Fragment>
        {!this.state.isTabsContentExpanded && this.renderQueryContainer()}

        {this.isFilterQueryLoading() && (
          <div className="filterLoadingProgress">
            <img src={LoadingIndicatorIcon} alt="Loading Indicator" />
          </div>
        )}

        {this.state.filterQueryError && (
          <div className="filterQueryResultError">
            <h5>Error</h5>
            <div>{this.state.filterQueryError}</div>
          </div>
        )}
        {this.state.filterQueryWarning && (
          <div className="filterQueryResultError">
            <h5>Warning</h5>
            <div>{this.state.filterQueryWarning}</div>
          </div>
        )}

        {this.mustShowGraphHelper() && (
          <div className="loadGraphHelper">
            <img src={LoadGraphIcon} alt="Load Graph" />
            {this.renderDefaultLoadGraphButton()}
            <p>Enter query and execute</p>
          </div>
        )}

        {this.isFilterResultAvailable() && (
          <TabComponent.TabComponent
            tabs={this.queryResultTabs}
            onTabIndexChange={this.onTabIndexChange.bind(this)}
            currentTabIndex={currentTabIndex}
            hideHeader={this.state.isTabsContentExpanded}
          />
        )}
      </React.Fragment>
    );
  }

  public componentWillUnmount(): void {
    this.gremlinClient.destroy();
  }
  public componentDidMount(): void {
    if (this.props.onLoadStartKey != null && this.props.onLoadStartKey != undefined) {
      TelemetryProcessor.traceSuccess(
        Action.Tab,
        {
          databaseName: this.props.databaseId,
          collectionName: this.props.collectionId,
          dataExplorerArea: Constants.Areas.Tab,
          tabTitle: "Graph",
        },
        this.props.onLoadStartKey
      );
      this.props.onLoadStartKeyChange(null);
    }
  }

  /**
   * Used for debouncing only
   * @param isPropertyEditing
   */
  private onIsPropertyPaneEditing(isPropertyEditing: boolean) {
    if (
      typeof this.lastReportedIsPropertyEditing === "undefined" ||
      this.lastReportedIsPropertyEditing !== isPropertyEditing
    ) {
      this.props.onIsPropertyEditing(isPropertyEditing);
      this.lastReportedIsPropertyEditing = isPropertyEditing;
    }
  }

  /**
   * Used for debouncing only
   * @param isPropertyEditing
   */
  private onIsNewVertexDisabledChange(isNewVertexDisabled: boolean) {
    if (
      typeof this.lastReportedIsNewVertexDisabled === "undefined" ||
      this.lastReportedIsNewVertexDisabled !== isNewVertexDisabled
    ) {
      this.props.onIsNewVertexDisabledChange(isNewVertexDisabled);
      this.lastReportedIsNewVertexDisabled = isNewVertexDisabled;
    }
  }

  public componentDidUpdate(): void {
    this.onIsPropertyPaneEditing(this.isPropertyPaneEditing());
    this.onIsNewVertexDisabledChange(this.isNewVertexDisabled());
  }

  /* ******************************************************** */

  /**
   * Central method to report any error
   * @param msg
   * @param errorData additional errors
   * @return id
   */
  public static reportToConsole(type: ConsoleDataType.InProgress, msg: string, ...errorData: any[]): () => void;
  public static reportToConsole(type: ConsoleDataType.Info, msg: string, ...errorData: any[]): void;
  public static reportToConsole(type: ConsoleDataType.Error, msg: string, ...errorData: any[]): void;
  public static reportToConsole(type: ConsoleDataType, msg: string, ...errorData: any[]): void | (() => void) {
    let errorDataStr: string = "";
    if (errorData && errorData.length > 0) {
      console.error(msg, errorData);
      errorDataStr = ": " + JSON.stringify(errorData);
    }

    const consoleMessage = `${msg}${errorDataStr}`;

    switch (type) {
      case ConsoleDataType.Error:
        return logConsoleError(consoleMessage);
      case ConsoleDataType.Info:
        return logConsoleInfo(consoleMessage);
      case ConsoleDataType.InProgress:
        return logConsoleProgress(consoleMessage);
    }
  }

  private setNodePropertiesViewMode(viewMode: NodeProperties.Mode) {
    this.setState({ nodePropertiesViewMode: viewMode });
    this.onPropertyModeChanged(viewMode);
  }

  private setResultDisplay(display: ResultDisplay) {
    this.setState({ resultDisplay: display });

    if (display === ResultDisplay.Graph) {
      this.setNodePropertiesViewMode(NodeProperties.Mode.READONLY_PROP);

      const rootMap = this.state.rootMap;
      this.collectNodeProperties(
        Object.keys(rootMap).map((id: string) => {
          return rootMap[id];
        })
      );
      if (this.state.igraphConfigUiData.nodeProperties.indexOf(GraphExplorer.DISPLAY_DEFAULT_PROPERTY_KEY) !== -1) {
        this.setState({
          igraphConfigUiData: {
            ...this.state.igraphConfigUiData,
            nodeCaptionChoice: GraphExplorer.DISPLAY_DEFAULT_PROPERTY_KEY,
          },
        });
      }

      // Let react instantiate and render graph, before updating
      setTimeout(this.autoSelectRootNode.bind(this), 0);
    }

    this.props.onIsGraphDisplayed(display === ResultDisplay.Graph);
  }

  /**
   * Update graph icon
   * @param nodeProp to map to icon
   * @param iconSet _graph_icon_set field in document
   */
  public updateNodeIcons(nodeProp: string, iconSet: string): void {
    if (nodeProp === GraphExplorer.NONE_CHOICE) {
      this.setState({
        igraphConfig: {
          ...this.state.igraphConfig,
          nodeIconKey: undefined,
        },
      });
      return;
    }

    if (!iconSet) {
      iconSet = this.props.collectionId;
    }

    // load icon set and update graph
    const newIconsMap = {} as D3ForceGraph.D3GraphIconMap;
    this.executeNonPagedDocDbQuery(
      `SELECT c._graph_icon_property_value, c.format, c.icon FROM c WHERE c._graph_icon_set = "${GraphUtil.escapeDoubleQuotes(
        iconSet
      )}"`
    ).then(
      (documents: DataModels.DocumentId[]) => {
        $.each(documents, (index: number, doc: any) => {
          newIconsMap[doc["_graph_icon_property_value"]] = {
            data: doc["icon"],
            format: doc["format"],
          };
        });

        // Update graph configuration
        this.setState({
          igraphConfig: {
            ...this.state.igraphConfig,
            iconsMap: newIconsMap,
            nodeIconKey: nodeProp,
          },
        });
      },
      () => {
        GraphExplorer.reportToConsole(ConsoleDataType.Error, `Failed to retrieve icons. iconSet:${iconSet}`);
      }
    );
  }

  private setFilterQueryStatus(status: FilterQueryStatus) {
    this.setState({ filterQueryStatus: status });
    this.props.onIsFilterQueryLoadingChange(status === FilterQueryStatus.Loading);

    switch (status) {
      case FilterQueryStatus.NoResult:
      case FilterQueryStatus.Loading:
        this.setResultDisplay(ResultDisplay.None);
        this.setState({
          filterQueryError: null,
          filterQueryWarning: null,
        });
        break;
      case FilterQueryStatus.NonGraphResult:
      case FilterQueryStatus.GraphEmptyResult:
        this.setResultDisplay(ResultDisplay.Json);
        break;
      case FilterQueryStatus.GraphResult:
        // Possibly render graph first, before rendering graph
        if (!this.isGraphAutoVizDisabled) {
          this.setResultDisplay(ResultDisplay.Graph);
        } else {
          this.setResultDisplay(ResultDisplay.Json);
        }
        break;
      case FilterQueryStatus.ErrorResult:
        this.setResultDisplay(ResultDisplay.None);
        break;
    }
  }

  private setExecuteCounter(counter: number): void {
    this.executeCounter = counter;
    this.setState({ isBackendExecuting: this.executeCounter > 0 });
  }

  private getPossibleRootNodes(): LeftPane.CaptionId[] {
    const key = this.state.igraphConfig.nodeCaption;
    return $.map(
      this.state.rootMap,
      (value: any, index: number): LeftPane.CaptionId => {
        let result = GraphData.GraphData.getNodePropValue(value, key);
        return {
          caption: result !== undefined ? result : value.id,
          id: value.id,
        };
      }
    );
  }

  /**
   * Selecting a root node means
   * @param node
   */
  private selectRootNode(id: string): Q.Promise<any> {
    if (!this.d3ForceGraph) {
      console.warn("Attempting to reset zoom, but d3ForceGraph not initialized, yet.");
    } else {
      this.d3ForceGraph.resetZoom();
    }

    if (id === null) {
      return Q.reject();
    }
    // Find the root node
    const root = this.state.rootMap[id];

    if (!root) {
      GraphExplorer.reportToConsole(ConsoleDataType.Error, "Failed to select root node: no known vertex with id:" + id);
      return Q.reject();
    }

    // For ui purposes
    this.setState({ selectedRootId: id });

    const graphData = new GraphData.GraphData();

    // Add root node to list
    graphData.addVertex(root);
    graphData.setAsRoot(id);

    // Reset paging if number of links > page size
    if (
      root._outEAllLoaded &&
      root._inEAllLoaded &&
      root._outEdgeIds.length + root._inEdgeIds.length > GraphExplorer.LOAD_PAGE_SIZE
    ) {
      delete root._outEdgeIds;
      delete root._inEdgeIds;
      root._outEAllLoaded = false;
      root._inEAllLoaded = false;
    }

    // Load neighbors
    return this.loadNeighborsPage(root, graphData, 0).then(
      () => {
        this.collectNodeProperties(this.originalGraphData.vertices);
        this.updatePropertiesPane(id);
      },
      (reason: any) => {
        GraphExplorer.reportToConsole(ConsoleDataType.Error, `Failed to select root node. Reason:${reason}`);
      }
    );
  }

  private setGremlinParams() {
    this.gremlinClient.initialize({
      endpoint: `wss://${this.props.graphBackendEndpoint}`,
      databaseId: this.props.databaseId,
      collectionId: this.props.collectionId,
      masterKey: this.props.masterKey,
      maxResultSize: GraphExplorer.MAX_RESULT_SIZE,
    });
  }

  private onLoadMoreRootNodesClicked(): void {
    this.loadMoreRootNodes().then((results: UserQueryResult) => (this.queryTotalRequestCharge = results.requestCharge));
  }

  private renderLeftPane(): JSX.Element {
    return (
      <LeftPane.LeftPaneComponent
        isFilterGraphEmptyResult={this.state.isFilterGraphEmptyResult}
        possibleRootNodes={this.getPossibleRootNodes()}
        isUiBusy={this.isPropertyPaneEditing()}
        onRootNodeSelected={(id: string) => this.selectRootNode(id)}
        selectedRootId={this.state.selectedRootId}
        onLoadNextPage={() => this.onLoadMoreRootNodesClicked()}
        hasMoreRoots={this.state.hasMoreRoots}
      />
    );
  }
  private toggleExpandGraph(): void {
    const isTabsContentExpanded = !this.state.isTabsContentExpanded;
    this.setState({
      isTabsContentExpanded: isTabsContentExpanded,
      isPropertiesCollapsed: isTabsContentExpanded,
    });
  }

  /**
   * Retrieve property title based on the graph style preferences
   */
  private getPropertyPaneTitle(): string {
    if (!this.state.highlightedNode) {
      return "";
    }

    const nodeCaption = this.state.igraphConfigUiData.nodeCaptionChoice;
    const node = this.originalGraphData.getVertexById(this.state.highlightedNode.id);
    return GraphData.GraphData.getNodePropValue(node, nodeCaption) as string;
  }

  private onPropertiesCollapsedChanged(collapsed: boolean): void {
    this.setState({ isPropertiesCollapsed: collapsed });
  }

  /**
   * If collection is not partitioned, return 'id'.
   * If collection is partitioned, return pk-id pair.
   * @param vertex
   * @return id
   */
  private getPkIdFromVertex(v: GraphData.GremlinVertex): string {
    if (
      this.props.collectionPartitionKeyProperty &&
      v.hasOwnProperty("properties") &&
      v.properties.hasOwnProperty(this.props.collectionPartitionKeyProperty) &&
      v.properties[this.props.collectionPartitionKeyProperty].length > 0 &&
      v.properties[this.props.collectionPartitionKeyProperty][0].hasOwnProperty("value")
    ) {
      const pk = v.properties[this.props.collectionPartitionKeyProperty][0].value;
      return GraphExplorer.generatePkIdPair(pk, v.id);
    } else {
      return `'${GraphUtil.escapeSingleQuotes(v.id)}'`;
    }
  }

  /**
   * If collection is not partitioned, return 'id'.
   * If collection is partitioned, return pk-id pair.
   * @param vertex
   * @return id
   */
  private getPkIdFromNodeData(v: GraphHighlightedNodeData): string {
    if (
      this.props.collectionPartitionKeyProperty &&
      v.hasOwnProperty("properties") &&
      v.properties.hasOwnProperty(this.props.collectionPartitionKeyProperty)
    ) {
      const pk = v.properties[this.props.collectionPartitionKeyProperty];
      return GraphExplorer.generatePkIdPair(pk[0] as PartitionKeyValueType, v.id);
    } else {
      return `"${GraphUtil.escapeDoubleQuotes(v.id)}"`;
    }
  }

  /**
   * If collection is not partitioned, return 'id'.
   * If collection is partitioned, return pk-id pair.
   * public for testing purposes
   * @param vertex
   * @return id
   */
  public static getPkIdFromDocumentId(d: DataModels.DocumentId, collectionPartitionKeyProperty: string): string {
    let { id } = d;
    if (typeof id !== "string") {
      const error = `Vertex id is not a string: ${JSON.stringify(id)}.`;
      logConsoleError(error);
      throw new Error(error);
    }

    if (collectionPartitionKeyProperty && d.hasOwnProperty(collectionPartitionKeyProperty)) {
      let pk = (d as any)[collectionPartitionKeyProperty];
      if (typeof pk !== "string" && typeof pk !== "number" && typeof pk !== "boolean") {
        if (Array.isArray(pk) && pk.length > 0) {
          // pk is [{ id: 'id', _value: 'value' }]
          pk = pk[0]["_value"];
        } else {
          const error = `Vertex pk is not a string nor a non-empty array: ${JSON.stringify(pk)}.`;
          logConsoleError(error);
          throw new Error(error);
        }
      }

      return GraphExplorer.generatePkIdPair(pk, id);
    } else {
      return `'${GraphUtil.escapeSingleQuotes(id)}'`;
    }
  }

  /**
   * Update possible vertices to display in UI
   */
  private updatePossibleVertices(): Promise<PossibleVertex[]> {
    const highlightedNodeId = this.state.highlightedNode ? this.state.highlightedNode.id : null;

    const q = `SELECT c.id, c["${
      this.state.igraphConfigUiData.nodeCaptionChoice || "id"
    }"] AS p FROM c WHERE NOT IS_DEFINED(c._isEdge)`;
    return this.executeNonPagedDocDbQuery(q).then(
      (documents: DataModels.DocumentId[]) => {
        let possibleVertices = [] as PossibleVertex[];
        $.each(documents, (index: number, item: any) => {
          if (highlightedNodeId && item.id === highlightedNodeId) {
            // Exclude highlighed node in the list
            return;
          }

          // item.p can be a string (if label or id) or an object (if property)
          if (typeof item.p === "string" || item.p instanceof String) {
            possibleVertices.push({
              value: item.id,
              caption: item.p,
            });
          } else {
            if (item.hasOwnProperty("p")) {
              possibleVertices.push({
                value: item.id,
                caption: item.p[0]["_value"],
              });
            }
          }
        });
        return possibleVertices;
      },
      () => {
        GraphExplorer.reportToConsole(ConsoleDataType.Error, "Failed to retrieve list of possible vertices");
        return [];
      }
    );
  }

  /**
   * Perform Gremlin querys to drop and add edges
   * @param droppedIds
   * @param addedEdges
   * @return promise when done
   */
  private editGraphEdges(editedEdges: EditedEdges): Q.Promise<any> {
    let promises = [];
    // Drop edges
    for (let i = 0; i < editedEdges.droppedIds.length; i++) {
      let id = editedEdges.droppedIds[i];
      promises.push(this.removeEdge(id));
    }

    // Add edges
    for (let i = 0; i < editedEdges.addedEdges.length; i++) {
      let e = editedEdges.addedEdges[i];
      promises.push(
        this.createNewEdge(e).then(() => {
          // Reload neighbors in case we linked to a vertex that isn't loaded in the graph
          const highlightedVertex = this.originalGraphData.getVertexById(this.state.highlightedNode.id);
          return this.loadNeighborsPage(highlightedVertex, this.originalGraphData, 0);
        })
      );
    }

    return Q.all(promises).then(() => {
      this.updatePropertiesPane(this.state.highlightedNode.id);
    });
  }

  private onModeChanged(newMode: NodeProperties.Mode): void {
    this.setNodePropertiesViewMode(newMode);
  }

  private onHighlightedNode(nodeData: D3ForceGraph.D3GraphNodeData): void {
    if (!nodeData) {
      this.setState({ highlightedNode: null });
      return;
    }
    this.updatePropertiesPane(nodeData.id);
  }

  private onLoadMoreData(data: D3ForceGraph.LoadMoreDataAction): void {
    const v = this.originalGraphData.getVertexById(data.nodeId);
    this.originalGraphData.setAsRoot(v.id);

    const pageInfo: GraphData.PaginationInfo = v._pagination;
    const currentOffset = pageInfo ? pageInfo.currentPage.start : 0;
    const newOffset = ((pageAction: D3ForceGraph.PAGE_ACTION) => {
      switch (pageAction) {
        default:
        case D3ForceGraph.PAGE_ACTION.FIRST_PAGE:
          return 0;
        case D3ForceGraph.PAGE_ACTION.PREVIOUS_PAGE:
          return currentOffset - GraphExplorer.LOAD_PAGE_SIZE;
        case D3ForceGraph.PAGE_ACTION.NEXT_PAGE:
          return currentOffset + GraphExplorer.LOAD_PAGE_SIZE;
      }
    })(data.pageAction);

    this.loadNeighborsPage(v, this.originalGraphData, newOffset).then(() => {
      this.updatePropertiesPane(v.id);
    });
  }

  /**
   * For unit testing purposes
   */
  public onGraphUpdated(timestamp: number): void {}

  /**
   * Get node properties for styling purposes. Result is the union of all properties of all nodes.
   */
  private collectNodeProperties(vertices: GraphData.GremlinVertex[]) {
    const props = {} as any; // Hashset
    $.each(vertices, (index: number, item: GraphData.GremlinVertex) => {
      for (var p in item) {
        // DocDB: Exclude type because it's always 'vertex'
        if (p !== "type" && typeof (item as any)[p] === "string") {
          props[p] = true;
        }
      }
      // Inspect properties
      if (item.hasOwnProperty("properties")) {
        // TODO This is DocDB-graph specific
        // Assume each property value is [{value:... }]
        for (var f in item.properties) {
          props[f] = true;
        }
      }
    });

    const values = Object.keys(props);
    this.setState({
      igraphConfigUiData: {
        ...this.state.igraphConfigUiData,
        nodeProperties: values,
      },
    });

    this.props.setIConfigUiData(values);
  }

  /**
   * Update node property pane from this node id
   * @param id node id
   */
  private updatePropertiesPane(id: string) {
    if (!id || !this.originalGraphData.hasVertexId(id)) {
      this.setState({ highlightedNode: null });
      return;
    }

    let data = this.originalGraphData.getVertexById(id);

    // A bit of translation to make it easier to display
    let props: { [id: string]: ViewModels.GremlinPropertyValueType[] } = {};
    for (let p in data.properties) {
      props[p] = data.properties[p].map((gremlinProperty) => gremlinProperty.value);
    }

    // update neighbors
    let sources: NeighborVertexBasicInfo[] = [];
    let targets: NeighborVertexBasicInfo[] = [];
    this.props.onResetDefaultGraphConfigValues();
    let nodeCaption = this.state.igraphConfigUiData.nodeCaptionChoice;
    this.updateSelectedNodeNeighbors(data.id, nodeCaption, sources, targets);
    let sData: GraphHighlightedNodeData = {
      id: data.id,
      label: data.label,
      properties: props,
      areNeighborsUnknown: !data._inEdgeIds || !data._outEdgeIds,
      sources: sources, //<VertexBasicInfo[]>[],
      targets: targets, //<VertexBasicInfo[]>[]
    };

    // Update KO
    this.setState({ highlightedNode: sData });
  }

  /**
   * Update neighbors array of this node by id
   * TODO Move part of this to GraphUtil
   * @param id
   * @param sources
   * @param target
   */
  private updateSelectedNodeNeighbors(
    id: string,
    nodeCaption: string,
    sources: NeighborVertexBasicInfo[],
    targets: NeighborVertexBasicInfo[]
  ): void {
    // update neighbors
    let gd = this.originalGraphData;
    let v = gd.getVertexById(id);

    // Clear the array while keeping the references
    sources.length = 0;
    targets.length = 0;

    let possibleEdgeLabels = {} as any; // Collect all edge labels in a hashset

    for (let p in v.inE) {
      possibleEdgeLabels[p] = true;
      const edges = v.inE[p];
      $.each(edges, (index: number, edge: GraphData.GremlinShortInEdge) => {
        const neighborId = edge.outV;
        if (!gd.getVertexById(neighborId)) {
          // If id not known, it must be an edge node whose neighbor hasn't been loaded into the graph, yet
          return;
        }
        let caption = GraphData.GraphData.getNodePropValue(gd.getVertexById(neighborId), nodeCaption) as string;
        sources.push({
          name: caption,
          id: neighborId,
          edgeId: edge.id,
          edgeLabel: p,
        });
      });
    }

    for (let p in v.outE) {
      possibleEdgeLabels[p] = true;
      const edges = v.outE[p];
      $.each(edges, (index: number, edge: GraphData.GremlinShortOutEdge) => {
        const neighborId = edge.inV;
        if (!gd.getVertexById(neighborId)) {
          // If id not known, it must be an edge node whose neighbor hasn't been loaded into the graph, yet
          return;
        }
        let caption = GraphData.GraphData.getNodePropValue(gd.getVertexById(neighborId), nodeCaption) as string;
        targets.push({
          name: caption,
          id: neighborId,
          edgeId: edge.id,
          edgeLabel: p,
        });
      });
    }

    this.setState({
      possibleEdgeLabels: Object.keys(possibleEdgeLabels).map(
        (value: string, index: number, array: string[]): InputTypeaheadComponent.Item => {
          return { caption: value, value: value };
        }
      ),
    });
  }

  /**
   * Update in-memory graph
   * @param data from submitToBackend()
   */
  private updateInMemoryGraph(vertices: any[]): void {
    if (!vertices) {
      GraphExplorer.reportToConsole(ConsoleDataType.Error, "Failed to update graph (no data)", vertices);
      return;
    }
    if (!vertices || vertices.length < 1) {
      GraphExplorer.reportToConsole(ConsoleDataType.Error, "Failed to update graph (no vertex in response)");
      return;
    }

    let updatedVertex = vertices[0];
    if (this.originalGraphData.hasVertexId(updatedVertex.id)) {
      let currentVertex = this.originalGraphData.getVertexById(updatedVertex.id);
      // Copy updated properties
      if (currentVertex.hasOwnProperty("properties")) {
        delete currentVertex["properties"];
      }
      for (var p in updatedVertex) {
        (currentVertex as any)[p] = updatedVertex[p];
      }
    }

    // TODO This kind of assumes saveVertexProperty is done from property panes.
    let hn = this.state.highlightedNode;
    if (hn && hn.id === updatedVertex.id) {
      this.updatePropertiesPane(hn.id);
    }
  }

  /**
   * Clone object and keep the original untouched (by d3)
   */
  private updateGraphData(
    graphData: GraphData.GraphData<GraphData.GremlinVertex, GraphData.GremlinEdge>,
    igraphConfig?: IGraphConfig
  ) {
    this.originalGraphData = graphData;
    let gd = JSON.parse(JSON.stringify(this.originalGraphData));
    if (!this.d3ForceGraph) {
      console.warn("Attempting to update graph, but d3ForceGraph not initialized, yet.");
      return;
    }
    this.d3ForceGraph.updateGraph(gd, igraphConfig);
  }

  public onMiddlePaneInitialized(instance: D3ForceGraph.GraphRenderer): void {
    this.d3ForceGraph = instance;
  }

  private renderMiddlePane(): JSX.Element {
    const forceGraphParams: D3ForceGraph.D3ForceGraphParameters = {
      igraphConfig: this.state.igraphConfig,
      onHighlightedNode: this.onHighlightedNode.bind(this),
      onLoadMoreData: this.onLoadMoreData.bind(this),
      onInitialized: (instance: D3ForceGraph.GraphRenderer): void => {
        this.onMiddlePaneInitialized(instance);
      },
      onGraphUpdated: this.onGraphUpdated.bind(this),
    };

    const graphVizProp: GraphVizComponentProps = {
      forceGraphParams: forceGraphParams,
    };

    return (
      <MiddlePaneComponent
        isTabsContentExpanded={this.state.isTabsContentExpanded}
        toggleExpandGraph={this.toggleExpandGraph.bind(this)}
        isBackendExecuting={this.state.isBackendExecuting}
        graphVizProps={graphVizProp}
      />
    );
  }

  private renderRightPane(): JSX.Element {
    return (
      <span className="rightPane">
        <NodeProperties.NodePropertiesComponent
          expandedTitle={this.getPropertyPaneTitle()}
          isCollapsed={this.state.isPropertiesCollapsed}
          onCollapsedChanged={this.onPropertiesCollapsedChanged.bind(this)}
          node={this.state.highlightedNode}
          getPkIdFromNodeData={this.getPkIdFromNodeData.bind(this)}
          collectionPartitionKeyProperty={this.props.collectionPartitionKeyProperty}
          updateVertexProperties={this.updateVertexProperties.bind(this)}
          selectNode={this.selectNode.bind(this)}
          updatePossibleVertices={this.updatePossibleVertices.bind(this)}
          possibleEdgeLabels={this.state.possibleEdgeLabels}
          editGraphEdges={this.editGraphEdges.bind(this)}
          deleteHighlightedNode={this.deleteHighlightedNode.bind(this)}
          onModeChanged={this.onModeChanged.bind(this)}
          viewMode={this.state.nodePropertiesViewMode}
        />
      </span>
    );
  }

  private async executeDocDbGVQuery(): Promise<UserQueryResult> {
    let query = "select root.id from root where IS_DEFINED(root._isEdge) = false order by root._ts desc";
    if (this.props.collectionPartitionKeyProperty) {
      query = `select root.id, root.${this.props.collectionPartitionKeyProperty} from root where IS_DEFINED(root._isEdge) = false order by root._ts asc`;
    }

    try {
      const iterator: QueryIterator<ItemDefinition & Resource> = queryDocuments(
        this.props.databaseId,
        this.props.collectionId,
        query,
        {
          maxItemCount: GraphExplorer.ROOT_LIST_PAGE_SIZE,
          enableCrossPartitionQuery:
            LocalStorageUtility.getEntryString(StorageKey.IsCrossPartitionQueryEnabled) === "true",
        } as FeedOptions
      );
      this.currentDocDBQueryInfo = {
        iterator: iterator,
        index: 0,
        query: query,
      };
      return await this.loadMoreRootNodes();
    } catch (error) {
      GraphExplorer.reportToConsole(
        ConsoleDataType.Error,
        `Failed to execute CosmosDB query: ${query} reason:${error}`
      );
      throw error;
    }
  }

  private async loadMoreRootNodes(): Promise<UserQueryResult> {
    if (!this.currentDocDBQueryInfo) {
      return undefined;
    }

    let RU: string = GraphExplorer.REQUEST_CHARGE_UNKNOWN_MSG;
    const queryInfoStr = `${this.currentDocDBQueryInfo.query} (${this.currentDocDBQueryInfo.index + 1}-${
      this.currentDocDBQueryInfo.index + GraphExplorer.ROOT_LIST_PAGE_SIZE
    })`;
    const clearConsoleProgress = GraphExplorer.reportToConsole(
      ConsoleDataType.InProgress,
      `Executing: ${queryInfoStr}`
    );

    try {
      const results: ViewModels.QueryResults = await queryDocumentsPage(
        this.props.collectionId,
        this.currentDocDBQueryInfo.iterator,
        this.currentDocDBQueryInfo.index
      );

      clearConsoleProgress();
      this.currentDocDBQueryInfo.index = results.lastItemIndex + 1;
      this.setState({ hasMoreRoots: results.hasMoreResults });
      RU = results.requestCharge.toString();
      GraphExplorer.reportToConsole(
        ConsoleDataType.Info,
        `Executed: ${queryInfoStr} ${GremlinClient.GremlinClient.getRequestChargeString(RU)}`
      );
      const pkIds: string[] = (results.documents || []).map((item: DataModels.DocumentId) =>
        GraphExplorer.getPkIdFromDocumentId(item, this.props.collectionPartitionKeyProperty)
      );

      const arg = pkIds.join(",");
      await this.executeGremlinQuery(`g.V(${arg})`);

      return { requestCharge: RU };
    } catch (error) {
      clearConsoleProgress();
      const errorMsg = `Failed to query: ${this.currentDocDBQueryInfo.query}. Reason:${getErrorMessage(error)}`;
      GraphExplorer.reportToConsole(ConsoleDataType.Error, errorMsg);
      this.setState({
        filterQueryError: errorMsg,
      });
      this.setFilterQueryStatus(FilterQueryStatus.ErrorResult);
      throw error;
    }
  }

  private executeGremlinQuery(query: string): Q.Promise<UserQueryResult> {
    let RU = GraphExplorer.REQUEST_CHARGE_UNKNOWN_MSG;
    const promise = this.submitToBackend(query).then(
      (result: GremlinClient.GremlinRequestResult): GremlinClient.GremlinRequestResult => {
        this.queryRawData = JSON.stringify(result.data, null, "  ");
        if (result.totalRequestCharge !== undefined) {
          RU = result.totalRequestCharge.toString();
        }
        return result;
      },
      (error: string) => {
        // Failure
        const errorMsg = `Failed to execute query: ${query}: ${error}`;
        GraphExplorer.reportToConsole(ConsoleDataType.Error, errorMsg);
        this.setState({
          filterQueryError: errorMsg,
        });
        this.setFilterQueryStatus(FilterQueryStatus.ErrorResult);
        throw error;
      }
    );

    promise
      .then((result: GremlinClient.GremlinRequestResult) => this.processGremlinQueryResults(result))
      .catch((error: any) => {
        const errorMsg = `Failed to process query result: ${getErrorMessage(error)}`;
        GraphExplorer.reportToConsole(ConsoleDataType.Error, errorMsg);
        this.setState({
          filterQueryError: errorMsg,
        });
      });

    return promise.then(() => ({ requestCharge: RU }));
  }

  private addToPossibleRootNodesList(vertices: GraphData.GremlinVertex[]) {
    const rootMap = this.state.rootMap;
    $.each(vertices, (index: number, v: any) => {
      rootMap[v.id] = v;
    });
    this.setState({ rootMap: rootMap });
  }

  private isNewVertexDisabled(): boolean {
    return (
      this.state.nodePropertiesViewMode === NodeProperties.Mode.EDIT_SOURCES ||
      this.state.nodePropertiesViewMode === NodeProperties.Mode.EDIT_TARGETS ||
      this.state.nodePropertiesViewMode === NodeProperties.Mode.PROPERTY_EDITOR ||
      this.state.filterQueryStatus === FilterQueryStatus.Loading
    );
  }

  private isPropertyPaneEditing(): boolean {
    return this.state.nodePropertiesViewMode !== NodeProperties.Mode.READONLY_PROP;
  }

  private autoSelectRootNode(): void {
    if (this.state.selectedRootId) {
      this.selectRootNode(this.state.selectedRootId);
    } else {
      const possibleRootNodes = this.getPossibleRootNodes();
      if (possibleRootNodes.length > 0) {
        this.selectRootNode(possibleRootNodes[0].id);
      }
    }
  }

  private onTabIndexChange(newIndex: number): void {
    const resultDisplay = ((tabIndex: number): ResultDisplay => {
      if (tabIndex === GraphExplorer.TAB_INDEX_GRAPH) {
        return ResultDisplay.Graph;
      } else if (tabIndex === GraphExplorer.TAB_INDEX_JSON) {
        return ResultDisplay.Json;
      } else if (tabIndex === GraphExplorer.TAB_INDEX_STATS) {
        return ResultDisplay.Stats;
      } else {
        return ResultDisplay.None;
      }
    })(newIndex);
    this.setResultDisplay(resultDisplay);
  }

  private mustShowGraphHelper(): boolean {
    return this.state.filterQueryStatus === FilterQueryStatus.NoResult;
  }

  private isFilterResultAvailable(): boolean {
    return (
      this.state.filterQueryStatus === FilterQueryStatus.GraphEmptyResult ||
      this.state.filterQueryStatus === FilterQueryStatus.GraphResult ||
      this.state.filterQueryStatus === FilterQueryStatus.NonGraphResult
    );
  }

  private isFilterQueryLoading(): boolean {
    return this.state.filterQueryStatus === FilterQueryStatus.Loading;
  }

  private loadDefaultGraph() {
    this.submitQuery("g.V()");
  }

  private pushToLatestQueryFragments(q: string): void {
    if (q.length === 0) {
      return;
    }
    let lq = this.state.latestPartialQueries;
    for (let i = 0; i < lq.length; i++) {
      if (lq[i].value === q) {
        // no dupes
        return;
      }
    }

    lq.unshift({ caption: q, value: q });
    lq = lq.slice(0, GraphExplorer.MAX_LATEST_QUERIES - 1);
    this.setState({ latestPartialQueries: lq });
  }

  private onPropertyModeChanged(newMode: NodeProperties.Mode) {
    if (!this.d3ForceGraph) {
      console.warn("Attempting to enable/disable highlighting, but d3ForceGraph not initialized, yet.");
      return;
    }

    switch (newMode) {
      case NodeProperties.Mode.EDIT_SOURCES:
      case NodeProperties.Mode.EDIT_TARGETS:
      case NodeProperties.Mode.PROPERTY_EDITOR:
        this.d3ForceGraph.enableHighlight(true);
        break;
      case NodeProperties.Mode.READONLY_PROP:
      default:
        this.d3ForceGraph.enableHighlight(false);
        break;
    }
  }

  private renderQueryContainer(): JSX.Element {
    return (
      <QueryContainerComponent
        initialQuery={GraphExplorer.DEFAULT_QUERY}
        latestPartialQueries={this.state.latestPartialQueries}
        onExecuteClick={this.submitQuery.bind(this)}
        isLoading={this.isFilterQueryLoading()}
        onIsValidQueryChange={(isValidQuery: boolean) => this.props.onIsValidQueryChange(isValidQuery)}
      />
    );
  }

  public renderResultAsJson(): JSX.Element {
    return <EditorReact language={"json"} content={this.queryRawData} isReadOnly={true} ariaLabel={"Graph JSON"} />;
  }

  private renderResultAsGraph(): JSX.Element {
    return (
      <div className="graphContainer">
        {!this.state.isTabsContentExpanded && this.renderLeftPane()}
        {this.renderMiddlePane()}
        {this.renderRightPane()}
      </div>
    );
  }

  private renderResultStats(): JSX.Element {
    return (
      <div className="queryMetricsSummaryContainer">
        <table className="queryMetricsSummary">
          <thead className="queryMetricsSummaryHead">
            <tr className="queryMetricsSummaryHeader queryMetricsSummaryTuple">
              <th title="METRIC">METRIC</th>
              <th />
              <th title="VALUE">VALUE</th>
            </tr>
          </thead>
          <tbody className="queryMetricsSummaryBody">
            <tr className="queryMetricsSummaryTuple">
              <td title="Request Charge">Request Charge</td>
              <td />
              <td>{this.queryTotalRequestCharge}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  private renderDefaultLoadGraphButton(): JSX.Element {
    return (
      <React.Fragment>
        <p className="loadGraphBtn">
          <button className="filterbtnstyle" onClick={this.loadDefaultGraph.bind(this)}>
            Load graph
          </button>
        </p>
        <p>or</p>
      </React.Fragment>
    );
  }
}
