import { actions, selectors, ContentRef, AppState } from "@nteract/core";
import { CellType } from "@nteract/commutable";
import * as React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";

import styled from "styled-components";
import AddCodeCellIcon from "../../../../../images/notebook/add-code-cell.svg";
import AddTextCellIcon from "../../../../../images/notebook/add-text-cell.svg";

interface ComponentProps {
  id: string;
  contentRef: ContentRef;
  children: React.ReactNode;
}

interface StateProps {
  isFirstCell: boolean;
}

interface DispatchProps {
  createCellAppend: (payload: { cellType: CellType; contentRef: ContentRef }) => void;
  createCellAbove: (payload: { cellType: CellType; id?: string; contentRef: ContentRef }) => void;
  createCellBelow: (payload: { cellType: CellType; id?: string; source: string; contentRef: ContentRef }) => void;
}

export const CellCreatorMenu = styled.div`
  display: none;
  pointer-events: all;
  position: relative;
  top: 0px;
  /**
   * Now that the cell-creator is added as a decorator we need
   * this x-index to ensure that it is always shown on the top
   * of other cells.
   */
  z-index: 50;

  button:first-child {
    margin-right: 8px;
  }

  button {
    display: inline-block;

    width: 109px;
    height: 24px;
    padding: 0px 4px;

    text-align: center;
    font-size: 12px;
    line-height: 16px;

    border: 1px solid #0078d4;
    outline: none;
    background: var(--theme-cell-creator-bg);
    color: #0078d4;
  }

  button span {
    color: var(--theme-cell-creator-fg);
  }

  button span:hover {
    color: var(--theme-cell-creator-fg-hover);
  }

  button:hover {
    background-color: #f0f0f0;
  }

  .octicon {
    transition: color 0.5s;
    margin-right: 12px;
  }

  img {
    height: 12px;
  }
`;

export const Divider = styled.div`
  display: none;
  position: relative;
  top: 12px;
  height: 1px;
  width: 100%;
  border-top: 1px solid rgba(204, 204, 204, 0.8);
`;

const CreatorHoverMask = styled.div`
  display: block;
  position: relative;
  overflow: visible;
  height: 0px;

  @media print {
    display: none;
  }
`;
const CreatorHoverRegion = styled.div`
  position: relative;
  overflow: visible;
  top: 5px;
  height: 30px;
  text-align: center;

  &:hover ${CellCreatorMenu} {
    display: inline-block;
  }

  &:hover ${Divider} {
    display: inherit;
  }
`;

const FirstCreatorContainer = styled.div`
  height: 20px;
`;

interface CellCreatorProps {
  above: boolean;
  createCell: (type: "markdown" | "code", above: boolean) => void;
}

export class PureCellCreator extends React.PureComponent<CellCreatorProps> {
  createMarkdownCell = () => {
    this.props.createCell("markdown", this.props.above);
  };

  createCodeCell = () => {
    this.props.createCell("code", this.props.above);
  };

public override render() {
    return (
      <CreatorHoverMask>
        <CreatorHoverRegion>
          <Divider />
          <CellCreatorMenu>
            <button onClick={this.createCodeCell} className="add-code-cell">
              <span className="octicon">
                <img src={AddCodeCellIcon} alt="Add code cell" />
              </span>
              Add code
            </button>
            <button onClick={this.createMarkdownCell} className="add-text-cell">
              <span className="octicon">
                <img src={AddTextCellIcon} alt="Add text cell" />
              </span>
              Add text
            </button>
          </CellCreatorMenu>
        </CreatorHoverRegion>
      </CreatorHoverMask>
    );
  }
}

class CellCreator extends React.PureComponent<ComponentProps & DispatchProps & StateProps> {
  createCell = (type: "code" | "markdown", above: boolean): void => {
    const { createCellBelow, createCellAppend, createCellAbove, id, contentRef } = this.props;

    if (id === undefined || typeof id !== "string") {
      createCellAppend({ cellType: type, contentRef });
      return;
    }

    above
      ? createCellAbove({ cellType: type, id, contentRef })
      : createCellBelow({ cellType: type, id, source: "", contentRef });
  };

public override render() {
    return (
      <React.Fragment>
        {this.props.isFirstCell && (
          <FirstCreatorContainer>
            <PureCellCreator above={true} createCell={this.createCell} />
          </FirstCreatorContainer>
        )}
        {this.props.children}
        <PureCellCreator above={false} createCell={this.createCell} />
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: AppState, ownProps: ComponentProps) => {
  const { id, contentRef } = ownProps;
  const model = selectors.model(state, { contentRef });
  let isFirstCell = false;

  if (model && model.type === "notebook") {
    const cellOrder = selectors.notebook.cellOrder(model);
    const cellIndex = cellOrder.findIndex((cellId) => cellId === id);
    isFirstCell = cellIndex === 0;
  }

  return {
    isFirstCell,
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
  createCellAbove: (payload: { cellType: CellType; id?: string; contentRef: ContentRef }) =>
    dispatch(actions.createCellAbove(payload)),
  createCellAppend: (payload: { cellType: CellType; contentRef: ContentRef }) =>
    dispatch(actions.createCellAppend(payload)),
  createCellBelow: (payload: { cellType: CellType; id?: string; source: string; contentRef: ContentRef }) =>
    dispatch(actions.createCellBelow(payload)),
});

export default connect(mapStateToProps, mapDispatchToProps)(CellCreator);
