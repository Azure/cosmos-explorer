/**
 * Graph React component
 * Editor for neighbors (targets or sources)
 */

import * as React from "react";
import { NeighborVertexBasicInfo, EditedEdges, GraphNewEdgeData, PossibleVertex } from "./GraphExplorer";
import * as GraphUtil from "./GraphUtil";
import * as InputTypeaheadComponent from "../../Controls/InputTypeahead/InputTypeaheadComponent";
import DeleteIcon from "../../../../images/delete.svg";
import AddPropertyIcon from "../../../../images/Add-property.svg";
import { AccessibleElement } from "../../Controls/AccessibleElement/AccessibleElement";

export interface EditorNeighborsComponentProps {
  isSource: boolean;
  editedNeighbors: EditedEdges;
  possibleVertices: PossibleVertex[];
  possibleEdgeLabels: InputTypeaheadComponent.Item[];
  onUpdateEdges: (editedEdges: EditedEdges, isSource: boolean) => void;
}

export class EditorNeighborsComponent extends React.Component<EditorNeighborsComponentProps> {
  private static readonly SOURCE_TITLE = "Source";
  private static readonly TARGET_TITLE = "Target";
  private static readonly ADD_SOURCE = "Add Source";
  private static readonly ADD_TARGET = "Add Target";
  private static readonly ENTER_SOURCE = "Enter Source";
  private static readonly ENTER_TARGET = "Enter target";
  private static readonly DEFAULT_BLANK_VALUE = "";
  private addNewEdgeToNeighbor: (id: string) => void;

  public constructor(props: EditorNeighborsComponentProps) {
    super(props);
    this.addNewEdgeToNeighbor = this.props.isSource ? this.addNewEdgeToSource : this.addNewEdgeToTarget;
  }

  public override componentDidMount(): void {
    // Show empty text boxes by default if no neighbor for convenience
    if (this.props.editedNeighbors.currentNeighbors.length === 0) {
      if (this.props.isSource) {
        this.addNewEdgeToSource(this.props.editedNeighbors.vertexId);
      } else {
        this.addNewEdgeToTarget(this.props.editedNeighbors.vertexId);
      }
    }
  }

  public override render(): JSX.Element {
    const neighborTitle = this.props.isSource
      ? EditorNeighborsComponent.SOURCE_TITLE
      : EditorNeighborsComponent.TARGET_TITLE;
    return (
      <table className="edgesTable">
        <thead className="propertyTableHeader">
          <tr>
            <td>{neighborTitle}</td>
            <td>Edge label</td>
          </tr>
        </thead>
        <tbody>
          {this.renderCurrentNeighborsFragment()}
          {this.renderAddedEdgesFragment()}
          <tr>
            <td colSpan={2} className="rightPaneAddPropertyBtnPadding">
              <AccessibleElement
                as="span"
                className="rightPaneAddPropertyBtn rightPaneBtns"
                aria-label="Add neighbor"
                onActivated={() => this.addNewEdgeToNeighbor(this.props.editedNeighbors.vertexId)}
              >
                <img src={AddPropertyIcon} alt="Add Property" />{" "}
                {this.props.isSource ? EditorNeighborsComponent.ADD_SOURCE : EditorNeighborsComponent.ADD_TARGET}
              </AccessibleElement>
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  private onUpdateEdges(): void {
    this.props.onUpdateEdges(this.props.editedNeighbors, this.props.isSource);
  }

  private removeCurrentNeighborEdge(index: number): void {
    let sources = this.props.editedNeighbors.currentNeighbors;
    let id = sources[index].edgeId;
    sources.splice(index, 1);

    let droppedIds = this.props.editedNeighbors.droppedIds;
    droppedIds.push(id);
    this.onUpdateEdges();
  }

  private removeAddedEdgeToNeighbor(index: number): void {
    this.props.editedNeighbors.addedEdges.splice(index, 1);
    this.onUpdateEdges();
  }

  private addNewEdgeToSource(inV: string): void {
    this.props.editedNeighbors.addedEdges.push({
      inputInV: inV,
      inputOutV: EditorNeighborsComponent.DEFAULT_BLANK_VALUE,
      label: EditorNeighborsComponent.DEFAULT_BLANK_VALUE,
    });
    this.onUpdateEdges();
  }

  private addNewEdgeToTarget(outV: string): void {
    this.props.editedNeighbors.addedEdges.push({
      inputInV: EditorNeighborsComponent.DEFAULT_BLANK_VALUE,
      inputOutV: outV,
      label: EditorNeighborsComponent.DEFAULT_BLANK_VALUE,
    });
    this.onUpdateEdges();
  }

  private renderNeighborInputFragment(_edge: GraphNewEdgeData): JSX.Element {
    if (this.props.isSource) {
      return (
        <InputTypeaheadComponent.InputTypeaheadComponent
          defaultValue={_edge.inputOutV}
          choices={this.props.possibleVertices}
          onSelected={(newValue: InputTypeaheadComponent.Item) => {
            _edge.inputOutV = newValue.value;
            this.onUpdateEdges();
          }}
          onNewValue={(newValue: string) => {
            _edge.inputOutV = newValue;
            this.onUpdateEdges();
          }}
          placeholder={EditorNeighborsComponent.ENTER_SOURCE}
          typeaheadOverrideOptions={{ dynamic: false }}
          submitFct={(inputValue: string, selection: InputTypeaheadComponent.Item) => {
            _edge.inputOutV = inputValue || selection.value;
            this.onUpdateEdges();
          }}
          showSearchButton={false}
        />
      );
    } else {
      return (
        <InputTypeaheadComponent.InputTypeaheadComponent
          defaultValue={_edge.inputInV}
          choices={this.props.possibleVertices}
          onSelected={(newValue: InputTypeaheadComponent.Item) => {
            _edge.inputInV = newValue.value;
            this.onUpdateEdges();
          }}
          onNewValue={(newValue: string) => {
            _edge.inputInV = newValue;
            this.onUpdateEdges();
          }}
          placeholder={EditorNeighborsComponent.ENTER_TARGET}
          typeaheadOverrideOptions={{ dynamic: false }}
          submitFct={(inputValue: string, selection: InputTypeaheadComponent.Item) => {
            _edge.inputInV = inputValue || selection.value;
            this.onUpdateEdges();
          }}
          showSearchButton={false}
        />
      );
    }
  }

  private renderCurrentNeighborsFragment(): JSX.Element {
    return (
      <React.Fragment>
        {this.props.editedNeighbors.currentNeighbors.map((_neighbor: NeighborVertexBasicInfo, index: number) => (
          <tr key={`${index}_${_neighbor.id}_${_neighbor.edgeLabel}`}>
            <td>
              <span title={GraphUtil.getNeighborTitle(_neighbor)}>{_neighbor.name}</span>
            </td>
            <td className="labelCol">
              <span className="editSeeInPadding">{_neighbor.edgeLabel}</span>
            </td>
            <td className="actionCol">
              <AccessibleElement
                className="rightPaneTrashIcon rightPaneBtns"
                as="span"
                aria-label="Remove current neighbor's edge"
                onActivated={() => this.removeCurrentNeighborEdge(index)}
              >
                <img src={DeleteIcon} alt="Delete" />
              </AccessibleElement>
            </td>
          </tr>
        ))}
      </React.Fragment>
    );
  }

  private renderAddedEdgesFragment(): JSX.Element {
    return (
      <React.Fragment>
        {this.props.editedNeighbors.addedEdges.map((_edge: GraphNewEdgeData, index: number) => (
          <tr key={`${_edge.inputInV}-${_edge.inputOutV}-${index}`}>
            <td className="valueCol">{this.renderNeighborInputFragment(_edge)}</td>
            <td className="labelCol">
              <InputTypeaheadComponent.InputTypeaheadComponent
                defaultValue={_edge.label}
                choices={this.props.possibleEdgeLabels}
                onSelected={(newValue: InputTypeaheadComponent.Item) => {
                  _edge.label = newValue.value;
                  this.onUpdateEdges();
                }}
                onNewValue={(newValue: string) => {
                  _edge.label = newValue;
                  this.onUpdateEdges();
                }}
                placeholder={"Label"}
                typeaheadOverrideOptions={{ dynamic: false }}
                showSearchButton={false}
              />
            </td>
            <td className="actionCol">
              <span className="rightPaneTrashIcon rightPaneBtns">
                <img src={DeleteIcon} alt="Delete" onClick={(e) => this.removeAddedEdgeToNeighbor(index)} />
              </span>
            </td>
          </tr>
        ))}
      </React.Fragment>
    );
  }
}
