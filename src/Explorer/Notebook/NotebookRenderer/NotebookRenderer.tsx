import * as React from "react";
import "./base.css";
import "./default.css";

import { RawCell, Cells, CodeCell, MarkdownCell } from "@nteract/stateful-components";
import CodeMirrorEditor from "@nteract/stateful-components/lib/inputs/connected-editors/codemirror";

import Prompt from "./Prompt";
import { promptContent } from "./PromptContent";

import { AzureTheme } from "./AzureTheme";
import { DndProvider } from "react-dnd";
import HTML5Backend from "react-dnd-html5-backend";

import { connect } from "react-redux";
import { Dispatch } from "redux";
import { actions, ContentRef } from "@nteract/core";
import { CellId } from "@nteract/commutable";
import loadTransform from "../NotebookComponent/loadTransform";
import DraggableCell from "./decorators/draggable";
import CellCreator from "./decorators/CellCreator";
import KeyboardShortcuts from "./decorators/kbd-shortcuts";

import CellToolbar from "./Toolbar";
import StatusBar from "./StatusBar";

import HijackScroll from "./decorators/hijack-scroll";
import { CellType } from "@nteract/commutable/src";

import "./NotebookRenderer.less";
import HoverableCell from "./decorators/HoverableCell";
import CellLabeler from "./decorators/CellLabeler";

export interface NotebookRendererProps {
  contentRef: any;
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

const decorate = (id: string, contentRef: ContentRef, cell_type: CellType, children: React.ReactNode) => {
  const Cell = () => (
    <DraggableCell id={id} contentRef={contentRef}>
      <HijackScroll id={id} contentRef={contentRef}>
        <CellCreator id={id} contentRef={contentRef}>
          <CellLabeler id={id} contentRef={contentRef}>
            <HoverableCell id={id} contentRef={contentRef}>
              {children}
            </HoverableCell>
          </CellLabeler>
        </CellCreator>
      </HijackScroll>
    </DraggableCell>
  );

  Cell.defaultProps = { cell_type };
  return <Cell />;
};

class BaseNotebookRenderer extends React.Component<NotebookRendererProps> {
  constructor(props: NotebookRendererProps) {
    super(props);

    this.state = {
      hoveredCellId: undefined,
    };
  }

  componentDidMount() {
    loadTransform(this.props as any);
  }

  render(): JSX.Element {
    return (
      <>
        <div className="NotebookRendererContainer">
          <div className="NotebookRenderer">
            <DndProvider backend={HTML5Backend}>
              <KeyboardShortcuts contentRef={this.props.contentRef}>
                <Cells contentRef={this.props.contentRef}>
                  {{
                    code: ({ id, contentRef }: { id: CellId; contentRef: ContentRef }) =>
                      decorate(
                        id,
                        contentRef,
                        "code",
                        <CodeCell id={id} contentRef={contentRef} cell_type="code">
                          {{
                            editor: {
                              codemirror: (props: PassedEditorProps) => (
                                <CodeMirrorEditor {...props} lineNumbers={true} />
                              ),
                            },
                            prompt: ({ id, contentRef }: { id: CellId; contentRef: ContentRef }) => (
                              <Prompt id={id} contentRef={contentRef} isHovered={false}>
                                {promptContent}
                              </Prompt>
                            ),
                            toolbar: () => <CellToolbar id={id} contentRef={contentRef} />,
                          }}
                        </CodeCell>
                      ),
                    markdown: ({ id, contentRef }: { id: any; contentRef: ContentRef }) =>
                      decorate(
                        id,
                        contentRef,
                        "markdown",
                        <MarkdownCell id={id} contentRef={contentRef} cell_type="markdown">
                          {{
                            toolbar: () => <CellToolbar id={id} contentRef={contentRef} />,
                          }}
                        </MarkdownCell>
                      ),

                    raw: ({ id, contentRef }: { id: any; contentRef: ContentRef }) =>
                      decorate(
                        id,
                        contentRef,
                        "raw",
                        <RawCell id={id} contentRef={contentRef} cell_type="raw">
                          {{
                            toolbar: () => <CellToolbar id={id} contentRef={contentRef} />,
                          }}
                        </RawCell>
                      ),
                  }}
                </Cells>
              </KeyboardShortcuts>
              <AzureTheme />
            </DndProvider>
          </div>
          <StatusBar contentRef={this.props.contentRef} />
        </div>
      </>
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
            component: transform,
          })
        );
      },
    };
  };
  return mapDispatchToProps;
};

export default connect(null, makeMapDispatchToProps)(BaseNotebookRenderer);
