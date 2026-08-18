import { useBoolean } from "@fluentui/react-hooks";
import { client } from "Common/CosmosClient";
import { getErrorMessage } from "Common/ErrorHandlingUtils";
import { logWarning } from "Common/Logger";
import { Keys, t } from "Localization";
import { updateUserContext, userContext } from "UserContext";
import * as React from "react";
import ConnectImage from "../../../../images/HdeConnectCosmosDB.svg";
import ErrorImage from "../../../../images/error.svg";
import { AuthType } from "../../../AuthType";
import { HttpHeaders } from "../../../Common/Constants";
import { configContext } from "../../../ConfigContext";
import { AccessInputMetadata } from "../../../Contracts/DataModels";
import { isAuthorizationError } from "../../../Utils/AuthorizationUtils";
import { parseConnectionString } from "../Helpers/ConnectionStringParser";
import { isResourceTokenConnectionString } from "../Helpers/ResourceTokenUtils";
import { extractMasterKeyfromConnectionString, isDirectConnectionStringLoginApi } from "../HostedUtils";

interface Props {
  connectionString: string;
  login: () => void;
  setEncryptedToken: (token: string) => void;
  setConnectionString: (connectionString: string) => void;
  setAuthType: (authType: AuthType) => void;
  setAccountMetadata: (metadata: AccessInputMetadata) => void;
  errorMessage?: string;
  setErrorMessage: (message: string) => void;
}

// Turns a failed Portal Backend response into an error that carries the message returned by the service
// and the HTTP status code, so the caller can tell an authorization failure from anything else.
const errorFromResponse = async (response: Response): Promise<Error> =>
  Object.assign(new Error((await response.text()) || response.statusText), { statusCode: response.status });

export const fetchEncryptedToken = async (connectionString: string): Promise<string> => {
  const headers = new Headers();
  headers.append(HttpHeaders.connectionString, connectionString);
  headers.append(HttpHeaders.authorization, connectionString);
  const url = configContext.PORTAL_BACKEND_ENDPOINT + "/api/connectionstring/token/generatetoken";
  const response = await fetch(url, { headers, method: "POST" });
  if (!response.ok) {
    throw await errorFromResponse(response);
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
    throw await errorFromResponse(response);
  }

  return (await response.text()).toLowerCase() === "true";
};

// Verifies the connection string can actually authenticate against the account by making a lightweight
// read of the database account through the Cosmos client. A 401 or 403 means the key is invalid or not
// authorized, so the login is blocked and the error returned by the service is shown. Any other failure
// (network blip, throttling, service outage) is not a credential problem, so the login is allowed to
// continue instead of blocking on a transient error.
export const validateDirectConnectionStringConnectivity = async (
  connectionString: string,
  metadata: AccessInputMetadata,
): Promise<void> => {
  const masterKey = extractMasterKeyfromConnectionString(connectionString);
  if (!metadata?.documentEndpoint || !masterKey) {
    throw new Error(t(Keys.connectExplorer.errors.connectFailed));
  }

  updateUserContext({
    authType: AuthType.ConnectionString,
    masterKey,
    endpoint: metadata.documentEndpoint,
    refreshCosmosClient: true,
  });

  try {
    await client().getDatabaseAccount();
  } catch (error) {
    if (isAuthorizationError(error)) {
      throw error;
    }

    logWarning(
      `Could not verify the connection string against the account: ${getErrorMessage(error)}`,
      "ConnectExplorer/validateDirectConnectionStringConnectivity",
    );
  }
};

export const ConnectExplorer: React.FunctionComponent<Props> = ({
  setEncryptedToken,
  login,
  setAuthType,
  connectionString,
  setConnectionString,
  setAccountMetadata,
  errorMessage,
  setErrorMessage,
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
                setErrorMessage("");

                try {
                  if (await isAccountRestrictedForConnectionStringLogin(connectionString)) {
                    setErrorMessage(
                      "This account has been blocked from connection-string login. Please go to cosmos.azure.com/aad for AAD based login.",
                    );
                    return;
                  }
                } catch (error) {
                  setErrorMessage(getErrorMessage(error));
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
                    setAccountMetadata(metadata);
                    setAuthType(AuthType.ConnectionString);
                  } catch (error) {
                    setErrorMessage(getErrorMessage(error));
                  }
                  return;
                }

                try {
                  const encryptedToken = await fetchEncryptedToken(connectionString);
                  setEncryptedToken(encryptedToken);
                  setAuthType(AuthType.ConnectionString);
                } catch (error) {
                  setErrorMessage(getErrorMessage(error));
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
                {errorMessage && (
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
              {errorMessage && (
                <span className="errorDetailsInfoTooltip">
                  <img className="errorImg" src={ErrorImage} alt="Error notification" />
                  <span className="errorDetails">{errorMessage}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
