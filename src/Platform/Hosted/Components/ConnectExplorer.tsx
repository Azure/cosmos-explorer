import { useBoolean } from "@fluentui/react-hooks";
import { userContext } from "UserContext";
import * as React from "react";
import ConnectImage from "../../../../images/HdeConnectCosmosDB.svg";
import ErrorImage from "../../../../images/error.svg";
import { AuthType } from "../../../AuthType";
import { HttpHeaders } from "../../../Common/Constants";
import { configContext } from "../../../ConfigContext";
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
  const url = configContext.PORTAL_BACKEND_ENDPOINT + "/api/connectionstring/token/generatetoken";
  const response = await fetch(url, { headers, method: "POST" });
  if (!response.ok) {
    throw response;
  }

  const encryptedTokenResponse: string = await response.json();
  return decodeURIComponent(encryptedTokenResponse);
};

export const isAccountRestrictedForConnectionStringLogin = async (connectionString: string): Promise<boolean> => {
  const headers = new Headers();
  headers.append(HttpHeaders.connectionString, connectionString);
  const url = configContext.PORTAL_BACKEND_ENDPOINT + "/api/guest/accountrestrictions/checkconnectionstringlogin";
  const response = await fetch(url, { headers, method: "POST" });
  if (!response.ok) {
    throw response;
  }

  return (await response.text()).toLowerCase() === "true";
};

export const ConnectExplorer: React.FunctionComponent<Props> = ({
  setEncryptedToken,
  login,
  setAuthType,
  connectionString,
  setConnectionString,
}: Props) => {
  const [isFormVisible, { setTrue: showForm }] = useBoolean(false);
  const [errorMessage, setErrorMessage] = React.useState("");
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
                setErrorMessage("");

                if (await isAccountRestrictedForConnectionStringLogin(connectionString)) {
                  setErrorMessage(
                    "This account has been blocked from connection-string login. Please go to cosmos.azure.com/aad for AAD based login.",
                  );
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
                {errorMessage.length > 0 && (
                  <span className="errorDetailsInfoTooltip">
                    <img className="errorImg" src={ErrorImage} alt="Error notification" />
                    <span className="errorDetails">{errorMessage}</span>
                  </span>
                )}
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
                <p className="switchConnectTypeText" data-testid="Link:SwitchConnectionType" onClick={showForm}>
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
