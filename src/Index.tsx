import "./i18n";
import React, { useState } from "react";
import ReactDOM from "react-dom";
import Arrow from "../images/Arrow.svg";
import CosmosDB_20170829 from "../images/CosmosDB_20170829.svg";
import Explorer from "../images/Explorer.svg";
import Feedback from "../images/Feedback.svg";
import Quickstart from "../images/Quickstart.svg";
import "../less/index.less";

const Index = (): JSX.Element => {
  const [navigationSelection, setNavigationSelection] = useState("quickstart");

  const quickstart_click = () => {
    setNavigationSelection("quickstart");
  };

  const explorer_click = () => {
    setNavigationSelection("explorer");
  };

  return (
    <React.Fragment>
      <header className="header HeaderBg">
        <div className="items">
          <img className="DocDBicon" src={CosmosDB_20170829} alt="Azure Cosmos DB" />
          <a className="createdocdbacnt" href="https://aka.ms/documentdbcreate" rel="noreferrer" target="_blank">
            Create an Azure Cosmos DB account <img className="rightarrowimg" src={Arrow} alt="" />
          </a>
          <span className="title">Azure Cosmos DB Emulator</span>
        </div>
      </header>
      <nav className="fixedleftpane">
        <div
          id="Quickstart"
          onClick={quickstart_click}
          className={navigationSelection === "quickstart" ? "topSelected" : ""}
        >
          <img id="imgiconwidth1" src={Quickstart} alt="Open Quick Start" />
          <span className="menuQuickStart">Quickstart</span>
        </div>

        <div id="Explorer" onClick={explorer_click} className={navigationSelection === "explorer" ? "topSelected" : ""}>
          <img id="imgiconwidth1" src={Explorer} alt="Open Data Explorer" />
          <span className="menuExplorer">Explorer</span>
        </div>

        <div>
          <a className="feedbackstyle" href="https://aka.ms/cosmosdbfeedback?subject=Cosmos%20DB%20Emulator%20Feedback">
            <img id="imgiconwidth1" src={Feedback} alt="Report Issue" />
            <span className="menuExplorer">Report Issue</span>
          </a>
        </div>
      </nav>

      {navigationSelection === "quickstart" && (
        <iframe name="quickstart" className="iframe" src="quickstart.html"></iframe>
      )}

      {navigationSelection === "explorer" && (
        <iframe name="explorer" className="iframe" src="explorer.html?platform=Emulator"></iframe>
      )}
    </React.Fragment>
  );
};

ReactDOM.render(<Index />, document.getElementById("root"));
