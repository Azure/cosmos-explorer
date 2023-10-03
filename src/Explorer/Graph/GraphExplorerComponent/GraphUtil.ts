import * as ViewModels from "../../../Contracts/ViewModels";
import * as GraphData from "./GraphData";
import { NeighborVertexBasicInfo } from "./GraphExplorer";

interface JoinArrayMaxCharOutput {
  result: string; // string output
  consumedCount: number; // Number of items consumed
}

interface EdgePropertyType {
  id: string;
  outV?: string;
  inV?: string;
}

export const getNeighborTitle = (neighbor: NeighborVertexBasicInfo): string => {
  return `edge id: ${neighbor.edgeId}, vertex id: ${neighbor.id}`;
};

/**
 * Collect all edges from this node
 * @param vertex
 * @param graphData
 * @param newNodes (optional) object describing new nodes encountered
 */
export const createEdgesfromNode = (
  vertex: GraphData.GremlinVertex,
  graphData: GraphData.GraphData<GraphData.GremlinVertex, GraphData.GremlinEdge>,
  newNodes?: { [id: string]: boolean },
): void => {
  if (Object.prototype.hasOwnProperty.call(vertex, "outE")) {
    const outE = vertex.outE;
    for (const label in outE) {
      $.each(outE[label], (index: number, edge: EdgePropertyType) => {
        // We create our own edge. No need to fetch
        const e = {
          id: edge.id,
          label: label,
          inV: edge.inV,
          outV: vertex.id,
        };

        graphData.addEdge(e);
        if (newNodes) {
          newNodes[edge.inV] = true;
        }
      });
    }
  }
  if (Object.prototype.hasOwnProperty.call(vertex, "inE")) {
    const inE = vertex.inE;
    for (const label in inE) {
      $.each(inE[label], (index: number, edge: EdgePropertyType) => {
        // We create our own edge. No need to fetch
        const e = {
          id: edge.id,
          label: label,
          inV: vertex.id,
          outV: edge.outV,
        };

        graphData.addEdge(e);
        if (newNodes) {
          newNodes[edge.outV] = true;
        }
      });
    }
  }
};

/**
 * From ['id1', 'id2', 'idn'] build the following string "'id1','id2','idn'".
 * The string length cannot exceed maxSize.
 *  @param array
 * @param maxSize
 * @return
 */
export const getLimitedArrayString = (array: string[], maxSize: number): JoinArrayMaxCharOutput => {
  if (!array || array.length === 0 || array[0].length + 2 > maxSize) {
    return { result: "", consumedCount: 0 };
  }

  const end = array.length - 1;
  let output = `'${array[0]}'`;
  let i = 0;
  for (; i < end; i++) {
    const candidate = `${output},'${array[i + 1]}'`;
    if (candidate.length <= maxSize) {
      output = candidate;
    } else {
      break;
    }
  }

  return {
    result: output,
    consumedCount: i + 1,
  };
};

export const createFetchEdgePairQuery = (
  outE: boolean,
  pkid: string,
  excludedEdgeIds: string[],
  startIndex: number,
  pageSize: number,
  withoutStepArgMaxLenght: number,
): string => {
  let gremlinQuery: string;
  if (excludedEdgeIds.length > 0) {
    // build a string up to max char
    const joined = getLimitedArrayString(excludedEdgeIds, withoutStepArgMaxLenght);
    const hasWithoutStep = joined.result ? `.has(id, without(${joined.result}))` : "";

    if (joined.consumedCount === excludedEdgeIds.length) {
      gremlinQuery = `g.V(${pkid}).${outE ? "outE" : "inE"}()${hasWithoutStep}.limit(${pageSize}).as('e').${
        outE ? "inV" : "outV"
      }().as('v').select('e', 'v')`;
    } else {
      const start = startIndex - joined.consumedCount;
      gremlinQuery = `g.V(${pkid}).${outE ? "outE" : "inE"}()${hasWithoutStep}.range(${start},${
        start + pageSize
      }).as('e').${outE ? "inV" : "outV"}().as('v').select('e', 'v')`;
    }
  } else {
    gremlinQuery = `g.V(${pkid}).${outE ? "outE" : "inE"}().limit(${pageSize}).as('e').${
      outE ? "inV" : "outV"
    }().as('v').select('e', 'v')`;
  }
  return gremlinQuery;
};

/**
 * Trim graph
 */
export const trimGraph = (
  currentRoot: GraphData.GremlinVertex,
  graphData: GraphData.GraphData<GraphData.GremlinVertex, GraphData.GremlinEdge>,
): void => {
  const importantNodes = [currentRoot.id].concat(currentRoot._ancestorsId);
  graphData.unloadAllVertices(importantNodes);

  // Keep only ancestors node in fixed position
  $.each(graphData.ids, (index: number, id: string) => {
    graphData.getVertexById(id)._isFixedPosition = importantNodes.indexOf(id) !== -1;
  });
};

export const addRootChildToGraph = (
  root: GraphData.GremlinVertex,
  child: GraphData.GremlinVertex,
  graphData: GraphData.GraphData<GraphData.GremlinVertex, GraphData.GremlinEdge>,
): void => {
  child._ancestorsId = (root._ancestorsId || []).concat([root.id]);
  graphData.addVertex(child);
  createEdgesfromNode(child, graphData);
  graphData.addNeighborInfo(child);
};

/**
 * TODO Perform minimal substitution to prevent breaking gremlin query and allow \"" for now.
 * @param value
 */
export const escapeDoubleQuotes = (value: string): string => {
  return value === undefined ? value : value.replace(/"/g, '\\"');
};

/**
 * Surround with double-quotes if val is a string.
 * @param val
 */
export const getQuotedPropValue = (ip: ViewModels.InputPropertyValue): string => {
  switch (ip.type) {
    case "number":
    case "boolean":
      return `${ip.value}`;
    case "null":
      return undefined;
    default:
      return `"${escapeDoubleQuotes(ip.value as string)}"`;
  }
};

/**
 * TODO Perform minimal substitution to prevent breaking gremlin query and allow \' for now.
 * @param value
 */
export const escapeSingleQuotes = (value: string): string => {
  return value === undefined ? value : value.replace(/'/g, "\\'");
};
