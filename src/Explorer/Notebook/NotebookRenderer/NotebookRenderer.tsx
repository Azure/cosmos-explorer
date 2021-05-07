import { CellId } from "@nteract/commutable";
import { CellType } from "@nteract/commutable/src";
import { actions, ContentRef, selectors } from "@nteract/core";
import { Cells, CodeCell, RawCell } from "@nteract/stateful-components";
import MonacoEditor from "@nteract/stateful-components/lib/inputs/connected-editors/monacoEditor";
import { PassedEditorProps } from "@nteract/stateful-components/lib/inputs/editor";
import * as React from "react";
import { DndProvider } from "react-dnd";
import HTML5Backend from "react-dnd-html5-backend";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import { userContext } from "../../../UserContext";
import * as cdbActions from "../NotebookComponent/actions";
import loadTransform from "../NotebookComponent/loadTransform";
import { CdbAppState, SnapshotFragment, SnapshotRequest } from "../NotebookComponent/types";
import { NotebookUtil } from "../NotebookUtil";
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
  storeNotebookSnapshot: (imageSrc: string, requestId: string) => void;
  notebookSnapshotError: (error: string) => void;
}

interface StateProps {
  pendingSnapshotRequest: SnapshotRequest;
  cellOutputSnapshots: Map<string, SnapshotFragment>;
  notebookSnapshot: { imageSrc: string; requestId: string };
  nbCodeCells: number;
}

type NotebookRendererProps = NotebookRendererBaseProps & NotebookRendererDispatchProps & StateProps;

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

  componentDidMount() {
    if (!userContext.features.sandboxNotebookOutputs) {
      loadTransform(this.props as any);
    }
  }

  async componentDidUpdate(): Promise<void> {
    // Take a snapshot if there's a pending request and all the outputs are also saved
    if (
      this.props.pendingSnapshotRequest &&
      this.props.pendingSnapshotRequest.type === "notebook" &&
      this.props.pendingSnapshotRequest.notebookContentRef === this.props.contentRef &&
      (!this.props.notebookSnapshot ||
        this.props.pendingSnapshotRequest.requestId !== this.props.notebookSnapshot.requestId) &&
      this.props.cellOutputSnapshots.size === this.props.nbCodeCells
    ) {
      try {
        // Use Html2Canvas because it is much more reliable and fast than dom-to-file
        const result = await NotebookUtil.takeScreenshotHtml2Canvas(
          this.notebookRendererRef.current,
          this.props.pendingSnapshotRequest.aspectRatio,
          [...this.props.cellOutputSnapshots.values()],
          this.props.pendingSnapshotRequest.downloadFilename
        );
        this.props.storeNotebookSnapshot(result.imageSrc, this.props.pendingSnapshotRequest.requestId);
      } catch (error) {
        this.props.notebookSnapshotError(error.message);
      } finally {
        this.setState({ processedSnapshotRequest: undefined });
      }
    }
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
                              ? () => <SandboxOutputs id={id} contentRef={contentRef} />
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

export const makeMapStateToProps = (
  initialState: CdbAppState,
  ownProps: NotebookRendererProps
): ((state: CdbAppState) => StateProps) => {
  const mapStateToProps = (state: CdbAppState): StateProps => {
    const { contentRef } = ownProps;
    const model = selectors.model(state, { contentRef });

    let nbCodeCells;
    if (model && model.type === "notebook") {
      nbCodeCells = NotebookUtil.findCodeCellWithDisplay(model.notebook).length;
    }
    const { pendingSnapshotRequest, cellOutputSnapshots, notebookSnapshot } = state.cdb;
    return { pendingSnapshotRequest, cellOutputSnapshots, notebookSnapshot, nbCodeCells };
  };
  return mapStateToProps;
};

const makeMapDispatchToProps = (initialDispatch: Dispatch, initialProps: NotebookRendererBaseProps) => {
  const mapDispatchToProps = (dispatch: Dispatch) => {
    return {
      addTransform: (transform: React.ComponentType & { MIMETYPE: string }) =>
        dispatch(
          actions.addTransform({
            mediaType: transform.MIMETYPE,
            component: transform,
          })
        ),
      storeNotebookSnapshot: (imageSrc: string, requestId: string) =>
        dispatch(cdbActions.storeNotebookSnapshot({ imageSrc, requestId })),
      notebookSnapshotError: (error: string) => dispatch(cdbActions.notebookSnapshotError({ error })),
    };
  };
  return mapDispatchToProps;
};

export default connect(makeMapStateToProps, makeMapDispatchToProps)(BaseNotebookRenderer);
