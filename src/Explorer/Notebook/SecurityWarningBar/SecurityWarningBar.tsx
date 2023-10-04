import { MessageBar, MessageBarButton, MessageBarType } from "@fluentui/react";
import { actions, AppState } from "@nteract/core";
import React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import { NotebookUtil } from "../NotebookUtil";

export interface SecurityWarningBarPureProps {
  contentRef: string;
}

interface SecurityWarningBarDispatchProps {
  markNotebookAsTrusted: (contentRef: string) => void;
  saveNotebook: (contentRef: string) => void;
}

type SecurityWarningBarProps = SecurityWarningBarPureProps & StateProps & SecurityWarningBarDispatchProps;

interface SecurityWarningBarState {
  isBarDismissed: boolean;
}

export class SecurityWarningBar extends React.Component<SecurityWarningBarProps, SecurityWarningBarState> {
  constructor(props: SecurityWarningBarProps) {
    super(props);

    this.state = {
      isBarDismissed: false,
    };
  }

  render(): JSX.Element {
    return this.props.isNotebookUntrusted && !this.state.isBarDismissed ? (
      <MessageBar
        messageBarType={MessageBarType.warning}
        isMultiline={false}
        onDismiss={() => this.setState({ isBarDismissed: true })}
        dismissButtonAriaLabel="Close"
        actions={
          <MessageBarButton
            onClick={() => {
              this.props.markNotebookAsTrusted(this.props.contentRef);
              this.props.saveNotebook(this.props.contentRef);
            }}
          >
            Trust Notebook
          </MessageBarButton>
        }
      >
        {" "}
        This notebook was downloaded from the public gallery. Running code cells from a notebook authored by someone
        else may involve security risks.
      </MessageBar>
    ) : (
      <></>
    );
  }
}

interface StateProps {
  isNotebookUntrusted: boolean;
}

interface InitialProps {
  contentRef: string;
}

// Redux
const makeMapStateToProps = (state: AppState, initialProps: InitialProps) => {
  const mapStateToProps = (state: AppState): StateProps => ({
    isNotebookUntrusted: NotebookUtil.isNotebookUntrusted(state, initialProps.contentRef),
  });
  return mapStateToProps;
};

const makeMapDispatchToProps = () => {
  const mapDispatchToProps = (dispatch: Dispatch): SecurityWarningBarDispatchProps => {
    return {
      markNotebookAsTrusted: (contentRef: string) => {
        return dispatch(
          actions.deleteMetadataField({
            contentRef,
            field: "untrusted",
          }),
        );
      },
      saveNotebook: (contentRef: string) => dispatch(actions.save({ contentRef })),
    };
  };
  return mapDispatchToProps;
};

export default connect(makeMapStateToProps, makeMapDispatchToProps)(SecurityWarningBar);
