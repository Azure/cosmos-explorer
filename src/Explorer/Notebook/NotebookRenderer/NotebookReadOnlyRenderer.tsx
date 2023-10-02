import { actions, ContentRef } from "@nteract/core";
import { Cells, CodeCell, RawCell } from "@nteract/stateful-components";
import CodeMirrorEditor from "@nteract/stateful-components/lib/inputs/connected-editors/codemirror";
import { PassedEditorProps } from "@nteract/stateful-components/lib/inputs/editor";
import Prompt, { PassedPromptProps } from "@nteract/stateful-components/lib/inputs/prompt";
import * as React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import { userContext } from "../../../UserContext";
import loadTransform from "../NotebookComponent/loadTransform";
import { AzureTheme } from "./AzureTheme";
import "./base.css";
import "./default.css";
import MarkdownCell from "./markdown-cell";
import "./NotebookReadOnlyRenderer.less";
import SandboxOutputs from "./outputs/SandboxOutputs";

export interface NotebookRendererProps {
  contentRef: ContentRef;
  hideInputs?: boolean;
  hidePrompts?: boolean;
  addTransform: (component: React.ComponentType & { MIMETYPE: string }) => void;
}

/**
 * This is the class that uses nteract to render a read-only notebook.
 */
class NotebookReadOnlyRenderer extends React.Component<NotebookRendererProps> {
  componentDidMount() {
    if (!userContext.features.sandboxNotebookOutputs) {
      loadTransform(this.props as NotebookRendererProps);
    }
  }

  private renderPrompt(id: string, contentRef: string): JSX.Element {
    if (this.props.hidePrompts) {
      return <></>;
    }

    return (
      <Prompt id={id} contentRef={contentRef}>
        {(props: PassedPromptProps) => {
          if (props.status === "busy") {
            return <React.Fragment>{"[*]"}</React.Fragment>;
          }
          if (props.status === "queued") {
            return <React.Fragment>{"[…]"}</React.Fragment>;
          }
          if (typeof props.executionCount === "number") {
            return <React.Fragment>{`[${props.executionCount}]`}</React.Fragment>;
          }
          return <React.Fragment>{"[ ]"}</React.Fragment>;
        }}
      </Prompt>
    );
  }

  render(): JSX.Element {
    return (
      <div className="NotebookReadOnlyRender">
        <Cells contentRef={this.props.contentRef}>
          {{
            code: ({ id, contentRef }: { id: string; contentRef: ContentRef }) => (
              <CodeCell id={id} contentRef={contentRef}>
                {{
                  prompt: (props: { id: string; contentRef: string }) => this.renderPrompt(props.id, props.contentRef),
                  outputs: userContext.features.sandboxNotebookOutputs
                    ? () => <SandboxOutputs id={id} contentRef={contentRef} />
                    : undefined,
                  editor: {
                    codemirror: (props: PassedEditorProps) =>
                      this.props.hideInputs ? <></> : <CodeMirrorEditor {...props} editorType="codemirror" />,
                  },
                }}
              </CodeCell>
            ),
            markdown: ({ id, contentRef }: { id: string; contentRef: ContentRef }) => (
              <MarkdownCell id={id} contentRef={contentRef} cell_type="markdown">
                {{
                  editor: {},
                }}
              </MarkdownCell>
            ),
            raw: ({ id, contentRef }: { id: string; contentRef: ContentRef }) => (
              <RawCell id={id} contentRef={contentRef} cell_type="raw">
                {{
                  editor: {
                    codemirror: (props: PassedEditorProps) =>
                      this.props.hideInputs ? <></> : <CodeMirrorEditor {...props} editorType="codemirror" />,
                  },
                }}
              </RawCell>
            ),
          }}
        </Cells>
        <AzureTheme />
      </div>
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const makeMapDispatchToProps = (initialDispatch: Dispatch, initialProps: NotebookRendererProps) => {
  const mapDispatchToProps = (dispatch: Dispatch) => {
    return {
      addTransform: (transform: React.ComponentType & { MIMETYPE: string }) => {
        return dispatch(
          actions.addTransform({
            mediaType: transform.MIMETYPE,
            component: transform,
          }),
        );
      },
    };
  };
  return mapDispatchToProps;
};

export default connect(undefined, makeMapDispatchToProps)(NotebookReadOnlyRenderer);
