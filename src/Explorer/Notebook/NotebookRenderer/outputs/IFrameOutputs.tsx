import { AppState, ContentRef, selectors } from "@nteract/core";
import { Output } from "@nteract/outputs";
import Immutable from "immutable";
import React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import * as cdbActions from "../../NotebookComponent/actions";
import { CdbAppState, SnapshotFragment, SnapshotRequest } from "../../NotebookComponent/types";
import { SandboxFrame } from "./SandboxFrame";

// Adapted from https://github.com/nteract/nteract/blob/main/packages/stateful-components/src/outputs/index.tsx
// to add support for sandboxing using <iframe>

interface ComponentProps {
  id: string;
  contentRef: ContentRef;
  children: React.ReactNode;
}

interface DispatchProps {
  storeNotebookSnapshot: (imageSrc: string, requestId: string) => void;
  storeSnapshotFragment: (cellId: string, snapshotFragment: SnapshotFragment) => void;
  notebookSnapshotError: (error: string) => void;
}
interface StateProps {
  hidden: boolean;
  expanded: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  outputs: Immutable.List<any>;

  pendingSnapshotRequest: SnapshotRequest;
}

type IFrameOutputProps = ComponentProps & StateProps & DispatchProps;
export class IFrameOutputs extends React.PureComponent<IFrameOutputProps> {
  render(): JSX.Element {
    const { outputs, children, hidden, expanded, pendingSnapshotRequest } = this.props;
    return (
      <SandboxFrame
        style={{ border: "none", width: "100%" }}
        sandbox="allow-downloads allow-forms allow-pointer-lock allow-same-origin allow-scripts"
        snapshotRequest={pendingSnapshotRequest}
        onNewSnapshot={(snapshot) => {
          if (this.props.pendingSnapshotRequest.type === "notebook") {
            this.props.storeSnapshotFragment(this.props.id, snapshot);
          } else if (this.props.pendingSnapshotRequest.type === "celloutput") {
            this.props.storeNotebookSnapshot(snapshot.image.src, this.props.pendingSnapshotRequest.requestId);
          }
        }}
        onError={error => this.props.notebookSnapshotError(error.message)}
      >
        <div className={`nteract-cell-outputs ${hidden ? "hidden" : ""} ${expanded ? "expanded" : ""}`}>
          {outputs.map((output, index) => (
            <Output output={output} key={index}>
              {children}
            </Output>
          ))}
        </div>
      </SandboxFrame>
    );
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
    if (pendingSnapshotRequest && pendingSnapshotRequest.type === "celloutput" && pendingSnapshotRequest.cellId !== id) {
      pendingSnapshotRequest = undefined;
    }

    return {
      outputs,
      hidden,
      expanded,
      pendingSnapshotRequest
    };
  };
  return mapStateToProps;
};



const makeMapDispatchToProps = () => {
  const mapDispatchToProps = (dispatch: Dispatch) => {
    return {
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
)(IFrameOutputs);
