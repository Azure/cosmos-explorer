import { CellId } from "@nteract/commutable";
import { actions, AppState, ContentRef, selectors } from "@nteract/core";
import Immutable from "immutable";
import React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";

interface ComponentProps {
  contentRef: ContentRef;
  children: React.ReactNode;
}

interface StateProps {
  cellMap: Immutable.Map<string, any>;
  cellOrder: Immutable.List<string>;
  focusedCell?: string | null;
}

interface DispatchProps {
  executeFocusedCell: (payload: { contentRef: ContentRef }) => void;
  focusNextCell: (payload: { id?: CellId; createCellIfUndefined: boolean; contentRef: ContentRef }) => void;
  focusNextCellEditor: (payload: { id?: CellId; contentRef: ContentRef }) => void;
}

type Props = ComponentProps & StateProps & DispatchProps;

export class KeyboardShortcuts extends React.Component<Props> {
  constructor(props: Props) {
    super(props);
    this.keyDown = this.keyDown.bind(this);
  }

  shouldComponentUpdate(nextProps: Props) {
    const newContentRef = this.props.contentRef !== nextProps.contentRef;
    const newFocusedCell = this.props.focusedCell !== nextProps.focusedCell;
    const newCellOrder = this.props.cellOrder && this.props.cellOrder.size !== nextProps.cellOrder.size;
    return newContentRef || newFocusedCell || newCellOrder;
  }

  componentDidMount(): void {
    document.addEventListener("keydown", this.keyDown);
  }

  componentWillUnmount(): void {
    document.removeEventListener("keydown", this.keyDown);
  }

  keyDown(e: KeyboardEvent): void {
    // If enter is not pressed, do nothing
    if (e.key !== "Enter") {
      return;
    }

    const { executeFocusedCell, focusNextCell, focusNextCellEditor, contentRef, cellOrder, focusedCell, cellMap } =
      this.props;

    let ctrlKeyPressed = e.ctrlKey;
    // Allow cmd + enter (macOS) to operate like ctrl + enter
    if (process.platform === "darwin") {
      ctrlKeyPressed = (e.metaKey || e.ctrlKey) && !(e.metaKey && e.ctrlKey);
    }

    const shiftXORctrl = (e.shiftKey || ctrlKeyPressed) && !(e.shiftKey && ctrlKeyPressed);
    if (!shiftXORctrl) {
      return;
    }

    e.preventDefault();

    if (focusedCell) {
      // NOTE: Order matters here because we need it to execute _before_ we
      // focus the next cell
      executeFocusedCell({ contentRef });

      if (e.shiftKey) {
        /** Get the next cell and check if it is a markdown cell. */
        const focusedCellIndex = cellOrder.indexOf(focusedCell);
        const nextCellId = cellOrder.get(focusedCellIndex + 1);
        const nextCell = nextCellId ? cellMap.get(nextCellId) : undefined;

        /** Always focus the next cell. */
        focusNextCell({
          id: undefined,
          createCellIfUndefined: true,
          contentRef,
        });

        /** Only focus the next editor if it is a code cell or a cell
         * created at the bottom of the notebook. */
        if (nextCell === undefined || (nextCell && nextCell.get("cell_type") === "code")) {
          focusNextCellEditor({ id: focusedCell, contentRef });
        }
      }
    }
  }

  render() {
    return <React.Fragment>{this.props.children}</React.Fragment>;
  }
}

export const makeMapStateToProps = (_state: AppState, ownProps: ComponentProps) => {
  const { contentRef } = ownProps;
  const mapStateToProps = (state: AppState) => {
    const model = selectors.model(state, { contentRef });

    let cellOrder = Immutable.List();
    let cellMap = Immutable.Map<string, any>();
    let focusedCell;

    if (model && model.type === "notebook") {
      cellOrder = model.notebook.cellOrder;
      cellMap = selectors.notebook.cellMap(model);
      focusedCell = selectors.notebook.cellFocused(model);
    }

    return {
      cellOrder,
      cellMap,
      focusedCell,
    };
  };
  return mapStateToProps;
};

export const mapDispatchToProps = (dispatch: Dispatch) => ({
  executeFocusedCell: (payload: { contentRef: ContentRef }) => dispatch(actions.executeFocusedCell(payload)),
  focusNextCell: (payload: { id?: CellId; createCellIfUndefined: boolean; contentRef: ContentRef }) =>
    dispatch(actions.focusNextCell(payload)),
  focusNextCellEditor: (payload: { id?: CellId; contentRef: ContentRef }) =>
    dispatch(actions.focusNextCellEditor(payload)),
});

export default connect(makeMapStateToProps, mapDispatchToProps)(KeyboardShortcuts);
