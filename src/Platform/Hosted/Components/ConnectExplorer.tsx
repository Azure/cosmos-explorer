import * as React from "react";
import { useBoolean } from "@uifabric/react-hooks";
import { HttpHeaders } from "../../../Common/Constants";
import { GenerateTokenResponse } from "../../../Contracts/DataModels";
import { configContext } from "../../../ConfigContext";
import { AuthType } from "../../../AuthType";
import { isResourceTokenConnectionString } from "../Helpers/ResourceTokenUtils";

interface Props {
  connectionString: string;
  login: () => void;
  setEncryptedToken: (token: string) => void;
  setConnectionString: (connectionString: string) => void;
  setAuthType: (authType: AuthType) => void;
}

export const ConnectExplorer: React.FunctionComponent<Props> = ({
  setEncryptedToken,
  login,
  setAuthType,
  connectionString,
  setConnectionString,
}: Props) => {
  const [isFormVisible, { setTrue: showForm }] = useBoolean(false);

  return (
    <div id="connectExplorer" className="connectExplorerContainer" style={{ display: "flex" }}>
      <div className="connectExplorerFormContainer">
        <div className="connectExplorer">
          <p className="connectExplorerContent">
            <img src="images/HdeConnectCosmosDB.svg" alt="Azure Cosmos DB" />
          </p>
          <p className="welcomeText">Welcome to Azure Cosmos DB</p>
          {isFormVisible ? (
            <form
              id="connectWithConnectionString"
              onSubmit={async (event) => {
                event.preventDefault();

                if (isResourceTokenConnectionString(connectionString)) {
                  setAuthType(AuthType.ResourceToken);
                  return;
                }

                const headers = new Headers();
                headers.append(HttpHeaders.connectionString, connectionString);
                const url = configContext.BACKEND_ENDPOINT + "/api/guest/tokens/generateToken";
                const response = await fetch(url, { headers, method: "POST" });
                if (!response.ok) {
                  throw response;
                }
                // This API has a quirk where it must be parsed twice
                const result: GenerateTokenResponse = JSON.parse(await response.json());
                setEncryptedToken(decodeURIComponent(result.readWrite || result.read));
                setAuthType(AuthType.ConnectionString);
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
                  onChange={(event) => {
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
              <p className="switchConnectTypeText" onClick={showForm}>
                Connect to your account with connection string
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
