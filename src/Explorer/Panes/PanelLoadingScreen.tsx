import React from "react";
import LoadingIndicator_3Squares from "../../../images/LoadingIndicator_3Squares.gif";

export const PanelLoadingScreen: React.FunctionComponent = () => (
  <div className="dataExplorerLoaderContainer dataExplorerPaneLoaderContainer">
    <img className="dataExplorerLoader" src={LoadingIndicator_3Squares} />
  </div>
);
