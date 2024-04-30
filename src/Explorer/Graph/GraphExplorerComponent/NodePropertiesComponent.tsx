/**
 * Graph React component
 * Display of properties
 * The mode is controlled by the parent of this component
 */

import * as React from "react";
import CancelIcon from "../../../../images/cancel.svg";
import CheckIcon from "../../../../images/check-1.svg";
import DeleteIcon from "../../../../images/delete.svg";
import EditIcon from "../../../../images/edit-1.svg";
import * as ViewModels from "../../../Contracts/ViewModels";
import { AccessibleElement } from "../../Controls/AccessibleElement/AccessibleElement";
import { CollapsiblePanel } from "../../Controls/CollapsiblePanel/CollapsiblePanel";
import { Item } from "../../Controls/InputTypeahead/InputTypeaheadComponent";
import { ConsoleDataType } from "../../Menus/NotificationConsole/ConsoleData";
import * as EditorNeighbors from "./EditorNeighborsComponent";
import { EditorNodePropertiesComponent } from "./EditorNodePropertiesComponent";
import {
  EditedEdges,
  EditedProperties,
  GraphExplorer,
  GraphHighlightedNodeData,
  PossibleVertex,
} from "./GraphExplorer";
import { ReadOnlyNeighborsComponent } from "./ReadOnlyNeighborsComponent";
import { ReadOnlyNodePropertiesComponent } from "./ReadOnlyNodePropertiesComponent";

export enum Mode {
  READONLY_PROP,
  PROPERTY_EDITOR,
  EDIT_SOURCES,
  EDIT_TARGETS,
}

export interface NodePropertiesComponentProps {
  expandedTitle: string;
  isCollapsed: boolean;
  onCollapsedChanged: (newValue: boolean) => void;

  node: GraphHighlightedNodeData;
  getPkIdFromNodeData: (v: GraphHighlightedNodeData) => string;
  collectionPartitionKeyProperty: string;
  updateVertexProperties: (editedProperties: EditedProperties) => Q.Promise<void>;
  selectNode: (id: string) => void;
  updatePossibleVertices: () => Q.Promise<PossibleVertex[]>;
  possibleEdgeLabels: Item[];
  editGraphEdges: (editedEdges: EditedEdges) => Q.Promise<any>;
  deleteHighlightedNode: () => void;
  onModeChanged: (newMode: Mode) => void;
  viewMode: Mode; // If viewMode is specified in parent, keep state in sync with it
}

interface NodePropertiesComponentState {
  possibleVertices: PossibleVertex[];
  editedProperties: EditedProperties;
  editedSources: EditedEdges;
  editedTargets: EditedEdges;
  isDeleteConfirm: boolean;
  isPropertiesExpanded: boolean;
  isSourcesExpanded: boolean;
  isTargetsExpanded: boolean;
}

export class NodePropertiesComponent extends React.Component<
  NodePropertiesComponentProps,
  NodePropertiesComponentState
> {
  private static readonly PROPERTIES_COLLAPSED_TITLE = "Properties";

  public constructor(props: NodePropertiesComponentProps) {
    super(props);
    this.state = {
      editedProperties: {
        pkId: undefined,
        readOnlyProperties: [],
        existingProperties: [],
        addedProperties: [],
        droppedKeys: [],
      },
      editedSources: {
        vertexId: undefined,
        currentNeighbors: [],
        droppedIds: [],
        addedEdges: [],
      },
      editedTargets: {
        vertexId: undefined,
        currentNeighbors: [],
        droppedIds: [],
        addedEdges: [],
      },
      possibleVertices: [],
      isDeleteConfirm: false,
      isPropertiesExpanded: true,
      isSourcesExpanded: true,
      isTargetsExpanded: true,
    };
  }

  public static getDerivedStateFromProps(props: NodePropertiesComponentProps): Partial<NodePropertiesComponentState> {
    if (props.viewMode !== Mode.READONLY_PROP) {
      return { isDeleteConfirm: false };
    }

    return undefined;
  }

  public render(): JSX.Element {
    if (!this.props.node) {
      return <span />;
    } else {
      return (
        <CollapsiblePanel
          collapsedTitle={NodePropertiesComponent.PROPERTIES_COLLAPSED_TITLE}
          expandedTitle={this.props.expandedTitle}
          isCollapsed={this.props.isCollapsed}
          onCollapsedChanged={this.props.onCollapsedChanged.bind(this)}
        >
          {this.getHeaderFragment()}

          <div className="rightPaneContent contentScroll">
            <div className="rightPaneContainer">
              {this.getPropertiesFragment()}
              {this.getNeighborsContainer()}
            </div>
          </div>
        </CollapsiblePanel>
      );
    }
  }

  /**
   * Get type option. Limit to string, number or boolean
   * @param value
   */
  private static getTypeOption(value: any): ViewModels.InputPropertyValueTypeString {
    if (value === undefined) {
      return "null";
    }
    const type = typeof value;
    switch (type) {
      case "number":
      case "boolean":
        return type;
      case "undefined":
        return "null";
      default:
        return "string";
    }
  }

  private setMode(newMode: Mode): void {
    this.props.onModeChanged(newMode);
  }

  private saveProperties(): void {
    this.props.updateVertexProperties(this.state.editedProperties).then(() => this.setMode(Mode.READONLY_PROP));
  }

  private showPropertyEditor(): void {
    const partitionKeyProperty = this.props.collectionPartitionKeyProperty;
    // deep copy highlighted node
    const readOnlyProps: ViewModels.InputProperty[] = [
      {
        key: "label",
        values: [{ value: this.props.node.label, type: "string" }],
      },
    ];

    const existingProps: ViewModels.InputProperty[] = [];
    if (this.props.node.hasOwnProperty("properties")) {
      const hProps = this.props.node["properties"];
      for (const p in hProps) {
        const propValues = hProps[p];
        (p === partitionKeyProperty ? readOnlyProps : existingProps).push({
          key: p,
          values: propValues.map((val) => ({
            value: val.toString(),
            type: NodePropertiesComponent.getTypeOption(val),
          })),
        });
      }
    }

    const newMode = Mode.PROPERTY_EDITOR;
    this.setState({
      editedProperties: {
        pkId: this.props.getPkIdFromNodeData(this.props.node),
        readOnlyProperties: readOnlyProps,
        existingProperties: existingProps,
        addedProperties: [],
        droppedKeys: [],
      },
    });
    this.props.onModeChanged(newMode);
  }

  private showSourcesEditor(): void {
    this.props.updatePossibleVertices().then((possibleVertices: PossibleVertex[]) => {
      this.setState({
        possibleVertices: possibleVertices,
      });

      const editedSources: EditedEdges = {
        vertexId: this.props.node.id,
        currentNeighbors: this.props.node.sources.slice(),
        droppedIds: [],
        addedEdges: [],
      };

      const newMode = Mode.EDIT_SOURCES;
      this.setState({
        editedProperties: this.state.editedProperties,
        editedSources: editedSources,
      });
      this.props.onModeChanged(newMode);
    });
  }

  private showTargetsEditor(): void {
    this.props.updatePossibleVertices().then((possibleVertices: PossibleVertex[]) => {
      this.setState({
        possibleVertices: possibleVertices,
      });

      const editedTargets: EditedEdges = {
        vertexId: this.props.node.id,
        currentNeighbors: this.props.node.targets.slice(),
        droppedIds: [],
        addedEdges: [],
      };

      const newMode = Mode.EDIT_TARGETS;
      this.setState({
        editedProperties: this.state.editedProperties,
        editedTargets: editedTargets,
      });
      this.props.onModeChanged(newMode);
    });
  }

  private updateVertexNeighbors(isSource: boolean): void {
    const editedEdges = isSource ? this.state.editedSources : this.state.editedTargets;
    this.props.editGraphEdges(editedEdges).then(
      () => {
        this.setMode(Mode.READONLY_PROP);
      },
      () => {
        GraphExplorer.reportToConsole(ConsoleDataType.Error, "Failed to update Vertex sources.");
      },
    );
  }

  private onUpdateProperties(editedProperties: EditedProperties): void {
    this.setState({
      editedProperties: editedProperties,
    });
  }

  private onUpdateEdges(editedEdges: EditedEdges, isSource: boolean): void {
    if (isSource) {
      this.setState({ editedSources: editedEdges });
    } else {
      this.setState({ editedTargets: editedEdges });
    }
  }

  private setIsDeleteConfirm(state: boolean): void {
    this.setState({
      isDeleteConfirm: state,
    });
  }

  private discardChanges(): void {
    this.props.onModeChanged(Mode.READONLY_PROP);
  }

  /**
   * Right-pane expand collapse
   */
  private expandCollapseProperties(): void {
    // Do not collapse while editing
    if (this.props.viewMode === Mode.PROPERTY_EDITOR && this.state.isPropertiesExpanded) {
      return;
    }

    const isExpanded = this.state.isPropertiesExpanded;
    this.setState({ isPropertiesExpanded: !isExpanded });
    if (!isExpanded) {
      $("#propertiesContent").slideDown("fast", () => {
        /* Animation complete */
      });
    } else {
      $("#propertiesContent").slideUp("fast", () => {
        /* Animation complete */
      });
    }
  }

  private expandCollapseSources(): void {
    // Do not collapse while editing
    if (this.props.viewMode === Mode.EDIT_SOURCES && this.state.isSourcesExpanded) {
      return;
    }

    const isExpanded = this.state.isSourcesExpanded;
    this.setState({ isSourcesExpanded: !isExpanded });
    if (!isExpanded) {
      $("#sourcesContent").slideDown("fast", () => {
        /* Animation complete */
      });
    } else {
      $("#sourcesContent").slideUp("fast", () => {
        /* Animation complete */
      });
    }
  }
  private expandCollapseTargets(): void {
    // Do not collapse while editing
    if (this.props.viewMode === Mode.EDIT_TARGETS && this.state.isTargetsExpanded) {
      return;
    }

    const isExpanded = this.state.isTargetsExpanded;
    this.setState({ isTargetsExpanded: !isExpanded });
    if (!isExpanded) {
      $("#targetsContent").slideDown("fast", () => {
        /* Animation complete */
      });
    } else {
      $("#targetsContent").slideUp("fast", () => {
        /* Animation complete */
      });
    }
  }

  private deleteHighlightedNode(): void {
    this.setIsDeleteConfirm(false);
    this.props.deleteHighlightedNode();
  }

  private getConfirmDeleteButtonsFragment(): JSX.Element {
    if (!this.state.isDeleteConfirm) {
      return (
        <AccessibleElement
          className="rightPaneHeaderTrashIcon rightPaneBtns"
          as="span"
          onActivated={this.setIsDeleteConfirm.bind(this, true)}
          aria-label="Delete this vertex"
        >
          <img src={DeleteIcon} alt="Delete" role="button" />
        </AccessibleElement>
      );
    } else {
      return (
        <span className="deleteConfirm">
          Delete this vertex?
          <AccessibleElement
            className="rightPaneCheckMark rightPaneBtns"
            as="span"
            aria-label="Confirm delete this vertex"
            onActivated={this.deleteHighlightedNode.bind(this)}
          >
            <img src={CheckIcon} alt="Save" />
          </AccessibleElement>
          <AccessibleElement
            className="rightPaneDiscardBtn rightPaneBtns"
            as="span"
            aria-label="Cancel delete this vertex"
            onActivated={this.setIsDeleteConfirm.bind(this, false)}
          >
            <img className="discardBtn" src={CancelIcon} alt="Cancel" />
          </AccessibleElement>
        </span>
      );
    }
  }

  private getHeaderFragment(): JSX.Element {
    return (
      <div className="rightPaneHeader">
        {this.props.viewMode === Mode.READONLY_PROP && (
          <span className="pull-right">{this.getConfirmDeleteButtonsFragment()}</span>
        )}
      </div>
    );
  }

  /**
   * Section Header containing the edit/cancel buttons
   */
  private getSectionHeaderButtonFragment(
    isSectionExpanded: boolean,
    expandClickHandler: () => void,
    currentView: Mode,
    saveClickHandler: () => void,
  ): JSX.Element {
    if (isSectionExpanded) {
      return (
        <div className="pull-right">
          {this.props.viewMode === Mode.READONLY_PROP && !this.state.isDeleteConfirm && (
            <AccessibleElement
              className="rightPaneEditIcon rightPaneBtns editBtn"
              as="span"
              aria-label="Edit properties"
              onActivated={expandClickHandler}
            >
              <img src={EditIcon} alt="Edit" role="button" />
            </AccessibleElement>
          )}

          {this.props.viewMode === currentView && (
            <AccessibleElement
              className="rightPaneCheckMark rightPaneBtns"
              as="span"
              aria-label="Save property changes"
              onActivated={saveClickHandler}
            >
              <img src={CheckIcon} alt="Save" />
            </AccessibleElement>
          )}
          {this.props.viewMode === currentView && (
            <AccessibleElement
              className="rightPaneDiscardBtn rightPaneBtns"
              as="span"
              aria-label="Discard property changes"
              onActivated={this.discardChanges.bind(this)}
            >
              <img className="discardBtn" src={CancelIcon} alt="Cancel" />
            </AccessibleElement>
          )}
        </div>
      );
    } else {
      return undefined;
    }
  }

  private getPropertiesFragment(): JSX.Element {
    return (
      <React.Fragment>
        {this.getSectionHeaderButtonFragment(
          this.state.isPropertiesExpanded,
          this.showPropertyEditor.bind(this),
          Mode.PROPERTY_EDITOR,
          this.saveProperties.bind(this),
        )}
        <AccessibleElement
          className="sectionHeader"
          as="div"
          aria-label={this.state.isPropertiesExpanded ? "Collapse properties" : "Expand properties"}
          onActivated={this.expandCollapseProperties.bind(this)}
        >
          <span className={this.state.isPropertiesExpanded ? "expanded" : "collapsed"} />
          <span className="sectionTitle">Properties</span>
        </AccessibleElement>
        <div className="sectionContent" id="propertiesContent">
          {(this.props.viewMode === Mode.READONLY_PROP ||
            this.props.viewMode === Mode.EDIT_SOURCES ||
            this.props.viewMode === Mode.EDIT_TARGETS) && <ReadOnlyNodePropertiesComponent node={this.props.node} />}

          {this.props.viewMode === Mode.PROPERTY_EDITOR && (
            <EditorNodePropertiesComponent
              editedProperties={this.state.editedProperties}
              onUpdateProperties={this.onUpdateProperties.bind(this)}
            />
          )}
        </div>
      </React.Fragment>
    );
  }

  private getNeighborContentFragment(isSource: boolean): JSX.Element {
    const editViewMode = isSource ? Mode.EDIT_SOURCES : Mode.EDIT_TARGETS;
    const editedNeighbors = isSource ? this.state.editedSources : this.state.editedTargets;

    if (this.props.viewMode === editViewMode) {
      return (
        <EditorNeighbors.EditorNeighborsComponent
          editedNeighbors={editedNeighbors}
          isSource={isSource}
          possibleVertices={this.state.possibleVertices}
          possibleEdgeLabels={this.props.possibleEdgeLabels}
          onUpdateEdges={this.onUpdateEdges.bind(this)}
        />
      );
    } else {
      return (
        <ReadOnlyNeighborsComponent node={this.props.node} isSource={isSource} selectNode={this.props.selectNode} />
      );
    }
  }

  private getNeighborFragment(isSource: boolean): JSX.Element {
    const isNeighborExpanded = isSource ? this.state.isSourcesExpanded : this.state.isTargetsExpanded;
    const showNeighborEditor = isSource ? this.showSourcesEditor.bind(this) : this.showTargetsEditor.bind(this);
    const currentNeighborView = isSource ? Mode.EDIT_SOURCES : Mode.EDIT_TARGETS;
    const expandCollapseNeighbor = isSource
      ? this.expandCollapseSources.bind(this)
      : this.expandCollapseTargets.bind(this);
    const sectionLabel = isSource ? "Sources" : "Targets";
    const sectionContentId = isSource ? "sourcesContent" : "targetsContent";

    return (
      <React.Fragment>
        {this.getSectionHeaderButtonFragment(
          isNeighborExpanded,
          showNeighborEditor,
          currentNeighborView,
          this.updateVertexNeighbors.bind(this, isSource),
        )}

        <AccessibleElement
          className="sectionHeader"
          as="div"
          aria-label={`${this.state.isPropertiesExpanded ? "Collapse" : "Expand"} ${sectionLabel}`}
          onActivated={expandCollapseNeighbor}
        >
          <span className={isNeighborExpanded ? "expanded" : "collapsed"} />
          <span className="sectionTitle">{sectionLabel}</span>
        </AccessibleElement>

        <div className="sectionContent" id={sectionContentId}>
          {this.getNeighborContentFragment(isSource)}
        </div>
      </React.Fragment>
    );
  }

  private getNeighborsContainer(): JSX.Element {
    if (!this.props.node.areNeighborsUnknown) {
      return (
        <React.Fragment>
          {this.getNeighborFragment(true)}
          {this.getNeighborFragment(false)}
        </React.Fragment>
      );
    } else {
      return <React.Fragment />;
    }
  }
}
