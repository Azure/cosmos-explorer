import { useBoolean } from "@fluentui/react-hooks";
import { client } from "Common/CosmosClient";
import { Keys, t } from "Localization";
import { updateUserContext, userContext } from "UserContext";
import * as React from "react";
import ConnectImage from "../../../../images/HdeConnectCosmosDB.svg";
import ErrorImage from "../../../../images/error.svg";
import { AuthType } from "../../../AuthType";
import { HttpHeaders } from "../../../Common/Constants";
import { configContext } from "../../../ConfigContext";
import { AccessInputMetadata } from "../../../Contracts/DataModels";
import { parseConnectionString } from "../Helpers/ConnectionStringParser";
import { isResourceTokenConnectionString } from "../Helpers/ResourceTokenUtils";
import { extractMasterKeyfromConnectionString, isDirectConnectionStringLoginApi } from "../HostedUtils";

interface Props {
  connectionString: string;
  login: () => void;
  setEncryptedToken: (token: string) => void;
  setConnectionString: (connectionString: string) => void;
  setAuthType: (authType: AuthType) => void;
  setDirectLoginMetadata: (metadata: AccessInputMetadata) => void;
}

export const fetchEncryptedToken = async (connectionString: string): Promise<string> => {
  const headers = new Headers();
  headers.append(HttpHeaders.connectionString, connectionString);
  headers.append(HttpHeaders.authorization, connectionString);
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

// Verifies the connection string can actually authenticate against the account by making a lightweight
// read of the database account through the Cosmos client. Throws on failure.
export const validateDirectConnectionStringConnectivity = async (
  connectionString: string,
  metadata: AccessInputMetadata,
): Promise<void> => {
  const masterKey = extractMasterKeyfromConnectionString(connectionString);
  if (!metadata?.documentEndpoint || !masterKey) {
    throw new Error(t(Keys.connectExplorer.errors.connectivityUnreachable));
  }

  updateUserContext({
    authType: AuthType.ConnectionString,
    masterKey,
    endpoint: metadata.documentEndpoint,
    refreshCosmosClient: true,
  });

  try {
    await client().getDatabaseAccount();
  } catch {
    throw new Error(t(Keys.connectExplorer.errors.connectivityUnreachable));
  }
};

export const ConnectExplorer: React.FunctionComponent<Props> = ({
  setEncryptedToken,
  login,
  setAuthType,
  connectionString,
  setConnectionString,
  setDirectLoginMetadata,
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

                const metadata = parseConnectionString(connectionString);
                if (metadata && isDirectConnectionStringLoginApi(metadata.apiKind)) {
                  // SQL, Tables, and Gremlin sign data-plane requests client-side with the account key, so
                  // we skip the Portal Backend proxy and use the metadata parsed from the connection string.
                  try {
                    await validateDirectConnectionStringConnectivity(connectionString, metadata);
                    setDirectLoginMetadata(metadata);
                    setAuthType(AuthType.ConnectionString);
                  } catch (error) {
                    setErrorMessage(error.message);
                  }
                  return;
                }

                try {
                  const encryptedToken = await fetchEncryptedToken(connectionString);
                  setEncryptedToken(encryptedToken);
                  setAuthType(AuthType.ConnectionString);
                } catch (error) {
                  setErrorMessage(t(Keys.connectExplorer.errors.connectivityUnreachable));
                }
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
                <p className="switchConnectTypeText" data-test="Link:SwitchConnectionType" onClick={showForm}>
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
