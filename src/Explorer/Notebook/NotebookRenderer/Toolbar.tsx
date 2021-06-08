import { ContextualMenuItemType, DirectionalHint, IconButton, IContextualMenuItem } from "@fluentui/react";
import { CellId, CellType, ImmutableCodeCell } from "@nteract/commutable";
import { actions, AppState, DocumentRecordProps } from "@nteract/core";
import * as selectors from "@nteract/selectors";
import { CellToolbarContext } from "@nteract/stateful-components";
import { ContentRef } from "@nteract/types";
import { RecordOf } from "immutable";
import * as React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import { Action, ActionModifiers } from "../../../Shared/Telemetry/TelemetryConstants";
import * as cdbActions from "../NotebookComponent/actions";
import { SnapshotRequest } from "../NotebookComponent/types";
import { NotebookUtil } from "../NotebookUtil";

export interface ComponentProps {
  contentRef: ContentRef;
  id: CellId;
}

interface DispatchProps {
  executeCell: () => void;
  insertCodeCellAbove: () => void;
  insertCodeCellBelow: () => void;
  insertTextCellAbove: () => void;
  insertTextCellBelow: () => void;
  moveCell: (destinationId: CellId, above: boolean) => void;
  clearOutputs: () => void;
  deleteCell: () => void;
  traceNotebookTelemetry: (action: Action, actionModifier?: string, data?: any) => void;
  takeNotebookSnapshot: (payload: SnapshotRequest) => void;
}

interface StateProps {
  cellType: CellType;
  cellIdAbove: CellId;
  cellIdBelow: CellId;
  hasCodeOutput: boolean;
}

class BaseToolbar extends React.PureComponent<ComponentProps & DispatchProps & StateProps> {
  static contextType = CellToolbarContext;

  render(): JSX.Element {
    let items: IContextualMenuItem[] = [];

    if (this.props.cellType === "code") {
      items = items.concat([
        {
          key: "Run",
          text: "Run",
          onClick: () => {
            this.props.executeCell();
            this.props.traceNotebookTelemetry(Action.NotebooksExecuteCellFromMenu, ActionModifiers.Mark);
          },
        },
        {
          key: "Clear Outputs",
          text: "Clear Outputs",
          onClick: () => {
            this.props.clearOutputs();
            this.props.traceNotebookTelemetry(Action.NotebooksClearOutputsFromMenu, ActionModifiers.Mark);
          },
        },
      ]);

      if (this.props.hasCodeOutput) {
        items.push({
          key: "Export output to image",
          text: "Export output to image",
          onClick: () => {
            this.props.takeNotebookSnapshot({
              requestId: new Date().getTime().toString(),
              aspectRatio: undefined,
              type: "celloutput",
              cellId: this.props.id,
              notebookContentRef: this.props.contentRef,
              downloadFilename: `celloutput-${this.props.contentRef}_${this.props.id}.png`,
            });
          },
        });
      }

      items.push({
        key: "Divider",
        itemType: ContextualMenuItemType.Divider,
      });
    }

    items = items.concat([
      {
        key: "Divider2",
        itemType: ContextualMenuItemType.Divider,
      },
      {
        key: "Insert Code Cell Above",
        text: "Insert Code Cell Above",
        onClick: () => {
          this.props.insertCodeCellAbove();
          this.props.traceNotebookTelemetry(Action.NotebooksInsertCodeCellAboveFromMenu, ActionModifiers.Mark);
        },
      },
      {
        key: "Insert Code Cell Below",
        text: "Insert Code Cell Below",
        onClick: () => {
          this.props.insertCodeCellBelow();
          this.props.traceNotebookTelemetry(Action.NotebooksInsertCodeCellBelowFromMenu, ActionModifiers.Mark);
        },
      },
      {
        key: "Insert Text Cell Above",
        text: "Insert Text Cell Above",
        onClick: () => {
          this.props.insertTextCellAbove();
          this.props.traceNotebookTelemetry(Action.NotebooksInsertTextCellAboveFromMenu, ActionModifiers.Mark);
        },
      },
      {
        key: "Insert Text Cell Below",
        text: "Insert Text Cell Below",
        onClick: () => {
          this.props.insertTextCellBelow();
          this.props.traceNotebookTelemetry(Action.NotebooksInsertTextCellBelowFromMenu, ActionModifiers.Mark);
        },
      },
      {
        key: "Divider3",
        itemType: ContextualMenuItemType.Divider,
      },
    ]);

    const moveItems: IContextualMenuItem[] = [];
    if (this.props.cellIdAbove !== undefined) {
      moveItems.push({
        key: "Move Cell Up",
        text: "Move Cell Up",
        onClick: () => {
          this.props.moveCell(this.props.cellIdAbove, true);
          this.props.traceNotebookTelemetry(Action.NotebooksMoveCellUpFromMenu, ActionModifiers.Mark);
        },
      });
    }

    if (this.props.cellIdBelow !== undefined) {
      moveItems.push({
        key: "Move Cell Down",
        text: "Move Cell Down",
        onClick: () => {
          this.props.moveCell(this.props.cellIdBelow, false);
          this.props.traceNotebookTelemetry(Action.NotebooksMoveCellDownFromMenu, ActionModifiers.Mark);
        },
      });
    }

    if (moveItems.length > 0) {
      moveItems.push({
        key: "Divider4",
        itemType: ContextualMenuItemType.Divider,
      });
      items = items.concat(moveItems);
    }

    items.push({
      key: "Delete Cell",
      text: "Delete Cell",
      onClick: () => {
        this.props.deleteCell();
        this.props.traceNotebookTelemetry(Action.DeleteCellFromMenu, ActionModifiers.Mark);
      },
    });

    const menuItemLabel = "More";
    return (
      <IconButton
        name="More"
        className="CellContextMenuButton"
        ariaLabel={menuItemLabel}
        menuIconProps={{
          iconName: menuItemLabel,
          styles: { root: { fontSize: "18px", fontWeight: "bold" } },
        }}
        menuProps={{
          isBeakVisible: false,
          directionalHint: DirectionalHint.bottomRightEdge,
          items,
        }}
      />
    );
  }
}

const mapDispatchToProps = (
  dispatch: Dispatch,
  { id, contentRef }: { id: CellId; contentRef: ContentRef }
): DispatchProps => ({
  executeCell: () => dispatch(actions.executeCell({ id, contentRef })),
  insertCodeCellAbove: () => dispatch(actions.createCellAbove({ id, contentRef, cellType: "code" })),
  insertCodeCellBelow: () => dispatch(actions.createCellBelow({ id, contentRef, cellType: "code" })),
  insertTextCellAbove: () => dispatch(actions.createCellAbove({ id, contentRef, cellType: "markdown" })),
  insertTextCellBelow: () => dispatch(actions.createCellBelow({ id, contentRef, cellType: "markdown" })),
  moveCell: (destinationId: CellId, above: boolean) =>
    dispatch(actions.moveCell({ id, contentRef, destinationId, above })),
  clearOutputs: () => dispatch(actions.clearOutputs({ id, contentRef })),
  deleteCell: () => dispatch(actions.deleteCell({ id, contentRef })),
  traceNotebookTelemetry: (action: Action, actionModifier?: string, data?: any) =>
    dispatch(cdbActions.traceNotebookTelemetry({ action, actionModifier, data })),
  takeNotebookSnapshot: (request: SnapshotRequest) => dispatch(cdbActions.takeNotebookSnapshot(request)),
});

const makeMapStateToProps = (state: AppState, ownProps: ComponentProps): ((state: AppState) => StateProps) => {
  const mapStateToProps = (state: AppState) => {
    const cell = selectors.cell.cellFromState(state, { id: ownProps.id, contentRef: ownProps.contentRef });
    const cellType = cell.cell_type;
    const model = selectors.model(state, { contentRef: ownProps.contentRef });
    const cellOrder = selectors.notebook.cellOrder(model as RecordOf<DocumentRecordProps>);
    const cellIndex = cellOrder.indexOf(ownProps.id);
    const cellIdAbove = cellIndex ? cellOrder.get(cellIndex - 1, undefined) : undefined;
    const cellIdBelow = cellIndex !== undefined ? cellOrder.get(cellIndex + 1, undefined) : undefined;

    return {
      cellType,
      cellIdAbove,
      cellIdBelow,
      hasCodeOutput: cellType === "code" && NotebookUtil.hasCodeCellOutput(cell as ImmutableCodeCell),
    };
  };
  return mapStateToProps;
};

export default connect(makeMapStateToProps, mapDispatchToProps)(BaseToolbar);
