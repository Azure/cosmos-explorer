import * as React from "react";
import { FocusZone } from "office-ui-fabric-react/lib/FocusZone";
import { AccessibleElement } from "../../Controls/AccessibleElement/AccessibleElement";

export interface CaptionId {
  caption: string;
  id: string;
}

interface LeftPaneComponentProps {
  isFilterGraphEmptyResult: boolean;
  possibleRootNodes: CaptionId[];
  onRootNodeSelected: (id: string) => void;
  selectedRootId: string;
  isUiBusy: boolean;
  onLoadNextPage: () => void;
  hasMoreRoots: boolean;
}

export class LeftPaneComponent extends React.Component<LeftPaneComponentProps> {
  public render(): JSX.Element {
    return (
      <div className="leftPane">
        <div className="paneTitle leftPaneResults">Results</div>
        <div className="leftPaneContent contentScroll">
          <div className="leftPaneContainer">
            {this.props.isFilterGraphEmptyResult && <div>None</div>}
            <FocusZone as="table" className="table table-hover">
              <tbody>
                {this.props.possibleRootNodes.map((rootNode: CaptionId) => this.renderRootNodeRow(rootNode))}
              </tbody>
            </FocusZone>
          </div>
        </div>
        <div className="loadMore">
          {this.props.hasMoreRoots && (
            <AccessibleElement role="link" as="a" onActivated={this.props.onLoadNextPage} aria-label="Load More nodes">
              Load more
            </AccessibleElement>
          )}
        </div>
      </div>
    );
  }

  private renderRootNodeRow(node: CaptionId): JSX.Element {
    let className = "pointer";
    if (this.props.selectedRootId === node.id) {
      className += " gridRowSelected";
    }

    if (this.props.isUiBusy) {
      className += " disabled";
    }

    return (
      <AccessibleElement
        className={className}
        as="tr"
        aria-label={node.caption}
        onActivated={(e) => this.props.onRootNodeSelected(node.id)}
        key={node.id}
      >
        <td className="resultItem">
          <a title={node.caption}>{node.caption}</a>
        </td>
      </AccessibleElement>
    );
  }
}
