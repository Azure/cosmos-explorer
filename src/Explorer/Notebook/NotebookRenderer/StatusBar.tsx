import { AppState, ContentRef, selectors } from "@nteract/core";
import distanceInWordsToNow from "date-fns/distance_in_words_to_now";
import React from "react";
import { connect } from "react-redux";
import { StyleConstants } from "../../../Common/Constants";

interface Props {
  lastSaved?: Date | null;
  kernelSpecDisplayName: string;
  kernelStatus: string;
}

const NOT_CONNECTED = "not connected";

import styled from "styled-components";

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
        <Bar data-test="notebookStatusBar">
          <RightStatus>
            {this.props.lastSaved ? (
              <p data-test="saveStatus"> Last saved {distanceInWordsToNow(this.props.lastSaved)} </p>
            ) : (
              <p> Not saved yet </p>
            )}
          </RightStatus>
          <LeftStatus>
            <p data-test="kernelStatus">
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

const makeMapStateToProps = (initialState: AppState, initialProps: InitialProps): ((state: AppState) => Props) => {
  const { contentRef } = initialProps;

  const mapStateToProps = (state: AppState) => {
    const content = selectors.content(state, { contentRef });

    if (!content || content.type !== "notebook") {
      return {
        kernelStatus: NOT_CONNECTED,
        kernelSpecDisplayName: "no kernel",
        lastSaved: null
      };
    }

    const kernelRef = content.model.kernelRef;
    let kernel = null;
    if (kernelRef) {
      kernel = selectors.kernel(state, { kernelRef });
    }

    const lastSaved = content && content.lastSaved ? content.lastSaved : null;

    const kernelStatus = kernel != null && kernel.status != null ? kernel.status : NOT_CONNECTED;

    // TODO: We need kernels associated to the kernelspec they came from
    //       so we can pluck off the display_name and provide it here
    let kernelSpecDisplayName = " ";
    if (kernelStatus === NOT_CONNECTED) {
      kernelSpecDisplayName = "no kernel";
    } else if (kernel != null && kernel.kernelSpecName != null) {
      kernelSpecDisplayName = kernel.kernelSpecName;
    } else if (content && content.type === "notebook") {
      kernelSpecDisplayName = selectors.notebook.displayName(content.model) || " ";
    }

    return {
      kernelSpecDisplayName,
      kernelStatus,
      lastSaved
    };
  };

  return mapStateToProps;
};

export default connect(makeMapStateToProps)(StatusBar);
