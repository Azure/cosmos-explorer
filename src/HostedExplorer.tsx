import { initializeIcons } from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import { AadAuthorizationFailure } from "Platform/Hosted/Components/AadAuthorizationFailure";
import * as React from "react";
import { render } from "react-dom";
import ChevronRight from "../images/chevron-right.svg";
import "../less/hostedexplorer.less";
import { AuthType } from "./AuthType";
import { logError } from "./Common/Logger";
import { fetchAccessData, fetchEncryptedToken } from "./Common/PortalBackendClient";
import { configContext } from "./ConfigContext";
import { AccessInputMetadata, ApiKind, DatabaseAccount } from "./Contracts/DataModels";
import "./Explorer/Menus/NavBar/MeControlComponent.less";
import { HostedExplorerChildFrame } from "./HostedExplorerChildFrame";
import { AccountSwitcher } from "./Platform/Hosted/Components/AccountSwitcher";
import { ConnectExplorer } from "./Platform/Hosted/Components/ConnectExplorer";
import { DirectoryPickerPanel } from "./Platform/Hosted/Components/DirectoryPickerPanel";
import { FeedbackCommandButton } from "./Platform/Hosted/Components/FeedbackCommandButton";
import { MeControl } from "./Platform/Hosted/Components/MeControl";
import { SignInButton } from "./Platform/Hosted/Components/SignInButton";
import { TrialControls } from "./Platform/Hosted/TryCosmosDB/TrialControls";
import "./Platform/Hosted/ConnectScreen.less";
import { parseConnectionString } from "./Platform/Hosted/Helpers/ConnectionStringParser";
import { isResourceTokenConnectionString } from "./Platform/Hosted/Helpers/ResourceTokenUtils";
import {
  extractMasterKeyFromDirectLoginConnectionString,
  isDirectConnectionStringLoginApi,
} from "./Platform/Hosted/HostedUtils";
import { isTrialOwnerAuth, TrialOwnerAuth } from "./Platform/Hosted/TryCosmosDB/TryCosmosDB";
import { useTrialManagement } from "./Platform/Hosted/TryCosmosDB/useTrialManagement";
import "./Shared/appInsights";
import { allowedHostedExplorerEndpoints } from "./Utils/EndpointUtils";
import { useAADAuth } from "./hooks/useAADAuth";
import { useConfig } from "./hooks/useConfig";

initializeIcons();

const App: React.FunctionComponent = () => {
  // For handling encrypted portal tokens sent via query paramter
  const params = new URLSearchParams(window.location.search);
  const [encryptedToken, setEncryptedToken] = React.useState<string>(params && params.get("key"));
  // Encrypted token logins resolve the account metadata through the Portal Backend, while SQL/Table/Gremlin
  // connection-string logins derive it client-side, so both paths write to the same value.
  const [accountMetadata, setAccountMetadata] = React.useState<AccessInputMetadata>();

  React.useEffect(() => {
    if (encryptedToken) {
      fetchAccessData(encryptedToken).then(setAccountMetadata);
    }
  }, [encryptedToken]);

  // For showing/hiding panel
  const [isOpen, { setTrue: openPanel, setFalse: dismissPanel }] = useBoolean(false);
  const config = useConfig();
  const { isLoggedIn, armToken, graphToken, account, tenantId, logout, login, switchTenant, authFailure } =
    useAADAuth(config);

  const [databaseAccount, setDatabaseAccount] = React.useState<DatabaseAccount>();
  const [authType, setAuthType] = React.useState<AuthType>(encryptedToken ? AuthType.EncryptedToken : undefined);
  const [connectionString, setConnectionString] = React.useState<string>();
  const [ownerAuth, setOwnerAuth] = React.useState<TrialOwnerAuth>();
  const ownerConnection = React.useRef<string>();

  const ref = React.useRef<HTMLIFrameElement>();
  React.useEffect(() => {
    if (ownerConnection.current !== connectionString) {
      setOwnerAuth(undefined);
      ownerConnection.current = undefined;
    }
  }, [connectionString]);
  React.useEffect(() => {
    if (ownerAuth && accountMetadata && ownerAuth.accountName !== accountMetadata.accountName) {
      setOwnerAuth(undefined);
    }
  }, [ownerAuth, accountMetadata]);
  const management = useTrialManagement({
    enabled: authType === AuthType.ConnectionString && accountMetadata?.apiKind === ApiKind.SQL,
    connectionString,
    accountName: accountMetadata?.accountName,
    backendEndpoint: configContext.PORTAL_BACKEND_ENDPOINT,
    ownerAuth,
    onAuthRejected: () => setOwnerAuth(undefined),
  });

  const connectWithConnectionString = React.useCallback(
    (connStr: string) => {
      if (!connStr || authType) {
        return;
      }
      setConnectionString(connStr);
      if (isResourceTokenConnectionString(connStr)) {
        setAuthType(AuthType.ResourceToken);
        return;
      }

      const metadata = parseConnectionString(connStr);
      if (metadata && isDirectConnectionStringLoginApi(metadata.apiKind)) {
        // SQL, Table, and Gremlin sign data-plane requests client-side with the account key, so we skip
        // the Portal Backend proxy and use the metadata derived from the connection string directly.
        setAccountMetadata(metadata);
        setAuthType(AuthType.ConnectionString);
        return;
      }

      fetchEncryptedToken(connStr)
        .then((token) => {
          setEncryptedToken(token);
          setAuthType(AuthType.ConnectionString);
        })
        .catch(async (error) => {
          logError(
            `Failed to connect with connection string: ${await (error as Response).text()}`,
            "HostedExplorer/connectWithConnectionString",
          );
        });
    },
    [authType],
  );

  // Listen for connection string sent via postMessage (from TryCosmosDB)
  React.useEffect(() => {
    const MSG_READY = "tryCosmosDBReady";
    const MSG_CONNECTION_STRING = "tryCosmosDBConnectionString";

    // Signal to the opener that we are ready to receive a connection string
    if (window.opener) {
      try {
        for (const origin of allowedHostedExplorerEndpoints) {
          window.opener.postMessage({ type: MSG_READY }, origin);
        }
      } catch {
        // opener may be cross-origin, ignore
      }
    }

    const handler = (event: MessageEvent) => {
      if (!allowedHostedExplorerEndpoints.includes(event.origin)) {
        return;
      }
      if (event.data?.type === MSG_CONNECTION_STRING) {
        const connStr: string = event.data.connectionString;
        const metadata = typeof connStr === "string" ? parseConnectionString(connStr) : undefined;
        if (metadata) {
          if (
            metadata.apiKind === ApiKind.SQL &&
            !authType &&
            window.opener &&
            event.source === window.opener &&
            isTrialOwnerAuth(event.data.ownerAuth)
          ) {
            const auth = event.data.ownerAuth;
            ownerConnection.current = connStr;
            setOwnerAuth({
              provider: auth.provider,
              token: auth.token,
              expiresAt: auth.expiresAt,
              accountName: auth.accountName,
              resourceGroupName: auth.resourceGroupName,
              backendEndpoint: auth.backendEndpoint,
            });
          }
          connectWithConnectionString(connStr);
        }
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [connectWithConnectionString, authType]);

  React.useEffect(() => {
    // If ref.current is undefined no iframe has been rendered
    if (ref.current) {
      // In hosted mode, we can set global properties directly on the child iframe.
      // This is not possible in the portal where the iframes have different origins
      const frameWindow = ref.current.contentWindow as HostedExplorerChildFrame;

      if (authType === AuthType.EncryptedToken) {
        frameWindow.hostedConfig = {
          authType: AuthType.EncryptedToken,
          encryptedToken,
          encryptedTokenMetadata: accountMetadata,
        };
      } else if (authType === AuthType.ConnectionString) {
        frameWindow.hostedConfig = {
          authType: AuthType.ConnectionString,
          encryptedToken,
          encryptedTokenMetadata: accountMetadata,
          masterKey: extractMasterKeyFromDirectLoginConnectionString(connectionString),
        };
      } else if (authType === AuthType.ResourceToken) {
        frameWindow.hostedConfig = {
          authType: AuthType.ResourceToken,
          resourceToken: connectionString,
        };
      } else if (isLoggedIn && !connectionString) {
        frameWindow.hostedConfig = {
          authType: AuthType.AAD,
          databaseAccount,
          authorizationToken: armToken,
        };
      }
    }
  });

  const showExplorer =
    (config && isLoggedIn && databaseAccount && !connectionString) ||
    accountMetadata ||
    (authType === AuthType.ResourceToken && connectionString);

  return (
    <>
      <header>
        <div className={`items${management.resource || management.error ? " hasTrialControls" : ""}`} role="menubar">
          <div className="cosmosDBTitle">
            <span
              className="title"
              onClick={() => window.open("https://portal.azure.com", "_blank")}
              tabIndex={0}
              title="Go to Azure Portal"
            >
              Microsoft Azure
            </span>
            <span className="accontSplitter" /> <span className="serviceTitle">Cosmos DB</span>
            {(isLoggedIn || accountMetadata?.accountName) && (
              <img className="chevronRight" src={ChevronRight} alt="account separator" />
            )}
            {isLoggedIn && !connectionString && (
              <span className="accountSwitchComponentContainer">
                <AccountSwitcher armToken={armToken} setDatabaseAccount={setDatabaseAccount} />
              </span>
            )}
            {(!isLoggedIn || connectionString) && accountMetadata?.accountName && (
              <span className="accountSwitchComponentContainer">
                <span className="accountNameHeader">{accountMetadata?.accountName}</span>
              </span>
            )}
          </div>
          <TrialControls management={management} />
          <FeedbackCommandButton />
          <div className="meControl">
            {isLoggedIn ? (
              <MeControl {...{ graphToken, openPanel, logout, account }} />
            ) : (
              <SignInButton {...{ login }} />
            )}
          </div>
        </div>
      </header>
      {showExplorer && (
        // Ideally we would import and render data explorer like any other React component, however
        // because it still has a significant amount of Knockout code, this would lead to memory leaks.
        // Knockout does not have a way to tear down all of its binding and listeners with a single method.
        // It's possible this can be changed once all knockout code has been removed.
        <iframe
          // Setting key is needed so React will re-render this element on any account change
          key={authType ? `${authType}-${accountMetadata?.accountName || connectionString}` : databaseAccount?.id}
          ref={ref}
          data-test="DataExplorerFrame"
          id="explorerMenu"
          name="explorer"
          className="iframe"
          title="explorer"
          src="explorer.html?v=1.0.1&platform=Hosted"
        ></iframe>
      )}
      {!accountMetadata && !isLoggedIn && (
        <ConnectExplorer
          {...{
            login,
            setEncryptedToken,
            setAuthType,
            connectionString,
            setConnectionString,
            setAccountMetadata,
          }}
        />
      )}
      {isLoggedIn && authFailure && <AadAuthorizationFailure {...{ authFailure }} />}
      {isLoggedIn && !authFailure && (
        <DirectoryPickerPanel {...{ isOpen, dismissPanel, armToken, tenantId, switchTenant }} />
      )}
    </>
  );
};

export { App };

const appElement = document.getElementById("App");
if (appElement) {
  render(<App />, appElement);
}
