import { FluentProvider, Link, MessageBar, MessageBarBody, webLightTheme } from "@fluentui/react-components";
import { useBoolean } from "@fluentui/react-hooks";
import { getErrorMessage } from "Common/ErrorHandlingUtils";
import { userContext } from "UserContext";
import * as React from "react";
import ConnectImage from "../../../../images/HdeConnectCosmosDB.svg";
import { AuthType } from "../../../AuthType";
import { HttpStatusCodes } from "../../../Common/Constants";
import { fetchEncryptedToken, isAccountRestrictedForConnectionStringLogin } from "../../../Common/PortalBackendClient";
import { AccessInputMetadata } from "../../../Contracts/DataModels";
import { parseConnectionString } from "../Helpers/ConnectionStringParser";
import { isResourceTokenConnectionString } from "../Helpers/ResourceTokenUtils";
import { isDirectConnectionStringLoginApi } from "../HostedUtils";

interface Props {
  connectionString: string;
  login: () => void;
  setEncryptedToken: (token: string) => void;
  setConnectionString: (connectionString: string) => void;
  setAuthType: (authType: AuthType) => void;
  setAccountMetadata: (metadata: AccessInputMetadata) => void;
}

export const ConnectExplorer: React.FunctionComponent<Props> = ({
  setEncryptedToken,
  login,
  setAuthType,
  connectionString,
  setConnectionString,
  setAccountMetadata,
}: Props) => {
  const [isFormVisible, { setTrue: showForm }] = useBoolean(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [isBlockedByFirewall, setIsBlockedByFirewall] = React.useState(false);
  const [isConnecting, setIsConnecting] = React.useState(false);
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
              aria-busy={isConnecting}
              onSubmit={async (event) => {
                event.preventDefault();
                if (isConnecting) {
                  return;
                }

                setErrorMessage("");
                setIsBlockedByFirewall(false);
                setIsConnecting(true);

                try {
                  try {
                    if (await isAccountRestrictedForConnectionStringLogin(connectionString)) {
                      setErrorMessage(
                        "This account has been blocked from connection-string login. Please go to cosmos.azure.com/aad for AAD based login.",
                      );
                      return;
                    }
                  } catch (error) {
                    setErrorMessage(getErrorMessage(error as Error));
                    return;
                  }

                  if (isResourceTokenConnectionString(connectionString)) {
                    setAuthType(AuthType.ResourceToken);
                    return;
                  }

                  const metadata = parseConnectionString(connectionString);
                  if (!metadata) {
                    setErrorMessage(
                      "We couldn't recognize this connection string. Verify that it is a valid Azure Cosmos DB connection string and try again.",
                    );
                    return;
                  }

                  if (isDirectConnectionStringLoginApi(metadata.apiKind)) {
                    setAccountMetadata(metadata);
                    setAuthType(AuthType.ConnectionString);
                    return;
                  }

                  // Mongo and Cassandra go through the Portal Backend
                  try {
                    const encryptedToken = await fetchEncryptedToken(connectionString);
                    setEncryptedToken(encryptedToken);
                    setAuthType(AuthType.ConnectionString);
                  } catch (error) {
                    const errorDetails = await (error as Response).text();

                    setErrorMessage(
                      errorDetails
                        ? `Couldn't authenticate with Cosmos DB: ${errorDetails}`
                        : "Failed to connect to the account. Please check the connection string and try again.",
                    );
                    // A Forbidden usually means the account firewall dropped the request. The connection
                    // string is exchanged by the Portal Backend rather than the browser, so the account has
                    // to allowlist those services.
                    setIsBlockedByFirewall((error as Response).status === HttpStatusCodes.Forbidden);
                  }
                } finally {
                  setIsConnecting(false);
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
              </p>
              {errorMessage.length > 0 && (
                <FluentProvider theme={webLightTheme} className="connectErrorMessageBar">
                  <MessageBar intent="error" layout="multiline">
                    <MessageBarBody>
                      <span className="errorDetails">{errorMessage}</span>
                      {isBlockedByFirewall && (
                        <Link
                          className="errorHelpLink"
                          href="https://learn.microsoft.com/azure/cosmos-db/how-to-configure-firewall#allow-requests-from-the-azure-portal"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Allow access from Azure Portal
                        </Link>
                      )}
                    </MessageBarBody>
                  </MessageBar>
                </FluentProvider>
              )}
              <p className="connectExplorerContent">
                <input
                  className="filterbtnstyle"
                  type="submit"
                  value={isConnecting ? "Connecting..." : "Connect"}
                  disabled={isConnecting}
                />
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
