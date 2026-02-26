import { initializeIcons } from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import { MessageTypes } from "Contracts/MessageTypes";
import { AadAuthorizationFailure } from "Platform/Hosted/Components/AadAuthorizationFailure";
import * as React from "react";
import { render } from "react-dom";
import ChevronRight from "../images/chevron-right.svg";
import "../less/hostedexplorer.less";
import { AuthType } from "./AuthType";
import { DatabaseAccount } from "./Contracts/DataModels";
import "./Explorer/Menus/NavBar/MeControlComponent.less";
import { HostedExplorerChildFrame } from "./HostedExplorerChildFrame";
import { AccountSwitcher } from "./Platform/Hosted/Components/AccountSwitcher";
import { ConnectExplorer } from "./Platform/Hosted/Components/ConnectExplorer";
import { DirectoryPickerPanel } from "./Platform/Hosted/Components/DirectoryPickerPanel";
import { FeedbackCommandButton } from "./Platform/Hosted/Components/FeedbackCommandButton";
import { MeControl } from "./Platform/Hosted/Components/MeControl";
import { SignInButton } from "./Platform/Hosted/Components/SignInButton";
import "./Platform/Hosted/ConnectScreen.less";
import { extractMasterKeyfromConnectionString } from "./Platform/Hosted/HostedUtils";
import "./Shared/appInsights";
import { useAADAuth } from "./hooks/useAADAuth";
import { useConfig } from "./hooks/useConfig";
import { useTokenMetadata } from "./hooks/usePortalAccessToken";
import { THEME_MODE_DARK, useThemeStore } from "./hooks/useTheme";

initializeIcons();

if (typeof window !== "undefined") {
  window.addEventListener("message", (event) => {
    const messageData = event.data?.data || event.data;
    const messageType = messageData?.type;

    if (messageType === MessageTypes.UpdateTheme) {
      const themeData = messageData?.params?.theme || messageData?.theme;
      if (themeData && themeData.mode !== undefined) {
        const isDark = themeData.mode === THEME_MODE_DARK;
        useThemeStore.setState({
          isDarkMode: isDark,
          themeMode: themeData.mode,
        });
        if (isDark) {
          document.body.classList.add("isDarkMode");
        } else {
          document.body.classList.remove("isDarkMode");
        }
      }
    }
  });
}

const App: React.FunctionComponent = () => {
  // For handling encrypted portal tokens sent via query paramter
  const params = new URLSearchParams(window.location.search);
  const [encryptedToken, setEncryptedToken] = React.useState<string>(params && params.get("key"));
  const encryptedTokenMetadata = useTokenMetadata(encryptedToken);

  // For showing/hiding panel
  const [isOpen, { setTrue: openPanel, setFalse: dismissPanel }] = useBoolean(false);
  const config = useConfig();
  const { isLoggedIn, armToken, graphToken, account, tenantId, logout, login, switchTenant, authFailure } =
    useAADAuth(config);

  const [databaseAccount, setDatabaseAccount] = React.useState<DatabaseAccount>();
  const [authType, setAuthType] = React.useState<AuthType>(encryptedToken ? AuthType.EncryptedToken : undefined);
  const [connectionString, setConnectionString] = React.useState<string>();

  const ref = React.useRef<HTMLIFrameElement>();

  React.useEffect(() => {
    // If ref.current is undefined no iframe has been rendered
    if (ref.current) {
      // In hosted mode, we can set global properties directly on the child iframe.
      // This is not possible in the portal where the iframes have different origins
      const frameWindow = ref.current.contentWindow as HostedExplorerChildFrame;
      // AAD authenticated uses ALWAYS using AAD authType
      if (isLoggedIn) {
        frameWindow.hostedConfig = {
          authType: AuthType.AAD,
          databaseAccount,
          authorizationToken: armToken,
        };
      } else if (authType === AuthType.EncryptedToken) {
        frameWindow.hostedConfig = {
          authType: AuthType.EncryptedToken,
          encryptedToken,
          encryptedTokenMetadata,
        };
      } else if (authType === AuthType.ConnectionString) {
        frameWindow.hostedConfig = {
          authType: AuthType.ConnectionString,
          encryptedToken,
          encryptedTokenMetadata,
          masterKey: extractMasterKeyfromConnectionString(connectionString),
        };
      } else if (authType === AuthType.ResourceToken) {
        frameWindow.hostedConfig = {
          authType: AuthType.ResourceToken,
          resourceToken: connectionString,
        };
      }
    }
  });

  const showExplorer =
    (config && isLoggedIn && databaseAccount) ||
    (encryptedTokenMetadata && encryptedTokenMetadata) ||
    (authType === AuthType.ResourceToken && connectionString);

  return (
    <>
      <header>
        <div className="items" role="menubar">
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
            {(isLoggedIn || encryptedTokenMetadata?.accountName) && (
              <img className="chevronRight" src={ChevronRight} alt="account separator" />
            )}
            {isLoggedIn && (
              <span className="accountSwitchComponentContainer">
                <AccountSwitcher armToken={armToken} setDatabaseAccount={setDatabaseAccount} />
              </span>
            )}
            {!isLoggedIn && encryptedTokenMetadata?.accountName && (
              <span className="accountSwitchComponentContainer">
                <span className="accountNameHeader">{encryptedTokenMetadata?.accountName}</span>
              </span>
            )}
          </div>
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
          key={databaseAccount?.id || encryptedTokenMetadata?.accountName || authType}
          ref={ref}
          data-test="DataExplorerFrame"
          id="explorerMenu"
          name="explorer"
          className="iframe"
          title="explorer"
          src="explorer.html?v=1.0.1&platform=Hosted"
        ></iframe>
      )}
      {!isLoggedIn && !encryptedTokenMetadata && (
        <ConnectExplorer {...{ login, setEncryptedToken, setAuthType, connectionString, setConnectionString }} />
      )}
      {isLoggedIn && authFailure && <AadAuthorizationFailure {...{ authFailure }} />}
      {isLoggedIn && !authFailure && (
        <DirectoryPickerPanel {...{ isOpen, dismissPanel, armToken, tenantId, switchTenant }} />
      )}
    </>
  );
};

render(<App />, document.getElementById("App"));
