import { ContentRef } from "@nteract/types";
import * as React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";

import { IconButton } from "office-ui-fabric-react/lib/Button";
import {
  DirectionalHint,
  IContextualMenuItem,
  ContextualMenuItemType,
} from "office-ui-fabric-react/lib/ContextualMenu";
import { actions, AppState, DocumentRecordProps } from "@nteract/core";
import { CellToolbarContext } from "@nteract/stateful-components";
import { CellType, CellId } from "@nteract/commutable";
import * as selectors from "@nteract/selectors";
import { RecordOf } from "immutable";

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
}

interface StateProps {
  cellType: CellType;
  cellIdAbove: CellId;
  cellIdBelow: CellId;
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
          onClick: this.props.executeCell,
        },
        {
          key: "Clear Outputs",
          text: "Clear Outputs",
          onClick: this.props.clearOutputs,
        },
        {
          key: "Divider",
          itemType: ContextualMenuItemType.Divider,
        },
      ]);
    }

    items = items.concat([
      {
        key: "Divider",
        itemType: ContextualMenuItemType.Divider,
      },
      {
        key: "Insert Code Cell Above",
        text: "Insert Code Cell Above",
        onClick: this.props.insertCodeCellAbove,
      },
      {
        key: "Insert Code Cell Below",
        text: "Insert Code Cell Below",
        onClick: this.props.insertCodeCellBelow,
      },
      {
        key: "Insert Text Cell Above",
        text: "Insert Text Cell Above",
        onClick: this.props.insertTextCellAbove,
      },
      {
        key: "Insert Text Cell Below",
        text: "Insert Text Cell Below",
        onClick: this.props.insertTextCellBelow,
      },
      {
        key: "Divider",
        itemType: ContextualMenuItemType.Divider,
      },
    ]);

    const moveItems: IContextualMenuItem[] = [];
    if (this.props.cellIdAbove !== undefined) {
      moveItems.push({
        key: "Move Cell Up",
        text: "Move Cell Up",
        onClick: () => this.props.moveCell(this.props.cellIdAbove, true),
      });
    }

    if (this.props.cellIdBelow !== undefined) {
      moveItems.push({
        key: "Move Cell Down",
        text: "Move Cell Down",
        onClick: () => this.props.moveCell(this.props.cellIdBelow, false),
      });
    }

    if (moveItems.length > 0) {
      moveItems.push({
        key: "Divider",
        itemType: ContextualMenuItemType.Divider,
      });
      items = items.concat(moveItems);
    }

    items.push({
      key: "Delete Cell",
      text: "Delete Cell",
      onClick: this.props.deleteCell,
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
  insertCodeCellBelow: () => dispatch(actions.createCellBelow({ id, contentRef, cellType: "code", source: "" })),
  insertTextCellAbove: () => dispatch(actions.createCellAbove({ id, contentRef, cellType: "markdown" })),
  insertTextCellBelow: () => dispatch(actions.createCellBelow({ id, contentRef, cellType: "markdown", source: "" })),
  moveCell: (destinationId: CellId, above: boolean) =>
    dispatch(actions.moveCell({ id, contentRef, destinationId, above })),
  clearOutputs: () => dispatch(actions.clearOutputs({ id, contentRef })),
  deleteCell: () => dispatch(actions.deleteCell({ id, contentRef })),
});

const makeMapStateToProps = (state: AppState, ownProps: ComponentProps): ((state: AppState) => StateProps) => {
  const mapStateToProps = (state: AppState) => {
    const cellType = selectors.cell.cellFromState(state, { id: ownProps.id, contentRef: ownProps.contentRef })
      .cell_type;
    const model = selectors.model(state, { contentRef: ownProps.contentRef });
    const cellOrder = selectors.notebook.cellOrder(model as RecordOf<DocumentRecordProps>);
    const cellIndex = cellOrder.indexOf(ownProps.id);
    const cellIdAbove = cellIndex ? cellOrder.get(cellIndex - 1, undefined) : undefined;
    const cellIdBelow = cellIndex !== undefined ? cellOrder.get(cellIndex + 1, undefined) : undefined;

    return {
      cellType,
      cellIdAbove,
      cellIdBelow,
    };
  };
  return mapStateToProps;
};

export default connect(makeMapStateToProps, mapDispatchToProps)(BaseToolbar);
