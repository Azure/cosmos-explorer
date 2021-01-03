import * as React from "react";
import { useBoolean } from "@uifabric/react-hooks";
import { HttpHeaders } from "../../../Common/Constants";
import { GenerateTokenResponse } from "../../../Contracts/DataModels";
import { configContext } from "../../../ConfigContext";

interface Props {
  login: () => void;
  setEncryptedToken: (token: string) => void;
}

export const ConnectExplorer: React.FunctionComponent<Props> = ({ setEncryptedToken, login }: Props) => {
  const [connectionString, setConnectionString] = React.useState<string>("");
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
            <form
              id="connectWithConnectionString"
              onSubmit={async event => {
                event.preventDefault();
                const headers = new Headers();
                headers.append(HttpHeaders.connectionString, connectionString);
                const url = configContext.BACKEND_ENDPOINT + "/api/guest/tokens/generateToken";
                const response = await fetch(url, { headers, method: "POST" });
                if (!response.ok) {
                  throw response;
                }
                // This API has a quirk where it must be parsed twice
                const result: GenerateTokenResponse = JSON.parse(await response.json());
                console.log(result.readWrite || result.read);
                setEncryptedToken(decodeURIComponent(result.readWrite || result.read));
              }}
            >
              <p className="connectExplorerContent connectStringText">Connect to your account with connection string</p>
              <p className="connectExplorerContent">
                <input
                  className="inputToken"
                  type="text"
                  required
                  placeholder="Please enter a connection string"
                  value={connectionString}
                  onChange={event => {
                    setConnectionString(event.target.value);
                  }}
                />
                <span className="errorDetailsInfoTooltip" style={{ display: "none" }}>
                  <img className="errorImg" src="images/error.svg" alt="Error notification" />
                  <span className="errorDetails"></span>
                </span>
              </p>
              <p className="connectExplorerContent">
                <input className="filterbtnstyle" type="submit" value="Connect" />
              </p>
              <p className="switchConnectTypeText" onClick={login}>
                Sign In with Azure Account
              </p>
            </form>
          ) : (
            <div id="connectWithAad">
              <input className="filterbtnstyle" type="button" value="Sign In" onClick={login} />
              <p className="switchConnectTypeText" onClick={showConnectionString}>
                Connect to your account with connection string
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
