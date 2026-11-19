import * as React from "react";
import { D3ForceGraph, D3ForceGraphParameters } from "./D3ForceGraph";

export interface GraphVizComponentProps {
  forceGraphParams: D3ForceGraphParameters;
}

/**
 * Both React and D3 are modifying the DOM and therefore should not share control.
 * The approach taken here is to block React updates and let d3 take control of the dom and do its thing.
 */
export class GraphVizComponent extends React.Component<GraphVizComponentProps> {
  private forceGraph: D3ForceGraph;
  private rootNode: Element;

  public constructor(props: GraphVizComponentProps) {
    super(props);
    this.forceGraph = new D3ForceGraph(this.props.forceGraphParams);
  }

  public componentDidMount(): void {
    this.forceGraph.init(this.rootNode);
  }

  public shouldComponentUpdate(): boolean {
    // Prevents component re-rendering
    return false;
  }

  public componentWillUnmount(): void {
    this.forceGraph.destroy();
  }

  public render(): JSX.Element {
    return (
      <svg id="maingraph" ref={(elt: Element) => this.setRef(elt)}>
        <title>Main Graph</title>
        <defs>
          <g id="loadMoreIcon">
            {/* svg load more icon inlined as-is here: remove the style="fill:#374649;" so we can override it */}
            <svg
              role="img"
              aria-label="graph"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              x="0px"
              y="0px"
              width="30px"
              height="16px"
              viewBox="0 0 30 16"
              style={
                {
                  /*enableBackground: 'new 0 0 30 16'*/
                }
              }
              xmlSpace="preserve"
              aria-label="Load more icon"
            >
              <title>Load More Icon</title>
              <g style={{ opacity: 1 }}>
                <g>
                  <g style={{ opacity: 0.4 }}>
                    <ellipse
                      transform="matrix(0.9903 -0.1393 0.1393 0.9903 -1.4513 2.1015)"
                      cx="14.3"
                      cy="11.4"
                      rx="4.1"
                      ry="4.1"
                    />
                  </g>
                  <g style={{ opacity: 0.4 }}>
                    <ellipse
                      transform="matrix(0.3256 -0.9455 0.9455 0.3256 11.2761 30.3703)"
                      cx="26.9"
                      cy="7.3"
                      rx="3.1"
                      ry="3.1"
                    />
                  </g>
                  <line
                    style={{ opacity: 0.5, fill: "none", stroke: "#BABCBE", strokeMiterlimit: 10 }}
                    x1="14.4"
                    y1="7.3"
                    x2="14.6"
                    y2="2.5"
                  />
                  <line
                    style={{ opacity: 0.5, fill: "none", stroke: "#BABCBE", strokeMiterlimit: 10 }}
                    x1="17.6"
                    y1="1.1"
                    x2="24.5"
                    y2="5.4"
                  />
                  <g style={{ opacity: 0.4 }}>
                    <ellipse
                      transform="matrix(0.932 -0.3625 0.3625 0.932 -0.9642 1.3456)"
                      cx="3.1"
                      cy="3.2"
                      rx="3.1"
                      ry="3.1"
                    />
                  </g>
                  <line
                    style={{ opacity: 0.5, fill: "none", stroke: "#BABCBE", strokeMiterlimit: 10 }}
                    x1="10.6"
                    y1="1.1"
                    x2="6.1"
                    y2="2.5"
                  />
                </g>
              </g>
            </svg>
            {/* <!-- End of load more icon --> */}

            {/* <!-- Make whole area clickable instead of the shape --> */}
            <rect x="0px" y="0px" width="32px" height="17px" style={{ fillOpacity: 0 }} />
          </g>

          <marker
            id={`${this.forceGraph.getArrowHeadSymbolId()}-marker`}
            viewBox="0 -5 10 10"
            refX="8"
            refY="0"
            markerWidth="10"
            markerHeight="10"
            orient="auto"
            markerUnits="userSpaceOnUse"
            fill="#aaa"
            stroke="#aaa"
            fillOpacity="1"
            strokeOpacity="1"
          >
            <path d="M0,-4L10,0L0,4" style={{ stroke: "none" }} />
          </marker>
        </defs>
        <symbol>
          <g id="triangleRight">
            <svg
              role="img"
              aria-label="graph"
              version="1.1"
              id="Layer_1"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              x="0px"
              y="0px"
              viewBox="0 0 6 10"
              style={
                {
                  /*enableBackground: 'new 0 0 6 10'*/
                }
              }
              xmlSpace="preserve"
              width="20px"
              height="20px"
            >
              <title>Triangle Right</title>
              <polygon points="0.5,10 0.5,0 5.2,5 " />
            </svg>
            {/*<!-- Make whole area clickable instead of the shape -->*/}
            <rect x="0px" y="0px" width="15px" height="20px" style={{ fillOpacity: 0 }} />
          </g>
        </symbol>
        <symbol>
          <g id={`${this.forceGraph.getArrowHeadSymbolId()}-nonMarker`}>
            <polygon points="0,0 -8,-3 -8,3 " />
          </g>
        </symbol>
      </svg>
    );
  }

  private setRef(element: Element): void {
    this.rootNode = element;
  }
}
