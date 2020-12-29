import "./ConnectScreen.less";
import * as React from "react";
import { useMsal } from "@azure/msal-react";
import { useBoolean } from "@uifabric/react-hooks";

export const ConnectScreen: React.FunctionComponent = () => {
  const { instance } = useMsal();
  const [isConnectionStringVisible, { setTrue: showConnectionString }] = useBoolean(false);

  return (
    <div id="connectExplorer" className="connectExplorerContainer" style={{ display: "flex" }}>
      <div className="connectExplorerFormContainer">
        <div className="connectExplorer">
          <p className="connectExplorerContent">
            <img src="images/HdeConnectCosmosDB.svg" alt="Azure Cosmos DB" />
          </p>
          <p className="welcomeText">Welcome to Azure Cosmos DB</p>
          {isConnectionStringVisible ? (
            <form id="connectWithConnectionString">
              <p className="connectExplorerContent connectStringText">Connect to your account with connection string</p>
              <p className="connectExplorerContent">
                <input className="inputToken" type="text" required placeholder="Please enter a connection string" />
                <span className="errorDetailsInfoTooltip" style={{ display: "none" }}>
                  <img className="errorImg" src="images/error.svg" alt="Error notification" />
                  <span className="errorDetails" />
                </span>
              </p>
              <p className="connectExplorerContent">
                <input className="filterbtnstyle" type="submit" value="Connect" />
              </p>
              <p className="switchConnectTypeText" onClick={() => instance.loginPopup()}>
                Sign In with Azure Account
              </p>
            </form>
          ) : (
            <div id="connectWithAad">
              <input className="filterbtnstyle" type="button" value="Sign In" onClick={() => instance.loginPopup()} />
              <p
                className="switchConnectTypeText"
                onClick={() => {
                  showConnectionString();
                }}
              >
                Connect to your account with connection string
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
