// This is the original read-only [] prompt
import React from "react";
import { connect } from "react-redux";

import { AppState, ContentRef, selectors } from "@nteract/core";

export interface PassedPromptProps {
  id: string;
  contentRef: ContentRef;
  status?: string;
  executionCount?: number;
}

interface ComponentProps {
  id: string;
  contentRef: ContentRef;
  children: (props: PassedPromptProps) => React.ReactNode;
}

interface StateProps {
  status?: string;
  executionCount?: number;
}

type Props = StateProps & ComponentProps;

export class Prompt extends React.Component<Props> {
  render() {
    return (
      <div className="nteract-cell-prompt">
        {this.props.children({
          id: this.props.id,
          contentRef: this.props.contentRef,
          status: this.props.status,
          executionCount: this.props.executionCount
        })}
      </div>
    );
  }
}

const makeMapStateToProps = (
  state: AppState,
  ownProps: ComponentProps
): ((state: AppState) => StateProps) => {
  const mapStateToProps = (state: AppState) => {
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

    return {
      status,
      executionCount
    };
  };
  return mapStateToProps;
};

export default connect<StateProps, void, ComponentProps, AppState>(
  makeMapStateToProps
)(Prompt);
