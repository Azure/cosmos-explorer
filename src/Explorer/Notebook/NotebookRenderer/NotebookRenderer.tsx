import { CellId } from "@nteract/commutable";
import { CellType } from "@nteract/commutable/src";
import { actions, ContentRef } from "@nteract/core";
import { KernelOutputError, StreamText } from "@nteract/outputs";
import { Cells, CodeCell, RawCell } from "@nteract/stateful-components";
import MonacoEditor from "@nteract/stateful-components/lib/inputs/connected-editors/monacoEditor";
import { PassedEditorProps } from "@nteract/stateful-components/lib/inputs/editor";
import TransformMedia from "@nteract/stateful-components/lib/outputs/transform-media";
import * as React from "react";
import { DndProvider } from "react-dnd";
import HTML5Backend from "react-dnd-html5-backend";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import { userContext } from "../../../UserContext";
import * as cdbActions from "../NotebookComponent/actions";
import loadTransform from "../NotebookComponent/loadTransform";
import { AzureTheme } from "./AzureTheme";
import "./base.css";
import CellCreator from "./decorators/CellCreator";
import CellLabeler from "./decorators/CellLabeler";
import HoverableCell from "./decorators/HoverableCell";
import KeyboardShortcuts from "./decorators/kbd-shortcuts";
import "./default.css";
import MarkdownCell from "./markdown-cell";
import "./NotebookRenderer.less";
import SandboxOutputs from "./outputs/SandboxOutputs";
import Prompt from "./Prompt";
import { promptContent } from "./PromptContent";
import StatusBar from "./StatusBar";
import CellToolbar from "./Toolbar";

export interface NotebookRendererBaseProps {
  contentRef: any;
}

interface NotebookRendererDispatchProps {
  updateNotebookParentDomElt: (contentRef: ContentRef, parentElt: HTMLElement) => void;
}

type NotebookRendererProps = NotebookRendererBaseProps & NotebookRendererDispatchProps;

const decorate = (id: string, contentRef: ContentRef, cell_type: CellType, children: React.ReactNode) => {
  const Cell = () => (
    // TODO Draggable and HijackScroll not working anymore. Fix or remove when reworking MarkdownCell.
    // <DraggableCell id={id} contentRef={contentRef}>
    //   <HijackScroll id={id} contentRef={contentRef}>
    <CellCreator id={id} contentRef={contentRef}>
      <CellLabeler id={id} contentRef={contentRef}>
        <HoverableCell id={id} contentRef={contentRef}>
          {children}
        </HoverableCell>
      </CellLabeler>
    </CellCreator>
    //   </HijackScroll>
    // </DraggableCell>
  );

  Cell.defaultProps = { cell_type };
  return <Cell />;
};

class BaseNotebookRenderer extends React.Component<NotebookRendererProps> {
  private notebookRendererRef = React.createRef<HTMLDivElement>();

  constructor(props: NotebookRendererProps) {
    super(props);

    this.state = {
      hoveredCellId: undefined,
    };
  }

  componentDidMount() {
    loadTransform(this.props as any);
    this.props.updateNotebookParentDomElt(this.props.contentRef, this.notebookRendererRef.current);
  }

  componentDidUpdate() {
    this.props.updateNotebookParentDomElt(this.props.contentRef, this.notebookRendererRef.current);
  }

  componentWillUnmount() {
    this.props.updateNotebookParentDomElt(this.props.contentRef, undefined);
  }

  render(): JSX.Element {
    return (
      <>
        <div className="NotebookRendererContainer">
          <div className="NotebookRenderer" ref={this.notebookRendererRef}>
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
                              monaco: (props: PassedEditorProps) => <MonacoEditor {...props} editorType={"monaco"} />,
                            },
                            prompt: ({ id, contentRef }: { id: CellId; contentRef: ContentRef }) => (
                              <Prompt id={id} contentRef={contentRef} isHovered={false}>
                                {promptContent}
                              </Prompt>
                            ),
                            toolbar: () => <CellToolbar id={id} contentRef={contentRef} />,
                            outputs: userContext.features.sandboxNotebookOutputs
                              ? (props: any) => (
                                  <SandboxOutputs id={id} contentRef={contentRef}>
                                    <TransformMedia output_type={"display_data"} id={id} contentRef={contentRef} />
                                    <TransformMedia output_type={"execute_result"} id={id} contentRef={contentRef} />
                                    <KernelOutputError />
                                    <StreamText />
                                  </SandboxOutputs>
                                )
                              : undefined,
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
                            editor: {
                              monaco: (props: PassedEditorProps) => <MonacoEditor {...props} editorType={"monaco"} />,
                            },
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
                            editor: {
                              monaco: (props: PassedEditorProps) => <MonacoEditor {...props} editorType={"monaco"} />,
                            },
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

const makeMapDispatchToProps = (initialDispatch: Dispatch, initialProps: NotebookRendererBaseProps) => {
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
      updateNotebookParentDomElt: (contentRef: ContentRef, parentElt: HTMLElement) => {
        return dispatch(
          cdbActions.UpdateNotebookParentDomElt({
            contentRef,
            parentElt,
          })
        );
      },
    };
  };
  return mapDispatchToProps;
};

export default connect(null, makeMapDispatchToProps)(BaseNotebookRenderer);
