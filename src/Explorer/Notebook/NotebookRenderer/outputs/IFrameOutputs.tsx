import { AppState, ContentRef, selectors } from "@nteract/core";
import { Output } from "@nteract/outputs";
import Immutable from "immutable";
import React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import * as cdbActions from "../../NotebookComponent/actions";
import { SnapshotFragment } from "../../NotebookComponent/types";
import { SandboxFrame } from "./SandboxFrame";

// Adapted from https://github.com/nteract/nteract/blob/main/packages/stateful-components/src/outputs/index.tsx
// to add support for sandboxing using <iframe>

interface ComponentProps {
  id: string;
  contentRef: ContentRef;
  children: React.ReactNode;
}

interface IFrameOutputsDispatchProps {
  storeSnapshotFragment: (snapshotFragment: SnapshotFragment) => void;
}
interface StateProps {
  hidden: boolean;
  expanded: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  outputs: Immutable.List<any>;
}

export class IFrameOutputs extends React.PureComponent<ComponentProps & StateProps & IFrameOutputsDispatchProps, { snapshotTimestamp: number }> {
  constructor(props: ComponentProps & StateProps & IFrameOutputsDispatchProps) {
    super(props);
    this.state = {
      snapshotTimestamp: undefined
    }
  }

  private onNewSnapshot = (snapshot: SnapshotFragment): void => {
    // console.log('height', snapshot.boundingClientRect.y);
    this.props.storeSnapshotFragment(snapshot);

    // const image2 = imgTemp.replace("image/png", "image/octet-stream");  // here is the most important part because if you dont replace you will get a DOM 18 exception.
    // window.location.href = image2; // it will save locally
  }

  componentDidMount(): void {
    setTimeout(() => {
      this.setState({ snapshotTimestamp: new Date().getTime() });
    }, 10000);
  }

  render(): JSX.Element {
    const { outputs, children, hidden, expanded } = this.props;
    return (
      <SandboxFrame
        style={{ border: "none", width: "100%" }}
        sandbox="allow-downloads allow-forms allow-pointer-lock allow-same-origin allow-scripts"
        snapshotTimestamp={this.state.snapshotTimestamp}
        onNewSnapshot={this.onNewSnapshot}
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
  const mapStateToProps = (state: AppState): StateProps => {
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

    return { outputs, hidden, expanded };
  };
  return mapStateToProps;
};

const makeMapDispatchToProps = () => {
  const mapDispatchToProps = (dispatch: Dispatch) => {
    return {
      storeSnapshotFragment: (snapshot: SnapshotFragment) => {
        return dispatch(
          cdbActions.storeCellOutputSnapshot({ snapshot })
        );
      }
    };
  };
  return mapDispatchToProps;
};


export default connect<StateProps, unknown, ComponentProps, AppState>(makeMapStateToProps, makeMapDispatchToProps)(IFrameOutputs);
