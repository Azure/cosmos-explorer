import React from "react";
import LoadingIndicator_3Squares from "../../../images/LoadingIndicator_3Squares.gif";

export const PanelLoadingScreen: React.FunctionComponent = () => (
  <div id="loadingScreen" className="dataExplorerLoaderContainer dataExplorerLoaderforcopyJobs">
    <img className="dataExplorerLoader" src={LoadingIndicator_3Squares} />
  </div>
);
