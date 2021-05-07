import { JSONObject } from "@nteract/commutable";
import { outputToJS } from "@nteract/commutable/lib/v4";
import { actions, AppState, ContentRef, selectors } from "@nteract/core";
import IframeResizer from "iframe-resizer-react";
import Immutable from "immutable";
import postRobot from "post-robot";
import React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import { CellOutputViewerProps } from "../../../../CellOutputViewer/CellOutputViewer";

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
}

interface DispatchProps {
  onMetadataChange?: (metadata: JSONObject, mediaType: string, index?: number) => void;
}

export class SandboxOutputs extends React.PureComponent<ComponentProps & StateProps & DispatchProps> {
  private childWindow: Window;

  render(): JSX.Element {
    // Using min-width to set the width of the iFrame, works around an issue in iOS that can prevent the iFrame from sizing correctly.
    return (
      <IframeResizer
        checkOrigin={false}
        loading="lazy"
        heightCalculationMethod="taggedElement"
        onLoad={(event) => this.handleFrameLoad(event)}
        src="./cellOutputViewer.html"
        style={{ height: "1px", width: "1px", minWidth: "100%", border: "none" }}
        sandbox="allow-downloads allow-popups allow-forms allow-pointer-lock allow-scripts allow-popups-to-escape-sandbox"
      />
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

  componentDidUpdate(): void {
    this.sendPropsToFrame();
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
    };
  };
  return mapDispatchToProps;
};

export default connect<StateProps, DispatchProps, ComponentProps, AppState>(
  makeMapStateToProps,
  makeMapDispatchToProps
)(SandboxOutputs);
