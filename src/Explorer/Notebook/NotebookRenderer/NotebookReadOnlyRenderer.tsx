import * as React from "react";
import "./base.css";
import "./default.css";

import { CodeCell, RawCell, Cells, MarkdownCell } from "@nteract/stateful-components";
import Prompt, { PassedPromptProps } from "./OriginalPrompt";
// import Prompt, { PassedPromptProps } from "@nteract/stateful-components/src/inputs/prompt";
import { AzureTheme } from "./AzureTheme";

import { connect } from "react-redux";
import { Dispatch } from "redux";
import { actions, ContentRef } from "@nteract/core";
import loadTransform from "../NotebookComponent/loadTransform";
import CodeMirrorEditor from "@nteract/stateful-components/lib/inputs/connected-editors/codemirror";
import "./NotebookReadOnlyRenderer.less";

export interface NotebookRendererProps {
  contentRef: any;
  hideInputs?: boolean;
  hidePrompts?: boolean;
}

interface PassedEditorProps {
  id: string;
  contentRef: ContentRef;
  editorFocused: boolean;
  value: string;
  channels: any;
  kernelStatus: string;
  theme: string;
  onChange: (text: string) => void;
  onFocusChange: (focused: boolean) => void;
  className: string;
}

/**
 * This is the class that uses nteract to render a read-only notebook.
 */
class NotebookReadOnlyRenderer extends React.Component<NotebookRendererProps> {
  componentDidMount() {
    loadTransform(this.props as any);
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
            code: ({ id, contentRef }: { id: any; contentRef: ContentRef }) => (
              <CodeCell id={id} contentRef={contentRef}>
                {{
                  prompt: (props: { id: string; contentRef: string }) => this.renderPrompt(props.id, props.contentRef),
                  editor: {
                    codemirror: (props: PassedEditorProps) =>
                      this.props.hideInputs ? <></> : <CodeMirrorEditor {...props} readOnly={"nocursor"} />
                  }
                }}
              </CodeCell>
            ),
            markdown: ({ id, contentRef }: { id: any; contentRef: ContentRef }) => (
              <MarkdownCell id={id} contentRef={contentRef} cell_type="markdown">
                {{
                  editor: {}
                }}
              </MarkdownCell>
            ),
            raw: ({ id, contentRef }: { id: any; contentRef: ContentRef }) => (
              <RawCell id={id} contentRef={contentRef} cell_type="raw">
                {{
                  editor: {
                    codemirror: (props: PassedEditorProps) =>
                      this.props.hideInputs ? <></> : <CodeMirrorEditor {...props} readOnly={"nocursor"} />
                  }
                }}
              </RawCell>
            )
          }}
        </Cells>
        <AzureTheme />
      </div>
    );
  }
}

const makeMapDispatchToProps = (initialDispatch: Dispatch, initialProps: NotebookRendererProps) => {
  const mapDispatchToProps = (dispatch: Dispatch) => {
    return {
      addTransform: (transform: React.ComponentType & { MIMETYPE: string }) => {
        return dispatch(
          actions.addTransform({
            mediaType: transform.MIMETYPE,
            component: transform
          })
        );
      }
    };
  };
  return mapDispatchToProps;
};

export default connect(null, makeMapDispatchToProps)(NotebookReadOnlyRenderer);
