import { useBoolean } from "@fluentui/react-hooks";
import { userContext } from "UserContext";
import * as React from "react";
import ConnectImage from "../../../../images/HdeConnectCosmosDB.svg";
import ErrorImage from "../../../../images/error.svg";
import { AuthType } from "../../../AuthType";
import { HttpHeaders } from "../../../Common/Constants";
import { configContext } from "../../../ConfigContext";
import { GenerateTokenResponse } from "../../../Contracts/DataModels";
import { isResourceTokenConnectionString } from "../Helpers/ResourceTokenUtils";

interface Props {
  connectionString: string;
  login: () => void;
  setEncryptedToken: (token: string) => void;
  setConnectionString: (connectionString: string) => void;
  setAuthType: (authType: AuthType) => void;
}

export const fetchEncryptedToken = async (connectionString: string): Promise<string> => {
  const headers = new Headers();
  headers.append(HttpHeaders.connectionString, connectionString);
  const url = configContext.BACKEND_ENDPOINT + "/api/guest/tokens/generateToken";
  const response = await fetch(url, { headers, method: "POST" });
  if (!response.ok) {
    throw response;
  }
  // This API has a quirk where it must be parsed twice
  const result: GenerateTokenResponse = JSON.parse(await response.json());
  return decodeURIComponent(result.readWrite || result.read);
};

export const isAccountRestrictedForConnectionStringLogin = async (connectionString: string): Promise<boolean> => {
  const headers = new Headers();
  headers.append(HttpHeaders.connectionString, connectionString);
  const url = configContext.BACKEND_ENDPOINT + "/api/accountrestrictions/checkconnectionstringlogin";
  const response = await fetch(url, { headers, method: "POST" });
  if (!response.ok) {
    throw response;
  }

  return (await response.text()) === "True";
};

export const hideErrorDetails = () => {
  window.document.getElementById("errorDetails").innerText = "";
  window.document.getElementById("errorDetailsInfoTooltip").style.display = "none";
};

export const showErrorDetails = (errorMessage: string) => {
  window.document.getElementById("errorDetails").innerText = errorMessage;
  window.document.getElementById("errorDetailsInfoTooltip").style.display = "inline";
};

export const ConnectExplorer: React.FunctionComponent<Props> = ({
  setEncryptedToken,
  login,
  setAuthType,
  connectionString,
  setConnectionString,
}: Props) => {
  const [isFormVisible, { setTrue: showForm }] = useBoolean(false);
  const enableConnectionStringLogin = !userContext.features.disableConnectionStringLogin;

  return (
    <div id="connectExplorer" className="connectExplorerContainer" style={{ display: "flex" }}>
      <div className="connectExplorerFormContainer">
        <div className="connectExplorer">
          <p className="connectExplorerContent">
            <img src={ConnectImage} alt="Azure Cosmos DB" />
          </p>
          <p className="welcomeText">Welcome to Azure Cosmos DB</p>
          {isFormVisible && enableConnectionStringLogin ? (
            <form
              id="connectWithConnectionString"
              onSubmit={async (event) => {
                event.preventDefault();
                hideErrorDetails();

                if (await isAccountRestrictedForConnectionStringLogin(connectionString)) {
                  showErrorDetails("This account has been blocked from connection-string login.");
                  return;
                }

                if (isResourceTokenConnectionString(connectionString)) {
                  setAuthType(AuthType.ResourceToken);
                  return;
                }

                const encryptedToken = await fetchEncryptedToken(connectionString);
                setEncryptedToken(encryptedToken);
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
                <span className="errorDetailsInfoTooltip" id="errorDetailsInfoTooltip" style={{ display: "none" }}>
                  <img className="errorImg" src={ErrorImage} alt="Error notification" />
                  <span className="errorDetails" id="errorDetails"></span>
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
              {enableConnectionStringLogin && (
                <p className="switchConnectTypeText" onClick={showForm}>
                  Connect to your account with connection string
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
