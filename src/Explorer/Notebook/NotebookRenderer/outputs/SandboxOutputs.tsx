import { JSONObject } from "@nteract/commutable";
import { outputToJS } from "@nteract/commutable/lib/v4";
import { actions, AppState, ContentRef, selectors } from "@nteract/core";
import IframeResizer from "iframe-resizer-react";
import Immutable from "immutable";
import postRobot from "post-robot";
import React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import { CellOutputViewerProps, SnapshotResponse } from "../../../../CellOutputViewer/CellOutputViewer";
import * as cdbActions from "../../NotebookComponent/actions";
import { CdbAppState, SnapshotFragment, SnapshotRequest } from "../../NotebookComponent/types";

// Adapted from https://github.com/nteract/nteract/blob/main/packages/stateful-components/src/outputs/index.tsx
// to add support for sandboxing using <iframe>

interface ComponentProps {
  id: string;
  contentRef: ContentRef;
  outputsContainerClassName?: string;
  outputClassName?: string;
}

interface StateProps {
  hidden: boolean;
  expanded: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  outputs: Immutable.List<any>;

  pendingSnapshotRequest: SnapshotRequest;
}

interface DispatchProps {
  onMetadataChange?: (metadata: JSONObject, mediaType: string, index?: number) => void;
  storeNotebookSnapshot: (imageSrc: string, requestId: string) => void;
  storeSnapshotFragment: (cellId: string, snapshotFragment: SnapshotFragment) => void;
  notebookSnapshotError: (error: string) => void;
}

type SandboxOutputsProps = ComponentProps & StateProps & DispatchProps;

export class SandboxOutputs extends React.Component<SandboxOutputsProps> {
  private childWindow: Window;
  private nodeRef = React.createRef<HTMLDivElement>();

  constructor(props: SandboxOutputsProps) {
    super(props);

    this.state = {
      processedSnapshotRequest: undefined,
    };
  }

  render(): JSX.Element {
    // Using min-width to set the width of the iFrame, works around an issue in iOS that can prevent the iFrame from sizing correctly.
    return this.props.outputs && this.props.outputs.size > 0 ? (
      <div ref={this.nodeRef}>
        <IframeResizer
          checkOrigin={false}
          loading="lazy"
          heightCalculationMethod="taggedElement"
          onLoad={(event) => this.handleFrameLoad(event)}
          src="./cellOutputViewer.html"
          style={{ height: "1px", width: "1px", minWidth: "100%", border: "none" }}
          sandbox="allow-downloads allow-popups allow-forms allow-pointer-lock allow-scripts allow-popups-to-escape-sandbox"
        />
      </div>
    ) : (
      <></>
    );
  }

  handleFrameLoad(event: React.SyntheticEvent<HTMLIFrameElement, Event>): void {
    this.childWindow = (event.target as HTMLIFrameElement).contentWindow;
    this.sendPropsToFrame();
  }

  sendPropsToFrame(): void {
    if (!this.childWindow) {
      return;
    }

    const props: CellOutputViewerProps = {
      id: this.props.id,
      contentRef: this.props.contentRef,
      outputsContainerClassName: `nteract-cell-outputs ${this.props.hidden ? "hidden" : ""} ${
        this.props.expanded ? "expanded" : ""
      } ${this.props.outputsContainerClassName}`,
      outputClassName: this.props.outputClassName,
      outputs: this.props.outputs.toArray().map((output) => outputToJS(output)),
      onMetadataChange: this.props.onMetadataChange,
    };

    postRobot.send(this.childWindow, "props", props);
  }

  componentDidMount(): void {
    this.sendPropsToFrame();
  }

  async componentDidUpdate(prevProps: SandboxOutputsProps): Promise<void> {
    this.sendPropsToFrame();

    if (
      this.props.pendingSnapshotRequest &&
      prevProps.pendingSnapshotRequest !== this.props.pendingSnapshotRequest &&
      this.props.pendingSnapshotRequest.notebookContentRef === this.props.contentRef &&
      this.nodeRef?.current
    ) {
      const boundingClientRect = this.nodeRef.current.getBoundingClientRect();

      try {
        const { data } = (await postRobot.send(
          this.childWindow,
          "snapshotRequest",
          this.props.pendingSnapshotRequest
        )) as { data: SnapshotResponse };
        if (this.props.pendingSnapshotRequest.type === "notebook") {
          if (data.imageSrc === undefined) {
            this.props.storeSnapshotFragment(this.props.id, {
              image: undefined,
              boundingClientRect: boundingClientRect,
              requestId: data.requestId,
            });
            return;
          }
          const image = new Image();
          image.src = data.imageSrc;
          image.onload = () => {
            this.props.storeSnapshotFragment(this.props.id, {
              image,
              boundingClientRect: boundingClientRect,
              requestId: data.requestId,
            });
          };
        } else if (this.props.pendingSnapshotRequest.type === "celloutput") {
          this.props.storeNotebookSnapshot(data.imageSrc, this.props.pendingSnapshotRequest.requestId);
        }
      } catch (error) {
        this.props.notebookSnapshotError(error.message);
      }
    }
  }
}

export const makeMapStateToProps = (
  initialState: AppState,
  ownProps: ComponentProps
): ((state: AppState) => StateProps) => {
  const mapStateToProps = (state: CdbAppState): StateProps => {
    let outputs = Immutable.List();
    let hidden = false;
    let expanded = false;

    const { contentRef, id } = ownProps;
    const model = selectors.model(state, { contentRef });

    if (model && model.type === "notebook") {
      const cell = selectors.notebook.cellById(model, { id });
      if (cell) {
        outputs = cell.get("outputs", Immutable.List());
        hidden = cell.cell_type === "code" && cell.getIn(["metadata", "jupyter", "outputs_hidden"]);
        expanded = cell.cell_type === "code" && cell.getIn(["metadata", "collapsed"]) === false;
      }
    }

    // Determine whether to take a snapshot or not
    let pendingSnapshotRequest = state.cdb.pendingSnapshotRequest;
    if (
      pendingSnapshotRequest &&
      pendingSnapshotRequest.type === "celloutput" &&
      pendingSnapshotRequest.cellId !== id
    ) {
      pendingSnapshotRequest = undefined;
    }

    return { outputs, hidden, expanded, pendingSnapshotRequest };
  };
  return mapStateToProps;
};

export const makeMapDispatchToProps = (
  initialDispath: Dispatch,
  ownProps: ComponentProps
): ((dispatch: Dispatch) => DispatchProps) => {
  const { id, contentRef } = ownProps;
  const mapDispatchToProps = (dispatch: Dispatch) => {
    return {
      onMetadataChange: (metadata: JSONObject, mediaType: string, index?: number) => {
        dispatch(
          actions.updateOutputMetadata({
            id,
            contentRef,
            metadata,
            index: index || 0,
            mediaType,
          })
        );
      },
      storeSnapshotFragment: (cellId: string, snapshot: SnapshotFragment) =>
        dispatch(cdbActions.storeCellOutputSnapshot({ cellId, snapshot })),
      storeNotebookSnapshot: (imageSrc: string, requestId: string) =>
        dispatch(cdbActions.storeNotebookSnapshot({ imageSrc, requestId })),
      notebookSnapshotError: (error: string) => dispatch(cdbActions.notebookSnapshotError({ error })),
    };
  };
  return mapDispatchToProps;
};

export default connect<StateProps, DispatchProps, ComponentProps, AppState>(
  makeMapStateToProps,
  makeMapDispatchToProps
)(SandboxOutputs);
