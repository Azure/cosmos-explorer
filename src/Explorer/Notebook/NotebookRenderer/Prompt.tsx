import { actions, ContentRef, selectors } from "@nteract/core";
import React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import { Action, ActionModifiers } from "../../../Shared/Telemetry/TelemetryConstants";
import * as cdbActions from "../NotebookComponent/actions";
import { CdbAppState } from "../NotebookComponent/types";

export interface PassedPromptProps {
  id: string;
  contentRef: ContentRef;
  status?: string;
  executionCount?: number;
  isHovered?: boolean;
  runCell?: () => void;
  stopCell?: () => void;
}

interface ComponentProps {
  id: string;
  contentRef: ContentRef;
  isHovered?: boolean;
  children: (props: PassedPromptProps) => React.ReactNode;
}

interface StateProps {
  status?: string;
  executionCount?: number;
}

interface DispatchProps {
  executeCell: () => void;
  stopExecution: () => void;
}

type Props = StateProps & DispatchProps & ComponentProps;

export class PromptPure extends React.Component<Props> {
  render() {
    return (
      <div className="nteract-cell-prompt">
        {this.props.children({
          id: this.props.id,
          contentRef: this.props.contentRef,
          status: this.props.status,
          executionCount: this.props.executionCount,
          runCell: this.props.executeCell,
          stopCell: this.props.stopExecution,
          isHovered: this.props.isHovered,
        })}
      </div>
    );
  }
}

const makeMapStateToProps = (_state: CdbAppState, ownProps: ComponentProps): ((state: CdbAppState) => StateProps) => {
  const mapStateToProps = (state: CdbAppState) => {
    const { contentRef, id } = ownProps;
    const model = selectors.model(state, { contentRef });

    let status;
    let executionCount;

    if (model && model.type === "notebook") {
      status = model.transient.getIn(["cellMap", id, "status"]);
      const cell = selectors.notebook.cellById(model, { id });
      if (cell) {
        executionCount = cell.get("execution_count", undefined);
      }
    }

    const isHovered = state.cdb.hoveredCellId === id;

    return {
      status,
      executionCount,
      isHovered,
    };
  };
  return mapStateToProps;
};

const mapDispatchToProps = (
  dispatch: Dispatch,
  { id, contentRef }: { id: string; contentRef: ContentRef }
): DispatchProps => ({
  executeCell: () => {
    dispatch(actions.executeCell({ id, contentRef }));
    dispatch(
      cdbActions.traceNotebookTelemetry({
        action: Action.ExecuteCellPromptBtn,
        actionModifier: ActionModifiers.Mark,
      })
    );
  },
  stopExecution: () => dispatch(actions.interruptKernel({})),
});

export default connect(makeMapStateToProps, mapDispatchToProps)(PromptPure);
