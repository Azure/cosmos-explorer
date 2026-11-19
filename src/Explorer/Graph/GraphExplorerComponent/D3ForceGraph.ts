import { BaseType } from "d3";
import { map as d3Map } from "d3-collection";
import { D3DragEvent, drag } from "d3-drag";
import { forceCollide, forceLink, forceManyBody, forceSimulation } from "d3-force";
import { interpolate, interpolateNumber } from "d3-interpolate";
import { scaleOrdinal } from "d3-scale";
import { schemeCategory10 } from "d3-scale-chromatic";
import { select, selectAll } from "d3-selection";
import { zoom, zoomIdentity } from "d3-zoom";
import * as ko from "knockout";
import Q from "q";
import _ from "underscore";
import * as Constants from "../../../Common/Constants";
import { NeighborType } from "../../../Contracts/ViewModels";
import { logConsoleError } from "../../../Utils/NotificationConsoleUtils";
import { IGraphConfig } from "./../../Tabs/GraphTab";
import { D3Link, D3Node, GraphData } from "./GraphData";
import { GraphExplorer } from "./GraphExplorer";

export interface D3GraphIconMap {
  [key: string]: { data: string; format: string };
}

export interface D3GraphNodeData {
  g: any; // TODO needs this?
  id: string;
}

export enum PAGE_ACTION {
  FIRST_PAGE,
  PREVIOUS_PAGE,
  NEXT_PAGE,
}

export interface LoadMoreDataAction {
  nodeId: string;
  pageAction: PAGE_ACTION;
}

interface Point2D {
  x: number;
  y: number;
}

interface ZoomTransform extends Point2D {
  k: number;
}

export interface D3ForceGraphParameters {
  // Graph to parent

  igraphConfig: IGraphConfig;
  onHighlightedNode?: (highlightedNode: D3GraphNodeData) => void; // a new node has been highlighted in the graph
  onLoadMoreData?: (action: LoadMoreDataAction) => void;

  // parent to graph
  onInitialized?: (instance: GraphRenderer) => void;

  // For unit testing purposes
  onGraphUpdated?: (timestamp: number) => void;
}

export interface GraphRenderer {
  selectNode(id: string): void;
  resetZoom(): void;
  updateGraph(graphData: GraphData<D3Node, D3Link>, igraphConfigParam?: IGraphConfig): void;
  enableHighlight(enable: boolean): void;
}

/** This is the custom Knockout handler for the d3 graph */
export class D3ForceGraph implements GraphRenderer {
  // Some constants
  private static readonly GRAPH_WIDTH_PX = 900;
  private static readonly GRAPH_HEIGHT_PX = 700;
  private static readonly TEXT_DX = 12;
  private static readonly FORCE_COLLIDE_RADIUS = 40;
  private static readonly FORCE_COLLIDE_STRENGTH = 0.2;
  private static readonly FORCE_COLLIDE_ITERATIONS = 1;
  private static readonly NODE_LABEL_MAX_CHAR_LENGTH = 16;
  private static readonly FORCE_LINK_DISTANCE = 100;
  private static readonly FORCE_LINK_STRENGTH = 0.005;
  private static readonly INITIAL_POSITION_RADIUS = 150;
  private static readonly TRANSITION_STEP1_MS = 1000;
  private static readonly TRANSITION_STEP2_MS = 1000;
  private static readonly TRANSITION_STEP3_MS = 700;
  private static readonly PAGINATION_LINE1_Y_OFFSET_PX = 4;
  private static readonly PAGINATION_LINE2_Y_OFFSET_PX = 14;

  // We limit the number of different colors to 20
  private static readonly COLOR_SCHEME = scaleOrdinal(schemeCategory10);
  private static readonly MAX_COLOR_NB = 20;

  // Some state variables
  private static instanceCount = 1;
  private instanceIndex: number;
  private svg: d3.Selection<Element, any, any, any>;
  private g: d3.Selection<Element, any, any, any>;
  private simulation: d3.Simulation<D3Node, D3Link>;
  private width: number;
  private height: number;
  private selectedNode: d3.BaseType;
  private isDragging: boolean;
  private rootVertex: D3Node;
  private nodeSelection: any;
  private linkSelection: any;
  private zoomTransform: ZoomTransform;
  private zoom: d3.ZoomBehavior<any, any>;
  private zoomBackground: d3.Selection<BaseType, any, any, any>;
  private viewCenter: Point2D;

  // Map a property to a graph node attribute (such as color)
  private uniqueValues: (string | number)[] = []; // keep track of unique values
  private graphDataWrapper: GraphData<D3Node, D3Link>;

  // Communication with outside
  // Graph -> outside
  public params: D3ForceGraphParameters;
  public errorMsgs: ko.ObservableArray<string>; // errors happen in graph

  // outside -> Graph
  private idToSelect: ko.Observable<string>; // Programmatically select node by id outside graph
  private isHighlightDisabled: boolean;
  public igraphConfig: IGraphConfig;

  public constructor(params: D3ForceGraphParameters) {
    this.params = params;
    this.igraphConfig = this.params.igraphConfig;
    this.idToSelect = ko.observable(null);
    this.errorMsgs = ko.observableArray([]);
    this.graphDataWrapper = null;

    this.width = D3ForceGraph.GRAPH_WIDTH_PX;
    this.height = D3ForceGraph.GRAPH_HEIGHT_PX;

    this.rootVertex = null;
    this.isHighlightDisabled = false;
    this.zoomTransform = { x: 0, y: 0, k: 1 };
    this.viewCenter = { x: this.width / 2, y: this.height / 2 };

    this.instanceIndex = D3ForceGraph.instanceCount++;
  }

  public init(element: Element): void {
    this.initializeGraph(element);
    this.params.onInitialized(this);
  }

  public destroy(): void {
    this.simulation.stop();
    this.simulation = null;
    this.graphDataWrapper = null;
    this.linkSelection = null;
    this.nodeSelection = null;
    this.g.remove();
  }

  public updateGraph(newGraph: GraphData<D3Node, D3Link>, igraphConfigParam?: IGraphConfig): void {
    if (igraphConfigParam) {
      this.igraphConfig = igraphConfigParam;
    }
    if (!newGraph || !this.simulation) {
      return;
    }
    // Build new GraphData object from it
    this.graphDataWrapper = new GraphData<D3Node, D3Link>();
    this.graphDataWrapper.setData(newGraph);

    const key = this.igraphConfig.nodeColorKey;

    if (key !== GraphExplorer.NONE_CHOICE) {
      this.updateUniqueValues(key);
    }

    // d3 expects source and target properties for each link (edge)
    $.each(this.graphDataWrapper.edges, (i, e) => {
      e.target = e.inV;
      e.source = e.outV;
    });

    this.onGraphDataUpdate(this.graphDataWrapper);
  }

  public resetZoom(): void {
    this.zoomBackground.call(this.zoom.transform, zoomIdentity);
    this.viewCenter = { x: this.width / 2, y: this.height / 2 };
  }

  public enableHighlight(enable: boolean): void {
    this.isHighlightDisabled = enable;
  }

  public selectNode(id: string): void {
    this.idToSelect(id);
  }

  public getArrowHeadSymbolId(): string {
    return `triangle-${this.instanceIndex}`;
  }

  /**
   * Count edges and store in a hashmap: vertex id <--> number of links
   * @param linkSelection
   */
  public static countEdges(links: D3Link[]): Map<string, number> {
    const countMap = new Map<string, number>();
    links.forEach((l: D3Link) => {
      let val = countMap.get(l.inV) || 0;
      val += 1;
      countMap.set(l.inV, val);

      val = countMap.get(l.outV) || 0;
      val += 1;
      countMap.set(l.outV, val);
    });

    return countMap;
  }

  /**
   * Construct the graph
   * @param graphData
   */
  private initializeGraph(element: Element): void {
    this.zoom = zoom()
      .scaleExtent([1 / 2, 4])
      .on("zoom", this.zoomed.bind(this));

    this.svg = select(element)
      .attr("viewBox", `0 0 ${this.width} ${this.height}`)
      .attr("preserveAspectRatio", "xMidYMid slice");

    this.zoomBackground = this.svg.call(this.zoom);

    element.addEventListener("click", (e: Event) => {
      // IE 11 doesn't support el.classList and there's no polyfill for it
      // Don't auto-deselect when not clicking on a node
      if (!(<any>e.target).classList) {
        return;
      }

      if (
        !D3ForceGraph.closest(e.target, (el: any) => {
          return !!el && el !== document && el.classList.contains("node");
        })
      ) {
        this.deselectNode();
      }
    });

    this.g = this.svg.append("g");
    this.linkSelection = this.g.append("g").attr("class", "links").selectAll(".link");
    this.nodeSelection = this.g.append("g").attr("class", "nodes").selectAll(".node");

    // Reset state variables
    this.selectedNode = null;
    this.isDragging = false;

    this.idToSelect.subscribe((newVal) => {
      if (!newVal) {
        this.deselectNode();
        return;
      }

      var self = this;
      // Select this node id
      selectAll(".node")
        .filter(function (d: D3Node, i) {
          return d.id === newVal;
        })
        .each(function (d: D3Node) {
          self.onNodeClicked(this, d);
        });
    });

    this.redrawGraph();
    this.instantiateSimulation();
  } // initialize

  private updateUniqueValues(key: string) {
    for (var i = 0; i < this.graphDataWrapper.vertices.length; i++) {
      let vertex = this.graphDataWrapper.vertices[i];

      let props = D3ForceGraph.getNodeProperties(vertex);
      if (props.indexOf(key) === -1) {
        // Vertex doesn't have the property
        continue;
      }
      let val = GraphData.getNodePropValue(vertex, key);
      if (typeof val !== "string" && typeof val !== "number") {
        // Not a type we can map
        continue;
      }

      // Map this value if new
      if (this.uniqueValues.indexOf(val) === -1) {
        this.uniqueValues.push(val);
      }

      if (this.uniqueValues.length === D3ForceGraph.MAX_COLOR_NB) {
        this.errorMsgs.push(
          `Number of unique values for property ${key} exceeds maximum (${D3ForceGraph.MAX_COLOR_NB})`,
        );
        // ignore rest of values
        break;
      }
    }
  }

  /**
   * Retrieve all node properties
   * NOTE: This is DocDB specific. We expect to have 'id' and 'label' and a bunch of 'properties'
   * @param node
   */
  private static getNodeProperties(node: D3Node): string[] {
    let props = ["id", "label"];

    if (node.hasOwnProperty("properties")) {
      props = props.concat(Object.keys(node.properties));
    }
    return props;
  }

  // Click on non-nodes deselects
  private static closest(el: any, predicate: any) {
    do {
      if (predicate(el)) {
        return el;
      }
    } while ((el = el && el.parentNode));
  }

  private zoomed(event: any) {
    this.zoomTransform = {
      x: event.transform.x,
      y: event.transform.y,
      k: event.transform.k,
    };
    this.g.attr("transform", event.transform);
  }

  private instantiateSimulation() {
    this.simulation = forceSimulation<D3Node, D3Link>()
      .force(
        "link",
        forceLink()
          .id((d: D3Node) => {
            return d.id;
          })
          .distance(D3ForceGraph.FORCE_LINK_DISTANCE)
          .strength(D3ForceGraph.FORCE_LINK_STRENGTH),
      )
      .force("charge", forceManyBody())
      .force(
        "collide",
        forceCollide(D3ForceGraph.FORCE_COLLIDE_RADIUS)
          .strength(D3ForceGraph.FORCE_COLLIDE_STRENGTH)
          .iterations(D3ForceGraph.FORCE_COLLIDE_ITERATIONS),
      );
  }

  /**
   * Shift graph to make this targetPosition as new center
   * @param targetPosition
   * @return promise with shift offset
   */
  private shiftGraph(targetPosition: Point2D): Q.Promise<Point2D> {
    const deferred: Q.Deferred<Point2D> = Q.defer<Point2D>();
    const offset = {
      x: this.width / 2 - targetPosition.x,
      y: this.height / 2 - targetPosition.y,
    };
    this.viewCenter = targetPosition;

    if (Math.abs(offset.x) > 0.5 && Math.abs(offset.y) > 0.5) {
      const transform = () => {
        return zoomIdentity
          .translate(this.width / 2, this.height / 2)
          .scale(this.zoomTransform.k)
          .translate(-targetPosition.x, -targetPosition.y);
      };

      this.zoomBackground
        .transition()
        .duration(D3ForceGraph.TRANSITION_STEP1_MS)
        .call(this.zoom.transform, transform)
        .on("end", () => {
          deferred.resolve(offset);
        });
    } else {
      deferred.resolve(null);
    }

    return deferred.promise;
  }

  private onGraphDataUpdate(graph: GraphData<D3Node, D3Link>) {
    // shift all nodes so that new clicked on node is in the center
    this.isHighlightDisabled = true;
    this.unhighlightNode();
    this.simulation.stop();

    // Find root node position
    const rootId = graph.findRootNodeId();

    // Remember nodes current position
    const posMap = new Map<string, Point2D>();
    this.simulation.nodes().forEach((d: D3Node) => {
      if (d.x == undefined || d.y == undefined) {
        return;
      }
      posMap.set(d.id, { x: d.x, y: d.y });
    });

    const restartSimulation = () => {
      this.restartSimulation(graph, posMap);
      this.isHighlightDisabled = false;
    };

    if (rootId && posMap.has(rootId)) {
      this.shiftGraph(posMap.get(rootId)).then(restartSimulation);
    } else {
      restartSimulation();
    }
  }

  private animateRemoveExitSelections(): Q.Promise<void> {
    const deferred1 = Q.defer<void>();
    const deferred2 = Q.defer<void>();
    const linkExitSelection = this.linkSelection.exit();

    let linkCounter = linkExitSelection.size();

    if (linkCounter > 0) {
      if (D3ForceGraph.useSvgMarkerEnd()) {
        this.svg
          .select(`#${this.getArrowHeadSymbolId()}-marker`)
          .transition()
          .duration(D3ForceGraph.TRANSITION_STEP2_MS)
          .attr("fill-opacity", 0)
          .attr("stroke-opacity", 0);
      } else {
        this.svg.select(`#${this.getArrowHeadSymbolId()}-nonMarker`).classed("hidden", true);
      }

      linkExitSelection.select(".link").transition().duration(D3ForceGraph.TRANSITION_STEP2_MS).attr("stroke-width", 0);
      linkExitSelection
        .transition()
        .delay(D3ForceGraph.TRANSITION_STEP2_MS)
        .remove()
        .on("end", () => {
          if (--linkCounter <= 0) {
            deferred1.resolve();
          }
        });
    } else {
      deferred1.resolve();
    }

    const nodeExitSelection = this.nodeSelection.exit();
    let nodeCounter = nodeExitSelection.size();
    if (nodeCounter > 0) {
      nodeExitSelection.selectAll("circle").transition().duration(D3ForceGraph.TRANSITION_STEP2_MS).attr("r", 0);
      nodeExitSelection
        .selectAll(".iconContainer")
        .transition()
        .duration(D3ForceGraph.TRANSITION_STEP2_MS)
        .attr("opacity", 0);
      nodeExitSelection
        .selectAll(".loadmore")
        .transition()
        .duration(D3ForceGraph.TRANSITION_STEP2_MS)
        .attr("opacity", 0);
      nodeExitSelection.selectAll("text").transition().duration(D3ForceGraph.TRANSITION_STEP2_MS).style("opacity", 0);
      nodeExitSelection
        .transition()
        .delay(D3ForceGraph.TRANSITION_STEP2_MS)
        .remove()
        .on("end", () => {
          if (--nodeCounter <= 0) {
            deferred2.resolve();
          }
        });
    } else {
      deferred2.resolve();
    }

    return Q.allSettled([deferred1.promise, deferred2.promise]).then(undefined);
  }

  /**
   * All non-fixed nodes start from the center and spread them away from the center like fireworks.
   * Then fade in the nodes labels and Load More icon.
   * @param nodes
   * @param newNodes
   */
  private animateBigBang(nodes: D3Node[], newNodes: d3.Selection<Element, any, any, any>) {
    if (!nodes || nodes.length === 0) {
      return;
    }

    const nodeFinalPositionMap = new Map<string, Point2D>();
    const viewCenter = this.viewCenter;
    const nonFixedNodes = _.filter(nodes, (node: D3Node) => {
      return !node._isFixedPosition && node.x === viewCenter.x && node.y === viewCenter.y;
    });

    const n = nonFixedNodes.length;
    const da = (Math.PI * 2) / n;
    const daOffset = Math.random() * Math.PI * 2;
    for (let i = 0; i < n; i++) {
      const d = nonFixedNodes[i];
      const angle = da * i + daOffset;

      d.fx = viewCenter.x;
      d.fy = viewCenter.y;
      const x = viewCenter.x + Math.cos(angle) * D3ForceGraph.INITIAL_POSITION_RADIUS;
      const y = viewCenter.y + Math.sin(angle) * D3ForceGraph.INITIAL_POSITION_RADIUS;
      nodeFinalPositionMap.set(d.id, { x: x, y: y });
    }

    // Animate nodes
    newNodes
      .transition()
      .duration(D3ForceGraph.TRANSITION_STEP3_MS)
      .attrTween("transform", (d: D3Node) => {
        const finalPos = nodeFinalPositionMap.get(d.id) || {
          x: viewCenter.x,
          y: viewCenter.y,
        };
        const ix = interpolateNumber(viewCenter.x, finalPos.x);
        const iy = interpolateNumber(viewCenter.y, finalPos.y);
        return (t: number) => {
          d.fx = ix(t);
          d.fy = iy(t);
          return this.positionNode(d);
        };
      })
      .on("end", (d: D3Node) => {
        if (!d._isFixedPosition) {
          d.fx = null;
          d.fy = null;
        }
      });

    // Delay appearance of text and loadMore
    newNodes
      .selectAll(".caption")
      .attr("fill", "#ffffff")
      .transition()
      .delay(D3ForceGraph.TRANSITION_STEP3_MS - 100)
      .duration(D3ForceGraph.TRANSITION_STEP3_MS)
      .attrTween("fill", (t: any) => {
        const ic = interpolate("#ffffff", "#000000");
        return (t: number) => {
          return ic(t);
        };
      });
    newNodes.selectAll(".loadmore").attr("visibility", "hidden").transition().delay(600).attr("visibility", "visible");
  }

  private restartSimulation(graph: GraphData<D3Node, D3Link>, posMap: Map<string, Point2D>) {
    if (!graph) {
      return;
    }
    const viewCenter = this.viewCenter;

    // Distribute nodes initial position before simulation
    const nodes = graph.vertices;
    for (let i = 0; i < nodes.length; i++) {
      let v = nodes[i];

      if (v._isRoot) {
        this.rootVertex = v;
      }

      if (v._isFixedPosition && posMap.has(v.id)) {
        const pos = posMap.get(v.id);
        v.fx = pos.x;
        v.fy = pos.y;
      } else if (v._isRoot) {
        v.fx = viewCenter.x;
        v.fy = viewCenter.y;
      } else if (posMap.has(v.id)) {
        const pos = posMap.get(v.id);
        v.x = pos.x;
        v.y = pos.y;
      } else {
        v.x = viewCenter.x;
        v.y = viewCenter.y;
      }
    }

    const nodeById = d3Map(nodes, (d: D3Node) => {
      return d.id;
    });
    const links = graph.edges;

    links.forEach((link: D3Link) => {
      link.source = nodeById.get(<string>link.source);
      link.target = nodeById.get(<string>link.target);
    });

    this.linkSelection = this.linkSelection.data(links, (l: D3Link) => {
      return `${(<D3Node>l.source).id}_${(<D3Node>l.target).id}`;
    });
    this.nodeSelection = this.nodeSelection.data(nodes, (d: D3Node) => {
      return d.id;
    });

    const removePromise = this.animateRemoveExitSelections();

    const self = this;

    this.simulation.nodes(nodes).on("tick", ticked);

    this.simulation.force<d3.ForceLink<D3Node, D3Link>>("link").links(graph.edges);

    removePromise.then(() => {
      if (D3ForceGraph.useSvgMarkerEnd()) {
        this.svg.select(`#${this.getArrowHeadSymbolId()}-marker`).attr("fill-opacity", 1).attr("stroke-opacity", 1);
      } else {
        this.svg.select(`#${this.getArrowHeadSymbolId()}-nonMarker`).classed("hidden", false);
      }
      const newNodes = this.addNewNodes();
      this.updateLoadMore(this.nodeSelection);

      this.addNewLinks();

      const nodes1 = this.simulation.nodes();
      this.redrawGraph();

      this.animateBigBang(nodes1, newNodes);

      this.simulation.alpha(1).restart();
      this.params.onGraphUpdated(new Date().getTime());
    });

    function ticked() {
      self.linkSelection.select(".link").attr("d", (l: D3Link) => {
        return self.positionLink(l);
      });
      if (!D3ForceGraph.useSvgMarkerEnd()) {
        self.linkSelection.select(".markerEnd").attr("transform", (l: D3Link) => {
          return self.positionLinkEnd(l);
        });
      }
      self.nodeSelection.attr("transform", (d: D3Node) => {
        return self.positionNode(d);
      });
    }
  }

  private addNewLinks(): d3.Selection<Element, any, any, any> {
    const newLinks = this.linkSelection.enter().append("g").attr("class", "markerEndContainer");

    const line = newLinks
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke-width", this.igraphConfig.linkWidth)
      .attr("stroke", this.igraphConfig.linkColor);

    if (D3ForceGraph.useSvgMarkerEnd()) {
      line.attr("marker-end", `url(#${this.getArrowHeadSymbolId()}-marker)`);
    } else {
      newLinks
        .append("g")
        .append("use")
        .attr("xlink:href", `#${this.getArrowHeadSymbolId()}-nonMarker`)
        .attr("class", "markerEnd link")
        .attr("fill", this.igraphConfig.linkColor)
        .classed(`${this.getArrowHeadSymbolId()}`, true);
    }

    this.linkSelection = newLinks.merge(this.linkSelection);
    return newLinks;
  }

  private addNewNodes(): d3.Selection<Element, any, any, any> {
    var self = this;

    const newNodes = this.nodeSelection
      .enter()
      .append("g")
      .attr("class", (d: D3Node) => {
        return d._isRoot ? "node root" : "node";
      })
      .call(
        drag()
          .on("start", ((e: D3DragEvent<SVGGElement, D3Node, unknown>, d: D3Node) => {
            return this.dragstarted(d, e);
          }) as any)
          .on("drag", ((e: D3DragEvent<SVGGElement, D3Node, unknown>, d: D3Node) => {
            return this.dragged(d, e);
          }) as any)
          .on("end", ((e: D3DragEvent<SVGGElement, D3Node, unknown>, d: D3Node) => {
            return this.dragended(d, e);
          }) as any),
      )
      .on("mouseover", (_: MouseEvent, d: D3Node) => {
        if (this.isHighlightDisabled || this.selectedNode || this.isDragging) {
          return;
        }

        this.highlightNode(this, d);
        this.simulation.stop();
      })
      .on("mouseout", (_: MouseEvent, d: D3Node) => {
        if (this.isHighlightDisabled || this.selectedNode || this.isDragging) {
          return;
        }

        this.unhighlightNode();

        this.simulation.restart();
      })
      .each((d: D3Node) => {
        // Initial position for nodes. This prevents blinking as following the tween transition doesn't always start right away
        d.x = self.viewCenter.x;
        d.y = self.viewCenter.y;
      });

    newNodes
      .append("circle")
      .attr("fill", this.getNodeColor.bind(this))
      .attr("class", "main")
      .attr("r", this.igraphConfig.nodeSize);

    var iconGroup = newNodes
      .append("g")
      .attr("class", "iconContainer")
      .attr("role", "group")
      .attr("tabindex", 0)
      .on("dblclick", function (this: Element, _: MouseEvent, d: D3Node) {
        // https://stackoverflow.com/a/41945742 ('this' implicitly has type 'any' because it does not have a type annotation)
        // this is the <g> element
        self.onNodeClicked(this.parentNode as BaseType, d);
      })
      .on("click", function (this: Element, _: MouseEvent, d: D3Node) {
        // this is the <g> element
        self.onNodeClicked(this.parentNode as BaseType, d);
      })
      .on("keypress", function (this: Element, event: KeyboardEvent, d: D3Node) {
        if (event.charCode === Constants.KeyCodes.Space || event.charCode === Constants.KeyCodes.Enter) {
          event.stopPropagation();
          // this is the <g> element
          self.onNodeClicked(this.parentNode as BaseType, d);
        }
      });
    var nodeSize = this.igraphConfig.nodeSize;
    var bgsize = nodeSize + 1;

    iconGroup
      .append("rect")
      .attr("x", -bgsize)
      .attr("y", -bgsize)
      .attr("width", bgsize * 2)
      .attr("height", bgsize * 2)
      .attr("fill-opacity", (d: D3Node) => {
        return this.igraphConfig.nodeIconKey ? 1 : 0;
      })
      .attr("class", "icon-background");

    // Possible icon: if xlink:href is undefined, the image won't show
    iconGroup
      .append("svg:image")
      .attr("xlink:href", (d: D3Node) => {
        return D3ForceGraph.computeImageData(d, this.igraphConfig);
      })
      .attr("x", -nodeSize)
      .attr("y", -nodeSize)
      .attr("height", nodeSize * 2)
      .attr("width", nodeSize * 2)
      .attr("class", "icon");
    newNodes
      .append("text")
      .attr("class", "caption")
      .attr("dx", D3ForceGraph.TEXT_DX)
      .attr("dy", ".35em")
      .text((d: D3Node) => {
        return this.retrieveNodeCaption(d);
      });

    this.nodeSelection = newNodes.merge(this.nodeSelection);

    return newNodes;
  }

  /**
   * Pagination display and buttons
   * @param parent
   * @param nodeSize
   */
  private createPaginationControl(parent: d3.Selection<BaseType, any, any, any>, nodeSize: number) {
    const self = this;
    const gaugeWidth = 50;
    const btnXOffset = gaugeWidth / 2;
    const yOffset = 10 + nodeSize;
    const gaugeYOffset = yOffset + 3;
    const gaugeHeight = 14;
    parent
      .append("line")
      .attr("x1", 0)
      .attr("y1", nodeSize)
      .attr("x2", 0)
      .attr("y2", gaugeYOffset)
      .style("stroke-width", 1)
      .style("stroke", this.igraphConfig.linkColor);
    parent
      .append("use")
      .attr("xlink:href", "#triangleRight")
      .attr("class", "pageButton")
      .attr("y", yOffset)
      .attr("x", btnXOffset)
      .attr("aria-label", (d: D3Node) => {
        return `Next page of nodes for ${this.retrieveNodeCaption(d)}`;
      })
      .attr("tabindex", 0)
      .on("click", ((_: MouseEvent, d: D3Node) => {
        self.loadNeighbors(d, PAGE_ACTION.NEXT_PAGE);
      }) as any)
      .on("dblclick", ((_: MouseEvent, d: D3Node) => {
        self.loadNeighbors(d, PAGE_ACTION.NEXT_PAGE);
      }) as any)
      .on("keypress", ((event: KeyboardEvent, d: D3Node) => {
        if (event.charCode === Constants.KeyCodes.Space || event.charCode === Constants.KeyCodes.Enter) {
          event.stopPropagation();
          self.loadNeighbors(d, PAGE_ACTION.NEXT_PAGE);
        }
      }) as any)
      .on("mouseover", ((e: MouseEvent, d: D3Node) => {
        select(e.target as any).classed("active", true);
      }) as any)
      .on("mouseout", ((e: MouseEvent, d: D3Node) => {
        select(e.target as any).classed("active", false);
      }) as any)
      .attr("visibility", (d: D3Node) => (!d._outEAllLoaded || !d._inEAllLoaded ? "visible" : "hidden"));
    parent
      .append("use")
      .attr("xlink:href", "#triangleRight")
      .attr("class", "pageButton")
      .attr("y", yOffset)
      .attr("transform", `translate(${-btnXOffset}), scale(-1, 1)`)
      .attr("aria-label", (d: D3Node) => {
        return `Previous page of nodes for ${this.retrieveNodeCaption(d)}`;
      })
      .attr("tabindex", 0)
      .on("click", ((_: MouseEvent, d: D3Node) => {
        self.loadNeighbors(d, PAGE_ACTION.PREVIOUS_PAGE);
      }) as any)
      .on("dblclick", ((_: MouseEvent, d: D3Node) => {
        self.loadNeighbors(d, PAGE_ACTION.PREVIOUS_PAGE);
      }) as any)
      .on("keypress", ((event: KeyboardEvent, d: D3Node) => {
        if (event.charCode === Constants.KeyCodes.Space || event.charCode === Constants.KeyCodes.Enter) {
          event.stopPropagation();
          self.loadNeighbors(d, PAGE_ACTION.PREVIOUS_PAGE);
        }
      }) as any)
      .on("mouseover", ((e: MouseEvent, d: D3Node) => {
        select(e.target as any).classed("active", true);
      }) as any)
      .on("mouseout", ((e: MouseEvent, d: D3Node) => {
        select(e.target as any).classed("active", false);
      }) as any)
      .attr("visibility", (d: D3Node) =>
        !d._pagination || d._pagination.currentPage.start !== 0 ? "visible" : "hidden",
      );
    parent
      .append("rect")
      .attr("x", -btnXOffset)
      .attr("y", gaugeYOffset)
      .attr("width", gaugeWidth)
      .attr("height", gaugeHeight)
      .style("fill", "white")
      .style("stroke-width", 1)
      .style("stroke", this.igraphConfig.linkColor);
    parent
      .append("rect")
      .attr("x", (d: D3Node) => {
        const pageInfo = d._pagination;
        return pageInfo && pageInfo.total
          ? -btnXOffset + (gaugeWidth * pageInfo.currentPage.start) / pageInfo.total
          : 0;
      })
      .attr("y", gaugeYOffset)
      .attr("width", (d: D3Node) => {
        const pageInfo = d._pagination;
        return pageInfo && pageInfo.total
          ? (gaugeWidth * (pageInfo.currentPage.end - pageInfo.currentPage.start)) / pageInfo.total
          : 0;
      })
      .attr("height", gaugeHeight)
      .style("fill", this.igraphConfig.nodeColor)
      .attr("visibility", (d: D3Node) => (d._pagination && d._pagination.total ? "visible" : "hidden"));
    parent
      .append("text")
      .attr("x", 0)
      .attr("y", gaugeYOffset + gaugeHeight / 2 + D3ForceGraph.PAGINATION_LINE1_Y_OFFSET_PX)
      .text((d: D3Node) => {
        const pageInfo = d._pagination;
        /*
         * pageInfo is zero-based but for the purpose of user display, current page start and end are 1-based.
         * current page end is the upper-bound (not included), but for the purpose user display we show included upper-bound
         * For example: start = 0, end = 11 will display 1-10.
         */
        // pageInfo is zero-based, but for the purpose of user display, current page start and end are 1-based.
        //
        return `${pageInfo.currentPage.start + 1}-${pageInfo.currentPage.end}`;
      })
      .attr("text-anchor", "middle")
      .style("font-size", "10px");
    parent
      .append("text")
      .attr("x", 0)
      .attr(
        "y",
        gaugeYOffset +
          gaugeHeight / 2 +
          D3ForceGraph.PAGINATION_LINE1_Y_OFFSET_PX +
          D3ForceGraph.PAGINATION_LINE2_Y_OFFSET_PX,
      )
      .text((d: D3Node) => {
        const pageInfo = d._pagination;
        return `total: ${pageInfo.total}`;
      })
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .attr("visibility", (d: D3Node) => (d._pagination && d._pagination.total ? "visible" : "hidden"));
  }

  private createLoadMoreControl(parent: d3.Selection<d3.BaseType, any, any, any>, nodeSize: number) {
    const self = this;
    parent
      .append("use")
      .attr("class", "loadMoreIcon")
      .attr("xlink:href", "#loadMoreIcon")
      .attr("x", -15)
      .attr("y", nodeSize)
      .attr("aria-label", (d: D3Node) => {
        return `Load adjacent nodes for ${this.retrieveNodeCaption(d)}`;
      })
      .attr("tabindex", 0)
      .on("click", ((_: MouseEvent, d: D3Node) => {
        self.loadNeighbors(d, PAGE_ACTION.FIRST_PAGE);
      }) as any)
      .on("dblclick", ((_: MouseEvent, d: D3Node) => {
        self.loadNeighbors(d, PAGE_ACTION.FIRST_PAGE);
      }) as any)
      .on("keypress", ((event: KeyboardEvent, d: D3Node) => {
        if (event.charCode === Constants.KeyCodes.Space || event.charCode === Constants.KeyCodes.Enter) {
          event.stopPropagation();
          self.loadNeighbors(d, PAGE_ACTION.FIRST_PAGE);
        }
      }) as any)
      .on("mouseover", ((e: MouseEvent, d: D3Node) => {
        select(e.target as any).classed("active", true);
      }) as any)
      .on("mouseout", ((e: MouseEvent, d: D3Node) => {
        select(e.target as any).classed("active", false);
      }) as any);
  }

  /**
   * Remove LoadMore subassembly for existing nodes that show all their children in the graph
   */
  private updateLoadMore(nodeSelection: d3.Selection<Element, any, any, any>) {
    const self = this;
    nodeSelection.selectAll(".loadmore").remove();

    var nodeSize = this.igraphConfig.nodeSize;
    const rootSelectionG = nodeSelection
      .filter((d: D3Node) => {
        return !!d._isRoot && !!d._pagination;
      })
      .append("g")
      .attr("class", "loadmore");
    this.createPaginationControl(rootSelectionG, nodeSize);

    const nodeNeighborMap = D3ForceGraph.countEdges(this.linkSelection.data());
    const missingNeighborNonRootG = nodeSelection
      .filter((d: D3Node) => {
        return !(
          d._isRoot ||
          (d._outEAllLoaded &&
            d._inEAllLoaded &&
            nodeNeighborMap.get(d.id) >= d._outEdgeIds.length + d._inEdgeIds.length)
        );
      })
      .append("g")
      .attr("class", "loadmore");
    this.createLoadMoreControl(missingNeighborNonRootG, nodeSize);

    // Don't color icons individually, just the definitions
    this.svg.selectAll("#loadMoreIcon ellipse").attr("fill", this.igraphConfig.nodeColor);
  }

  /**
   * Load neighbors of this node
   */
  private loadNeighbors(v: D3Node, pageAction: PAGE_ACTION) {
    if (!this.graphDataWrapper.hasVertexId(v.id)) {
      logConsoleError(`Clicked node not in graph data. id: ${v.id}`);
      return;
    }

    this.params.onLoadMoreData({
      nodeId: v.id,
      pageAction: pageAction,
    });
  }

  /**
   * If not mapped, return max Color
   * @param key
   */
  private lookupColorFromKey(key: string): string {
    let index = this.uniqueValues.indexOf(key);
    if (index < 0 || index >= D3ForceGraph.MAX_COLOR_NB) {
      index = D3ForceGraph.MAX_COLOR_NB - 1;
    }
    return D3ForceGraph.COLOR_SCHEME(index.toString());
  }

  /**
   * Get node color
   * If nodeColorKey is defined, lookup the node color from uniqueStrings.
   * Otherwise use nodeColor.
   * @param d
   */
  private getNodeColor(d: D3Node): string {
    if (this.igraphConfig.nodeColorKey) {
      const val = GraphData.getNodePropValue(d, this.igraphConfig.nodeColorKey);
      return this.lookupColorFromKey(<string>val);
    } else {
      return this.igraphConfig.nodeColor;
    }
  }

  private dragstarted(d: D3Node, event: D3DragEvent<SVGGElement, D3Node, unknown>) {
    this.isDragging = true;
    if (!event.active) {
      this.simulation.alphaTarget(0.3).restart();
    }
    d.fx = d.x;
    d.fy = d.y;
  }

  private dragged(d: D3Node, event: D3DragEvent<SVGGElement, D3Node, unknown>) {
    d.fx = event.x;
    d.fy = event.y;
  }

  private dragended(d: D3Node, event: D3DragEvent<SVGGElement, D3Node, unknown>) {
    this.isDragging = false;
    if (!event.active) {
      this.simulation.alphaTarget(0);
    }

    d.fx = null;
    d.fy = null;
  }

  private highlightNode(g: any, d: D3Node) {
    this.fadeNonNeighbors(d.id);
    this.params.onHighlightedNode({ g: g, id: d.id });
  }

  private unhighlightNode() {
    this.g.selectAll(".node").classed("inactive", false);
    this.g.selectAll(".link").classed("inactive", false);
    this.params.onHighlightedNode(null);

    this.setRootAsHighlighted();
  }

  /**
   * Set the root node as highlighted, but don't fade neighbors.
   * We use this to show the root properties
   */
  private setRootAsHighlighted() {
    if (!this.rootVertex) {
      return;
    }

    this.params.onHighlightedNode({ g: null, id: this.rootVertex.id });
  }

  private fadeNonNeighbors(nodeId: string) {
    this.g.selectAll(".node").classed("inactive", (d: D3Node) => {
      var neighbors = ((showNeighborType) => {
        switch (showNeighborType) {
          case NeighborType.SOURCES_ONLY:
            return this.graphDataWrapper.getSourcesForId(nodeId);
          case NeighborType.TARGETS_ONLY:
            return this.graphDataWrapper.getTargetsForId(nodeId);
          default:
          case NeighborType.BOTH:
            return (this.graphDataWrapper.getSourcesForId(nodeId) || []).concat(
              this.graphDataWrapper.getTargetsForId(nodeId),
            );
        }
      })(this.igraphConfig.showNeighborType);
      return (!neighbors || neighbors.indexOf(d.id) === -1) && d.id !== nodeId;
    });

    this.g.selectAll(".link").classed("inactive", (l: D3Link) => {
      switch (this.igraphConfig.showNeighborType) {
        case NeighborType.SOURCES_ONLY:
          return (<D3Node>l.target).id !== nodeId;
        case NeighborType.TARGETS_ONLY:
          return (<D3Node>l.source).id !== nodeId;
        default:
        case NeighborType.BOTH:
          return (<D3Node>l.target).id !== nodeId && (<D3Node>l.source).id !== nodeId;
      }
    });
  }

  private onNodeClicked(g: d3.BaseType, d: D3Node) {
    if (this.isHighlightDisabled) {
      return;
    }

    if (g === this.selectedNode) {
      this.deselectNode();
      return;
    }

    // unselect old none
    select(this.selectedNode).classed("selected", false);
    this.unhighlightNode();

    // select new one
    select(g).classed("selected", true);
    this.selectedNode = g;
    this.highlightNode(g, d);
  }

  private deselectNode() {
    if (!this.selectedNode) {
      return;
    }

    // Unselect
    select(this.selectedNode).classed("selected", false);
    this.selectedNode = null;
    this.unhighlightNode();
  }

  private retrieveNodeCaption(d: D3Node) {
    let key = this.igraphConfig.nodeCaption;
    let value: string = d.id || d.label;
    if (key) {
      value = <string>GraphData.getNodePropValue(d, key) || "";
    }

    // Manually ellipsize
    if (value.length > D3ForceGraph.NODE_LABEL_MAX_CHAR_LENGTH) {
      value = value.substr(0, D3ForceGraph.NODE_LABEL_MAX_CHAR_LENGTH) + "\u2026";
    }
    return value;
  }

  private static calculateClosestPIOver2(angle: number): number {
    const CURVATURE_FACTOR = 40;
    const result = Math.atan(CURVATURE_FACTOR * (angle - Math.PI / 4)) / 2 + Math.PI / 4;
    return result;
  }

  private static calculateClosestPIOver4(angle: number): number {
    const CURVATURE_FACTOR = 100;
    const result = Math.atan(CURVATURE_FACTOR * (angle - Math.PI / 8)) / 4 + Math.PI / 8;
    return result;
  }

  private static calculateControlPoint(start: Point2D, end: Point2D): Point2D {
    const alpha = Math.atan2(end.y - start.y, end.x - start.x);
    const n = Math.floor(alpha / (Math.PI / 2));
    const reducedAlpha = alpha - (n * Math.PI) / 2;
    const reducedBeta = D3ForceGraph.calculateClosestPIOver2(reducedAlpha);
    const beta = reducedBeta + (n * Math.PI) / 2;

    const length = Math.sqrt((end.y - start.y) * (end.y - start.y) + (end.x - start.x) * (end.x - start.x)) / 2;
    const result = {
      x: start.x + Math.cos(beta) * length,
      y: start.y + Math.sin(beta) * length,
    };

    return result;
  }

  private positionLinkEnd(l: D3Link) {
    const source: Point2D = {
      x: (<D3Node>l.source).x,
      y: (<D3Node>l.source).y,
    };
    const target: Point2D = {
      x: (<D3Node>l.target).x,
      y: (<D3Node>l.target).y,
    };
    const d1 = D3ForceGraph.calculateControlPoint(source, target);
    var radius = this.igraphConfig.nodeSize + 3;

    // End
    const dx = target.x - d1.x;
    const dy = target.y - d1.y;
    const angle = Math.atan2(dy, dx);
    var ux = target.x - Math.cos(angle) * radius;
    var uy = target.y - Math.sin(angle) * radius;

    return `translate(${ux},${uy}) rotate(${(angle * 180) / Math.PI})`;
  }

  private positionLink(l: D3Link) {
    const source: Point2D = {
      x: (<D3Node>l.source).x,
      y: (<D3Node>l.source).y,
    };
    const target: Point2D = {
      x: (<D3Node>l.target).x,
      y: (<D3Node>l.target).y,
    };
    const d1 = D3ForceGraph.calculateControlPoint(source, target);
    var radius = this.igraphConfig.nodeSize + 3;

    // Start
    var dx = d1.x - source.x;
    var dy = d1.y - source.y;
    var angle = Math.atan2(dy, dx);
    var tx = source.x + Math.cos(angle) * radius;
    var ty = source.y + Math.sin(angle) * radius;

    // End
    dx = target.x - d1.x;
    dy = target.y - d1.y;
    angle = Math.atan2(dy, dx);
    var ux = target.x - Math.cos(angle) * radius;
    var uy = target.y - Math.sin(angle) * radius;

    return "M" + tx + "," + ty + "S" + d1.x + "," + d1.y + " " + ux + "," + uy;
  }

  private positionNode(d: D3Node) {
    return "translate(" + d.x + "," + d.y + ")";
  }

  private redrawGraph() {
    if (!this.simulation) {
      return;
    }

    this.g.selectAll(".node").attr("class", (d: D3Node) => {
      return d._isRoot ? "node root" : "node";
    });

    this.applyConfig(this.igraphConfig);
  }

  private static computeImageData(d: D3Node, config: IGraphConfig): string {
    let propValue = <string>GraphData.getNodePropValue(d, config.nodeIconKey) || "";
    // Trim leading and trailing spaces to make comparison more forgiving.
    let value = config.iconsMap[propValue.trim()];
    if (!value) {
      return undefined;
    }
    return `data:image/${value.format};base64,${value.data}`;
  }

  /**
   * Update graph according to configuration or use default
   */
  private applyConfig(config: IGraphConfig) {
    if (config.nodeIconKey) {
      this.g
        .selectAll(".node .icon")
        .attr("xlink:href", (d: D3Node) => {
          return D3ForceGraph.computeImageData(d, config);
        })
        .attr("x", -config.nodeSize)
        .attr("y", -config.nodeSize)
        .attr("height", config.nodeSize * 2)
        .attr("width", config.nodeSize * 2)
        .attr("class", "icon");
    } else {
      // clear icons
      this.g.selectAll(".node .icon").attr("xlink:href", undefined);
    }
    this.g.selectAll(".node .icon-background").attr("fill-opacity", (d: D3Node) => {
      return config.nodeIconKey ? 1 : 0;
    });
    this.g.selectAll(".node text.caption").text((d: D3Node) => {
      return this.retrieveNodeCaption(d);
    });

    this.g.selectAll(".node circle.main").attr("r", config.nodeSize);
    this.g.selectAll(".node text.caption").attr("dx", config.nodeSize + 2);

    this.g.selectAll(".node circle").attr("fill", this.getNodeColor.bind(this));

    // Can't color nodes individually if using defs
    this.svg.selectAll("#loadMoreIcon ellipse").attr("fill", config.nodeColor);
    this.g.selectAll(".link").attr("stroke-width", config.linkWidth);

    this.g.selectAll(".link").attr("stroke", config.linkColor);
    if (D3ForceGraph.useSvgMarkerEnd()) {
      this.svg
        .select(`#${this.getArrowHeadSymbolId()}-marker`)
        .attr("fill", config.linkColor)
        .attr("stroke", config.linkColor);
    } else {
      this.svg.select(`#${this.getArrowHeadSymbolId()}-nonMarker`).attr("fill", config.linkColor);
    }

    // Reset highlight
    this.g.selectAll(".node circle").attr("opacity", null);
  }

  /**
   * On Edge browsers, there's a bug when using the marker-end attribute.
   * It make the whole app reload when zooming and panning.
   * So we draw the arrow heads manually and must also reposition manually.
   * In this case, the UX is slightly degraded (no animation when removing arrow)
   */
  private static useSvgMarkerEnd(): boolean {
    // Use for all browsers except Edge
    return window.navigator.userAgent.indexOf("Edge") === -1;
  }
}
