import * as React from "react";
import CollapseArrowIcon from "../../../../images/Collapse_arrow_14x14.svg";
import ExpandIcon from "../../../../images/Expand_14x14.svg";
import LoadingIndicatorIcon from "../../../../images/LoadingIndicator_3Squares.gif";
import { GraphVizComponent, GraphVizComponentProps } from "./GraphVizComponent";

interface MiddlePaneComponentProps {
  isTabsContentExpanded: boolean;
  toggleExpandGraph: () => void;
  isBackendExecuting: boolean;
  graphVizProps: GraphVizComponentProps;
}

export class MiddlePaneComponent extends React.Component<MiddlePaneComponentProps> {
  public render(): JSX.Element {
    return (
      <div className="middlePane">
        <div className="graphTitle">
          <span className="paneTitle">Graph</span>
          <span
            className="graphExpandCollapseBtn pull-right"
            onClick={this.props.toggleExpandGraph}
            role="button"
            aria-expanded={this.props.isTabsContentExpanded}
            aria-name="View graph in full screen"
            tabIndex={0}
          >
            <img
              src={this.props.isTabsContentExpanded ? CollapseArrowIcon : ExpandIcon}
              alt={this.props.isTabsContentExpanded ? "collapse graph content" : "expand graph content"}
            />
          </span>
        </div>
        <div className="maingraphContainer">
          <GraphVizComponent forceGraphParams={this.props.graphVizProps.forceGraphParams} />
          {this.props.isBackendExecuting && (
            <div className="graphModal">
              <img src={LoadingIndicatorIcon} alt="Loading Indicator" />
            </div>
          )}
        </div>
      </div>
    );
  }
}
