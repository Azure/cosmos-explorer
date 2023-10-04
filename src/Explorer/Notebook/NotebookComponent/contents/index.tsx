// Vendor modules
import { CellType, ImmutableNotebook } from "@nteract/commutable";
import { HeaderDataProps } from "@nteract/connected-components/lib/header-editor";
import {
  AppState,
  ContentRef,
  HostRecord,
  selectors,
  actions,
  DirectoryContentRecordProps,
  DummyContentRecordProps,
  FileContentRecordProps,
  NotebookContentRecordProps,
} from "@nteract/core";
import { RecordOf } from "immutable";
import * as React from "react";
import { HotKeys, KeyMap } from "react-hotkeys";
import { connect } from "react-redux";
import { Dispatch } from "redux";

// Local modules
import { default as File } from "./file";

interface IContentsBaseProps {
  contentRef: ContentRef;
  error?: object | null;
}

interface IStateToProps {
  headerData?: HeaderDataProps;
}

interface IDispatchFromProps {
  handlers?: any;
  onHeaderEditorChange?: (props: HeaderDataProps) => void;
}

type ContentsProps = IContentsBaseProps & IStateToProps & IDispatchFromProps;

class Contents extends React.PureComponent<ContentsProps> {
  private keyMap: KeyMap = {
    CHANGE_CELL_TYPE: ["ctrl+shift+y", "ctrl+shift+m", "meta+shift+y", "meta+shift+m"],
    COPY_CELL: ["ctrl+shift+c", "meta+shift+c"],
    CREATE_CELL_ABOVE: ["ctrl+shift+a", "meta+shift+a"],
    CREATE_CELL_BELOW: ["ctrl+shift+b", "meta+shift+b"],
    CUT_CELL: ["ctrl+shift+x", "meta+shift+x"],
    DELETE_CELL: ["ctrl+shift+d", "meta+shift+d"],
    EXECUTE_ALL_CELLS: ["alt+r a"],
    INTERRUPT_KERNEL: ["alt+r i"],
    KILL_KERNEL: ["alt+r k"],
    OPEN: ["ctrl+o", "meta+o"],
    PASTE_CELL: ["ctrl+shift+v"],
    RESTART_KERNEL: ["alt+r r", "alt+r c", "alt+r a"],
    SAVE: ["ctrl+s", "ctrl+shift+s", "meta+s", "meta+shift+s"],
  };

  render(): JSX.Element {
    const { contentRef, handlers } = this.props;

    if (!contentRef) {
      return <></>;
    }

    return (
      <React.Fragment>
        <HotKeys keyMap={this.keyMap} handlers={handlers} className="hotKeys">
          <File contentRef={contentRef} />
        </HotKeys>
      </React.Fragment>
    );
  }
}

const makeMapStateToProps: any = (initialState: AppState, initialProps: { contentRef: ContentRef }) => {
  const host: HostRecord = initialState.app.host;

  if (host.type !== "jupyter") {
    throw new Error("this component only works with jupyter apps");
  }

  const mapStateToProps = (state: AppState): Partial<ContentsProps> => {
    const contentRef: ContentRef = initialProps.contentRef;

    if (!contentRef) {
      throw new Error("cant display without a contentRef");
    }

    const content:
      | RecordOf<NotebookContentRecordProps>
      | RecordOf<DummyContentRecordProps>
      | RecordOf<FileContentRecordProps>
      | RecordOf<DirectoryContentRecordProps>
      | undefined = selectors.content(state, { contentRef });

    if (!content) {
      return {
        contentRef: undefined,
        error: undefined,
        headerData: undefined,
      };
    }

    let headerData: HeaderDataProps = {
      authors: [],
      description: "",
      tags: [],
      title: "",
    };

    // If a notebook, we need to read in the headerData if available
    if (content.type === "notebook") {
      const notebook: ImmutableNotebook = content.model.get("notebook");
      const metadata: any = notebook.metadata.toJS();
      const { authors = [], description = "", tags = [], title = "" } = metadata;

      // Updates
      headerData = Object.assign({}, headerData, {
        authors,
        description,
        tags,
        title,
      });
    }

    return {
      contentRef,
      error: content.error,
      headerData,
    };
  };

  return mapStateToProps;
};

const mapDispatchToProps = (dispatch: Dispatch, ownProps: ContentsProps): object => {
  const { contentRef } = ownProps;

  return {
    onHeaderEditorChange: (props: HeaderDataProps) => {
      return dispatch(
        actions.overwriteMetadataFields({
          ...props,
          contentRef: ownProps.contentRef,
        }),
      );
    },
    // `HotKeys` handlers object
    // see: https://github.com/greena13/react-hotkeys#defining-handlers
    handlers: {
      CHANGE_CELL_TYPE: (event: KeyboardEvent) => {
        const type: CellType = event.key === "Y" ? "code" : "markdown";
        return dispatch(actions.changeCellType({ to: type, contentRef }));
      },
      COPY_CELL: () => dispatch(actions.copyCell({ contentRef })),
      CREATE_CELL_ABOVE: () => dispatch(actions.createCellAbove({ cellType: "code", contentRef })),
      CREATE_CELL_BELOW: () => dispatch(actions.createCellBelow({ cellType: "code", contentRef })),
      CUT_CELL: () => dispatch(actions.cutCell({ contentRef })),
      DELETE_CELL: () => dispatch(actions.deleteCell({ contentRef })),
      EXECUTE_ALL_CELLS: () => dispatch(actions.executeAllCells({ contentRef })),
      INTERRUPT_KERNEL: () => dispatch(actions.interruptKernel({})),
      KILL_KERNEL: () => dispatch(actions.killKernel({ restarting: false })),
      PASTE_CELL: () => dispatch(actions.pasteCell({ contentRef })),
      RESTART_KERNEL: (event: KeyboardEvent) => {
        const outputHandling: "None" | "Clear All" | "Run All" =
          event.key === "r" ? "None" : event.key === "a" ? "Run All" : "Clear All";
        return dispatch(actions.restartKernel({ outputHandling, contentRef }));
      },
      SAVE: () => dispatch(actions.save({ contentRef })),
    },
  };
};

export default connect(makeMapStateToProps, mapDispatchToProps)(Contents);
