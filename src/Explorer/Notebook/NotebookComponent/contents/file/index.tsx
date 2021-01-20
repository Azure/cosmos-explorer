import { AppState, ContentRef, selectors } from "@nteract/core";
import * as React from "react";
import { connect } from "react-redux";
import styled from "styled-components";

import NotebookRenderer from "../../../NotebookRenderer/NotebookRenderer";
import * as TextFile from "./text-file";

const PaddedContainer = styled.div`
  padding-left: var(--nt-spacing-l, 10px);
  padding-top: var(--nt-spacing-m, 10px);
  padding-right: var(--nt-spacing-m, 10px);
`;

const JupyterExtensionContainer = styled.div`
  display: flex;
  flex-flow: column;
  align-items: stretch;
  height: 100%;
`;

const JupyterExtensionChoiceContainer = styled.div`
  flex: 1 1 auto;
  overflow: auto;
`;

interface FileProps {
  type: "notebook" | "file" | "dummy";
  contentRef: ContentRef;
  mimetype?: string | null;
}

export class File extends React.PureComponent<FileProps> {
  getChoice = () => {
    let choice = null;

    // notebooks don't report a mimetype so we'll use the content.type
    if (this.props.type === "notebook") {
      choice = <NotebookRenderer contentRef={this.props.contentRef} />;
    } else if (this.props.type === "dummy") {
      choice = null;
    } else if (this.props.mimetype == null || !TextFile.handles(this.props.mimetype)) {
      // This should not happen as we intercept mimetype upstream, but just in case
      choice = (
        <PaddedContainer>
          <pre>
            This file type cannot be rendered. Please download the file, in order to view it outside of Data Explorer.
          </pre>
        </PaddedContainer>
      );
    } else {
      choice = <TextFile.default contentRef={this.props.contentRef} />;
    }

    return choice;
  };

  render(): JSX.Element {
    const choice = this.getChoice();

    // Right now we only handle one kind of editor
    // If/when we support more modes, we would case them off here
    return (
      <React.Fragment>
        <JupyterExtensionContainer>
          <JupyterExtensionChoiceContainer>{choice}</JupyterExtensionChoiceContainer>
        </JupyterExtensionContainer>
      </React.Fragment>
    );
  }
}

interface InitialProps {
  contentRef: ContentRef;
}

// Since the contentRef stays unique for the duration of this file,
// we use the makeMapStateToProps pattern to optimize re-render
const makeMapStateToProps = (initialState: AppState, initialProps: InitialProps) => {
  const { contentRef } = initialProps;

  const mapStateToProps = (state: AppState) => {
    const content = selectors.content(state, initialProps);

    return {
      contentRef,
      mimetype: content.mimetype,
      type: content.type,
    };
  };

  return mapStateToProps;
};

export const ConnectedFile = connect(makeMapStateToProps)(File);

export default ConnectedFile;
