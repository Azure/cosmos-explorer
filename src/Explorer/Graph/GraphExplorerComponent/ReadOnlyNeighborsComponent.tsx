/**
 * Graph React component
 * Read-only neighbors (targets or sources)
 */

import * as React from "react";
import { GraphHighlightedNodeData, NeighborVertexBasicInfo } from "./GraphExplorer";
import { GraphUtil } from "./GraphUtil";
import { AccessibleElement } from "../../Controls/AccessibleElement/AccessibleElement";

export interface ReadOnlyNeighborsComponentProps {
  node: GraphHighlightedNodeData;
  isSource: boolean;
  selectNode: (id: string) => void;
}

export class ReadOnlyNeighborsComponent extends React.Component<ReadOnlyNeighborsComponentProps> {
  private static readonly NO_SOURCES_LABEL = "No sources found";
  private static readonly SOURCE_TITLE = "Source";
  private static readonly NO_TARGETS_LABEL = "No targets found";
  private static readonly TARGET_TITLE = "Target";

  public render(): JSX.Element {
    const neighbors = this.props.isSource ? this.props.node.sources : this.props.node.targets;
    const noNeighborsLabel = this.props.isSource
      ? ReadOnlyNeighborsComponent.NO_SOURCES_LABEL
      : ReadOnlyNeighborsComponent.NO_TARGETS_LABEL;

    if (neighbors.length === 0) {
      return <span className="noSourcesLabel">{noNeighborsLabel}</span>;
    } else {
      const neighborTitle = this.props.isSource
        ? ReadOnlyNeighborsComponent.SOURCE_TITLE
        : ReadOnlyNeighborsComponent.TARGET_TITLE;
      return (
        <table className="edgesTable">
          <thead className="propertyTableHeader">
            <tr>
              <td>{neighborTitle}</td>
              <td className="edgeLabel">Edge label</td>
            </tr>
          </thead>
          <tbody>
            {neighbors.map((_neighbor: NeighborVertexBasicInfo, index: number) => (
              <tr key={`${index}_${_neighbor.id}_${_neighbor.edgeLabel}`}>
                <td>
                  <AccessibleElement
                    className="clickableLink"
                    as="a"
                    aria-label={_neighbor.name}
                    onActivated={e => this.props.selectNode(_neighbor.id)}
                    title={GraphUtil.getNeighborTitle(_neighbor)}
                  >
                    {_neighbor.name}
                  </AccessibleElement>
                </td>
                <td className="labelCol">{_neighbor.edgeLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
  }
}
