import { SimulationLinkDatum, SimulationNodeDatum } from "d3";
import _ from "underscore";

export interface PaginationInfo {
  total: number;

  // Note: end is the upper-bound outside of the page range.
  currentPage: { start: number; end: number };
}

export interface GremlinVertex {
  id: string;
  label?: string;
  inE?: { [label: string]: GremlinShortInEdge[] };
  outE?: { [label: string]: GremlinShortOutEdge[] };
  properties?: { [propName: string]: GremlinProperty[] };

  // Private use. Not part of Gremlin's specs
  _isRoot?: boolean;
  _isFixedPosition?: boolean;
  _pagination?: PaginationInfo;
  _ancestorsId?: string[];
  _inEAllLoaded?: boolean;
  _outEAllLoaded?: boolean;
  _outEdgeIds?: string[];
  _inEdgeIds?: string[];
}

export interface GremlinShortInEdge {
  id: string;
  outV: string;
}

export interface GremlinShortOutEdge {
  id: string;
  inV: string;
}

export interface GremlinEdge {
  id: string;
  inV: string;
  outV: string;
  label: string;
}

export interface GremlinProperty {
  id: string;
  value: string | number | boolean;
}

export interface MapArray {
  [id: string]: string[];
}

/*
 * D3 adds fields (such as x,y, ...) to the original vertices and edges.
 * For D3 purposes, we extend GremlinVertex and GremlinEdge to support d3's functionality.
 * By keeping GremlinVertex, GremlinEdge different from D3Node and D3Link, we can decouple
 * the Gremlin code/cosmosdb code (in GraphExplorerComponents.ts) from the
 * D3 visualization implementation (in D3ForceGraph.ts).
 *
 * GraphData's logic works with both type pairs.
 */
export interface D3Node extends GremlinVertex, SimulationNodeDatum {}
export interface D3Link extends GremlinEdge, SimulationLinkDatum<D3Node> {}

/**
 * Functionality related to graph manipulation
 */
export class GraphData<V extends GremlinVertex, E extends GremlinEdge> {
  private _vertices: V[];
  private _edges: E[];

  // Keep track of neighbors' id
  private _targetsMap: MapArray;
  private _sourcesMap: MapArray;

  // Lookup vertex name by id
  private _id2VertexMap: { [id: string]: V };

  constructor() {
    this._vertices = [];
    this._edges = [];
    this._targetsMap = {};
    this._sourcesMap = {};
    this._id2VertexMap = {};
  }

  /**
   * Copy from plain object
   * @param data
   */
  public setData(data: any) {
    if (!data) {
      return;
    }
    const props = ["_vertices", "_edges", "_targetsMap", "_sourcesMap", "_id2VertexMap"];
    for (let i = 0; i < props.length; i++) {
      if (!data.hasOwnProperty(props[i])) {
        return;
      }
    }

    this._vertices = data._vertices;
    this._edges = data._edges;
    this._targetsMap = data._targetsMap;
    this._sourcesMap = data._sourcesMap;
    this._id2VertexMap = data._id2VertexMap;
  }

  public get vertices(): V[] {
    return this._vertices;
  }

  public get edges(): E[] {
    return this._edges;
  }

  public getVertexById(id: string): V {
    return this._id2VertexMap[id];
  }

  public hasVertexId(id: string): boolean {
    return this._id2VertexMap.hasOwnProperty(id);
  }

  public get ids(): string[] {
    return Object.keys(this._id2VertexMap);
  }

  public addVertex(vertex: V) {
    if (this.ids.indexOf(vertex.id) !== -1) {
      // Make sure vertex is not already in
      return;
    }
    this._vertices.push(vertex);
    this._id2VertexMap[vertex.id] = vertex;

    this.addNeighborInfo(vertex);
  }

  /**
   * Look in this inE and outE and update nodes already in the graph
   * @param vertex
   */
  public addNeighborInfo(vertex: V) {
    // Add edge if the other end is in the graph
    if (vertex.hasOwnProperty("inE")) {
      for (let p in vertex["inE"]) {
        vertex["inE"][p].forEach((e: GremlinShortInEdge) => {
          if (this.hasVertexId(e.outV)) {
            const v = this.getVertexById(e.outV);
            GraphData.addOutE(v, p, {
              id: e.id,
              inV: e.outV,
            });
          }
        });
      }
    }
    if (vertex.hasOwnProperty("outE")) {
      for (let p in vertex["outE"]) {
        vertex["outE"][p].forEach((e: GremlinShortOutEdge) => {
          if (this.hasVertexId(e.inV)) {
            const v = this.getVertexById(e.inV);
            GraphData.addInE(v, p, {
              id: e.id,
              outV: e.inV,
            });
          }
        });
      }
    }
  }

  public getSourcesForId(id: string): string[] {
    return this._sourcesMap[id];
  }

  public getTargetsForId(id: string): string[] {
    return this._targetsMap[id];
  }

  public addEdge(edge: E): void {
    // Check if edge is not already in
    for (let i = 0; i < this._edges.length; i++) {
      if (this._edges[i].inV === edge.inV && this._edges[i].outV === edge.outV) {
        return;
      }
    }

    // Add edge only if both ends of the edge are in the graph
    if (this.hasVertexId(edge.inV) && this.hasVertexId(edge.outV)) {
      this._edges.push(edge);
    }
    GraphData.addToMap(this._targetsMap, edge.outV, edge.inV);
    GraphData.addToMap(this._sourcesMap, edge.inV, edge.outV);

    // Add edge info to vertex
    if (this.hasVertexId(edge.inV)) {
      GraphData.addInE(this.getVertexById(edge.inV), edge.label, edge);
    }
    if (this.hasVertexId(edge.outV)) {
      GraphData.addOutE(this.getVertexById(edge.outV), edge.label, edge);
    }
  }

  /**
   * Add inE edge to vertex
   * @param v
   * @param edge
   */
  public static addInE(v: GremlinVertex, label: string, edge: GremlinShortInEdge) {
    v["inE"] = v["inE"] || {};
    v["inE"][label] = v["inE"][label] || [];
    GraphData.addToEdgeArray(edge, v["inE"][label]);
  }

  /**
   * Add outE edge to vertex
   * @param v
   * @param edge
   */
  public static addOutE(v: GremlinVertex, label: string, edge: GremlinShortOutEdge) {
    v["outE"] = v["outE"] || {};
    v["outE"][label] = v["outE"][label] || [];
    GraphData.addToEdgeArray(edge, v["outE"][label]);
  }

  /**
   * Make sure to not add the same edge if already exists
   * TODO Unit test this!
   * @param edge
   * @param edgeArray
   */
  public static addToEdgeArray(
    edge: GremlinShortInEdge | GremlinShortOutEdge,
    edgeArray: (GremlinShortInEdge | GremlinShortOutEdge)[]
  ) {
    for (let i = 0; i < edgeArray.length; i++) {
      if (edgeArray[i].id === edge.id) {
        return;
      }
    }
    edgeArray.push(edge);
  }

  /**
   * Merge all inE and outE from source to target
   * @param target
   * @param source
   */
  public static addEdgeInfoToVertex(target: GremlinVertex, source: GremlinVertex): void {
    if (source.hasOwnProperty("outE")) {
      for (let p in source.outE) {
        source.outE[p].forEach((e: GremlinShortOutEdge) => {
          GraphData.addOutE(target, p, e);
        });
      }
    }
    if (source.hasOwnProperty("inE")) {
      for (let p in source.inE) {
        source.inE[p].forEach((e: GremlinShortInEdge) => {
          GraphData.addInE(target, p, e);
        });
      }
    }
  }

  public unloadAllVertices(excludedIds: string[]): void {
    this.ids.forEach((id: string) => {
      if (excludedIds.indexOf(id) !== -1) {
        return;
      }
      this.removeVertex(id, true);
    });
  }

  /**
   * IE doesn't support Object.values(object)
   * @param object
   */
  public static getValues(object: any) {
    if (!object) {
      return [];
    }
    return Object.keys(object).map((p: string) => {
      return object[p];
    });
  }

  /**
   * Erase all references to vertex in graph
   * @param id
   * @param unloadOnly true: unload from cache. Delete edge and vertices, but not the references to it in the vertices
   */
  public removeVertex(id: string, unloadOnly: boolean): void {
    if (!this.hasVertexId(id)) {
      console.error("No vertex to delete found with id", id);
      return;
    }

    // Find all edges that touches this vertex and remove them
    let edgeIds: string[] = [];
    this._edges.forEach((edge: E) => {
      if (edge.inV === id || edge.outV === id) {
        edgeIds.push(edge.id);
      }
    });

    edgeIds.forEach((id: string) => {
      this.removeEdge(id, unloadOnly);
    });

    GraphData.removeFromMap(this._sourcesMap, id);
    GraphData.removeFromMap(this._targetsMap, id);

    // Delete from the map
    this.deleteVertex(id);
  }

  /**
   * Remove edge from graph data
   * @param edgeId
   * @param unloadOnly remove edge, but not references in the nodes
   */
  public removeEdge(edgeId: string, unloadOnly: boolean) {
    // Remove from edges array
    for (let i = 0; i < this._edges.length; i++) {
      if (this._edges[i].id === edgeId) {
        const edge = this._edges[i];
        this._edges.splice(i, 1);
        GraphData.removeEltFromMap(this._sourcesMap, edge.inV, edge.outV);
        GraphData.removeEltFromMap(this._targetsMap, edge.outV, edge.inV);
        break;
      }
    }

    if (!unloadOnly) {
      // Cleanup vertices
      this._vertices.forEach((vertex: GremlinVertex) => {
        GraphData.getValues(vertex.inE).forEach((edges: GremlinShortInEdge[]) => {
          for (let i = 0; i < edges.length; i++) {
            if (edges[i].id === edgeId) {
              edges.splice(i, 1);
              return;
            }
          }
        });
        GraphData.getValues(vertex.outE).forEach((edges: GremlinShortOutEdge[]) => {
          for (let i = 0; i < edges.length; i++) {
            if (edges[i].id === edgeId) {
              edges.splice(i, 1);
              return;
            }
          }
        });
      });
    }
  }

  /**
   * Set this node as root, clear root tag for other nodes
   * @param id
   */
  public setAsRoot(id: string) {
    this._vertices.forEach((v: V) => {
      delete v._isRoot;
      delete v._isFixedPosition;
    });
    if (this.hasVertexId(id)) {
      const v = this.getVertexById(id);
      v._isRoot = true;
      v._isFixedPosition = true;
    }
  }

  /**
   * Find root node id
   * @return root node id if found, undefined otherwise
   */
  public findRootNodeId(): string {
    return (
      _.find(this._vertices, (v: GremlinVertex) => {
        return !!v._isRoot;
      }) || ({} as any)
    ).id;
  }

  /**
   *
   * @param v
   * @return list of edge ids for this vertex
   */
  public static getEdgesId(v: GremlinVertex): string[] {
    const ids: string[] = [];
    if (v.inE) {
      for (var l in v.inE) {
        v.inE[l].forEach((e: GremlinShortInEdge) => ids.push(e.id));
      }
    }

    if (v.outE) {
      for (var l in v.outE) {
        v.outE[l].forEach((e: GremlinShortOutEdge) => ids.push(e.id));
      }
    }
    return ids;
  }

  /**
   * Retrieve node's property value
   * @param node
   * @param prop
   */
  public static getNodePropValue(node: D3Node, prop: string): undefined | string | number | boolean {
    if (node.hasOwnProperty(prop)) {
      return (node as any)[prop];
    }

    // This is DocDB specific
    if (node.properties && node.properties.hasOwnProperty(prop)) {
      return node.properties[prop][0]["value"];
    }

    return undefined;
  }

  /**
   * Add a new value to the key-values map
   * key <--> [ value1, value2, ... ]
   * @param kvmap
   * @param key
   * @param value
   */
  private static addToMap(kvmap: { [id: string]: string[] }, key: string, value: string): void {
    var values: string[] = [];
    if (kvmap.hasOwnProperty(key)) {
      values = kvmap[key];
    } else {
      kvmap[key] = values;
    }
    if (values.indexOf(value) === -1) {
      values.push(value);
    }
  }

  private deleteVertex(id: string): void {
    const v = this.getVertexById(id);
    const n = this.vertices.indexOf(v);
    this._vertices.splice(n, 1);

    delete this._id2VertexMap[id];
  }

  private static removeIdFromArray(idArray: string[], id2remove: string) {
    const n = idArray.indexOf(id2remove);
    if (n !== -1) {
      idArray.splice(n, 1);
    }
  }

  /**
   * Remove id from map
   * Note: map may end up with empty arrays
   * @param map
   * @param id2remove
   */
  private static removeFromMap(map: MapArray, id2remove: string) {
    // First remove entry if it exists
    if (map.hasOwnProperty(id2remove)) {
      delete map[id2remove];
    }

    // Then remove element if it's in any array
    GraphData.getValues(map).forEach((idArray: string[]) => {
      GraphData.removeIdFromArray(idArray, id2remove);
    });
  }

  /**
   * Remove value2remove for entryId in map
   * @param map
   * @param entryId
   * @param value2Remove
   */
  private static removeEltFromMap(map: MapArray, entryId: string, id2remove: string) {
    const idArray = map[entryId];
    if (!idArray || idArray.length < 1) {
      return;
    }
    GraphData.removeIdFromArray(idArray, id2remove);
  }

  /**
   * Get list of children ids of a given vertex
   * @param vertex
   */
  public static getChildrenId(vertex: GremlinVertex): string[] {
    const ids = <any>{}; // HashSet
    if (vertex.hasOwnProperty("outE")) {
      let outE = vertex.outE;
      for (var label in outE) {
        for (let i = 0; i < outE[label].length; i++) {
          let edge = outE[label][i];
          ids[edge.inV] = true;
        }
      }
    }
    if (vertex.hasOwnProperty("inE")) {
      let inE = vertex.inE;
      for (var label in inE) {
        for (let i = 0; i < inE[label].length; i++) {
          let edge = inE[label][i];
          ids[edge.outV] = true;
        }
      }
    }
    return Object.keys(ids);
  }
}
