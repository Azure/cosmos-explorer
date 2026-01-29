import { makeStyles } from "@fluentui/react-components";
import React from "react";
import hdeConnectImage from "../../images/HdeConnectCosmosDB.svg";

const useStyles = makeStyles({
  root: {
    height: "100vh",
    width: "100vw",
    backgroundColor: "var(--colorNeutralBackground1)",
    color: "var(--colorNeutralForeground1)",
  },
});

function LoadingExplorer(): JSX.Element {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <div className="splashLoaderContainer">
        <div className="splashLoaderContentContainer">
          <p className="connectExplorerContent">
            <img src={hdeConnectImage} alt="Azure Cosmos DB" />
          </p>
          <p className="splashLoaderTitle" id="explorerLoadingStatusTitle">
            Welcome to Azure Cosmos DB
          </p>
          <p className="splashLoaderText" id="explorerLoadingStatusText" role="alert">
            Connecting...
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoadingExplorer;
