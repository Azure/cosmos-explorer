import { ContentRef } from "@nteract/core";
import React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import * as actions from "../../NotebookComponent/actions";

interface ComponentProps {
  id: string;
  contentRef: ContentRef; // TODO: Make this per contentRef?
  children: React.ReactNode;
}

interface DispatchProps {
  hover: () => void;
  unHover: () => void;
}

/**
 * HoverableCell sets the hovered cell
 */
class HoverableCell extends React.Component<ComponentProps & DispatchProps> {
  render() {
    return (
      <div className="HoverableCell" onMouseEnter={this.props.hover} onMouseLeave={this.props.unHover}>
        {this.props.children}
      </div>
    );
  }
}

const mapDispatchToProps = (
  dispatch: Dispatch,
  { id, contentRef }: { id: string; contentRef: ContentRef }
): DispatchProps => ({
  hover: () => dispatch(actions.setHoveredCell({ cellId: id })),
  unHover: () => dispatch(actions.setHoveredCell({ cellId: undefined })),
});

export default connect(undefined, mapDispatchToProps)(HoverableCell);
