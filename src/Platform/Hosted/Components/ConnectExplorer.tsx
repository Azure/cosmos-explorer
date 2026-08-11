import { useBoolean } from "@fluentui/react-hooks";
import { client } from "Common/CosmosClient";
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
import {
  extractAccountKeyFromConnectionString,
  isDirectConnectionStringLoginApi,
  validateDirectConnectionStringLogin,
} from "../HostedUtils";

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

// Verifies the account key can actually authenticate against the account by making a lightweight read of
// the database account through the same Cosmos client the Data Explorer uses (client-side signing and
// proxy routing). Returns undefined on success, or an error message when the client cannot connect, so
// the caller can block opening the Data Explorer view.
export const validateDirectConnectionStringConnectivity = async (
  connectionString: string,
  metadata: AccessInputMetadata,
): Promise<string | undefined> => {
  const masterKey = extractAccountKeyFromConnectionString(connectionString);
  if (!metadata?.documentEndpoint || !masterKey) {
    return "Unable to connect to the account with the provided connection string.";
  }

  // Configure the client the same way the Data Explorer will, then issue a lightweight authenticated
  // request. The Cosmos client signs locally with the master key and routes through the same proxy.
  updateUserContext({
    authType: AuthType.ConnectionString,
    masterKey,
    endpoint: metadata.documentEndpoint,
    refreshCosmosClient: true,
  });

  try {
    await client().getDatabaseAccount();
    return undefined;
  } catch {
    return "Unable to connect to the account. Please verify the connection string is correct and that the account is reachable.";
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
                  // Validate the host and account client-side (mirrors the backend's ValidateHostAndAccount).
                  const validationError = validateDirectConnectionStringLogin(connectionString, metadata);
                  if (validationError) {
                    setErrorMessage(validationError);
                    return;
                  }
                  // Only open the view once we confirm the Cosmos client can actually connect.
                  const connectivityError = await validateDirectConnectionStringConnectivity(
                    connectionString,
                    metadata,
                  );
                  if (connectivityError) {
                    setErrorMessage(connectivityError);
                    return;
                  }
                  setDirectLoginMetadata(metadata);
                  setAuthType(AuthType.ConnectionString);
                  return;
                }

                try {
                  const encryptedToken = await fetchEncryptedToken(connectionString);
                  setEncryptedToken(encryptedToken);
                  setAuthType(AuthType.ConnectionString);
                } catch (error) {
                  setErrorMessage(
                    "Failed to connect using the provided connection string. Please verify it is correct and try again.",
                  );
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
