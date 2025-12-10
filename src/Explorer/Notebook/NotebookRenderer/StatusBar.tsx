import { AppState, ContentRef, selectors } from "@nteract/core";
import distanceInWordsToNow from "date-fns/distance_in_words_to_now";
import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { StyleConstants } from "../../../Common/StyleConstants";

interface Props {
  lastSaved?: Date | null;
  kernelSpecDisplayName: string;
  kernelStatus: string;
}

const NOT_CONNECTED = "not connected";

export const LeftStatus = styled.div`
  float: left;
  display: block;
  padding-left: 10px;
`;
export const RightStatus = styled.div`
  float: right;
  padding-right: 10px;
  display: block;
`;

export const Bar = styled.div`
  padding: 8px 0px 2px;
  border-top: 1px solid ${StyleConstants.BaseMedium};
  border-left: 1px solid ${StyleConstants.BaseMedium};
  width: 100%;
  height: 100%;
  font-size: 12px;
  line-height: 0.5em;
  background: var(--status-bar);
  z-index: 99;
  @media print {
    display: none;
  }
`;

const BarContainer = styled.div`
  padding-left: 4px;
`;

export class StatusBar extends React.Component<Props> {
  shouldComponentUpdate(nextProps: Props): boolean {
    if (this.props.lastSaved !== nextProps.lastSaved || this.props.kernelStatus !== nextProps.kernelStatus) {
      return true;
    }
    return false;
  }

  render() {
    const name = this.props.kernelSpecDisplayName || "Loading...";

    return (
      <BarContainer>
        <Bar data-testid="notebookStatusBar">
          <RightStatus>
            {this.props.lastSaved ? (
              <p data-testid="saveStatus"> Last saved {distanceInWordsToNow(this.props.lastSaved)} </p>
            ) : (
              <p> Not saved yet </p>
            )}
          </RightStatus>
          <LeftStatus>
            <p data-testid="kernelStatus">
              {name} | {this.props.kernelStatus}
            </p>
          </LeftStatus>
        </Bar>
      </BarContainer>
    );
  }
}

interface InitialProps {
  contentRef: ContentRef;
}

const makeMapStateToProps = (_initialState: AppState, initialProps: InitialProps): ((state: AppState) => Props) => {
  const { contentRef } = initialProps;

  const mapStateToProps = (state: AppState) => {
    const content = selectors.content(state, { contentRef });

    if (!content || content.type !== "notebook") {
      return {
        kernelStatus: NOT_CONNECTED,
        kernelSpecDisplayName: "no kernel",
        lastSaved: undefined,
      };
    }

    const kernelRef = content.model.kernelRef;
    let kernel;
    if (kernelRef) {
      kernel = selectors.kernel(state, { kernelRef });
    }

    const lastSaved = content && content.lastSaved ? content.lastSaved : undefined;

    const kernelStatus = kernel?.status || NOT_CONNECTED;

    // TODO: We need kernels associated to the kernelspec they came from
    //       so we can pluck off the display_name and provide it here
    let kernelSpecDisplayName = " ";
    if (kernelStatus === NOT_CONNECTED) {
      kernelSpecDisplayName = "no kernel";
    } else if (kernel?.kernelSpecName) {
      kernelSpecDisplayName = kernel.kernelSpecName;
    } else if (content && content.type === "notebook") {
      // TODO Fix typing here
      kernelSpecDisplayName = selectors.notebook.displayName(content.model as never) || " ";
    }

    return {
      kernelSpecDisplayName,
      kernelStatus,
      lastSaved,
    };
  };

  return mapStateToProps;
};

export default connect(makeMapStateToProps)(StatusBar);
