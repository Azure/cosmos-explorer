import "./Platform/Hosted/ConnectScreen.less";
import { useBoolean } from "@uifabric/react-hooks";
import {
  DefaultButton,
  DirectionalHint,
  FocusZone,
  initializeIcons,
  Panel,
  PanelType,
  Persona,
  PersonaInitialsColor,
  PersonaSize,
  ChoiceGroup
} from "office-ui-fabric-react";
import * as React from "react";
import { render } from "react-dom";
import FeedbackIcon from "../images/Feedback.svg";
import ChevronRight from "../images/chevron-right.svg";
import "../less/hostedexplorer.less";
import { CommandButtonComponent } from "./Explorer/Controls/CommandButton/CommandButtonComponent";
import "./Explorer/Menus/NavBar/MeControlComponent.less";
import { useGraphPhoto } from "./hooks/useGraphPhoto";
import "./Shared/appInsights";
import { AccountSwitchComponent } from "./Explorer/Controls/AccountSwitch/AccountSwitchComponent";
import { usePortalAccessToken } from "./hooks/usePortalAccessToken";
import { useDirectories } from "./hooks/useDirectories";
import * as Msal from "msal";
import { configContext } from "./ConfigContext";
import { HttpHeaders } from "./Common/Constants";
import { GenerateTokenResponse, DatabaseAccount } from "./Contracts/DataModels";
import { AuthType } from "./AuthType";

initializeIcons();

const msal = new Msal.UserAgentApplication({
  cache: {
    cacheLocation: "localStorage"
  },
  auth: {
    authority: "https://login.microsoft.com/common",
    clientId: "203f1145-856a-4232-83d4-a43568fba23d",
    redirectUri: "https://dataexplorer-dev.azurewebsites.net" // TODO! This should only be set in development
  }
});

interface HostedExplorerChildFrame extends Window {
  authType: AuthType;
  databaseAccount: DatabaseAccount;
  authorizationToken: string;
}

const cachedAccount = msal.getAllAccounts()?.[0];
const cachedTenantId = localStorage.getItem("cachedTenantId");

const App: React.FunctionComponent = () => {
  // Hooks for handling encrypted portal tokens
  const params = new URLSearchParams(window.location.search);
  const [encryptedToken, setEncryptedToken] = React.useState<string>(params && params.get("key"));
  const encryptedTokenMetadata = usePortalAccessToken(encryptedToken);

  // Hooks for showing/hiding UI
  const [isOpen, { setTrue: openPanel, setFalse: dismissPanel }] = useBoolean(false);
  const [isConnectionStringVisible, { setTrue: showConnectionString }] = useBoolean(false);

  // Hooks for AAD authentication
  const [isLoggedIn, { setTrue: setLoggedIn, setFalse: setLoggedOut }] = useBoolean(
    Boolean(cachedAccount && cachedTenantId) || false
  );
  const [account, setAccount] = React.useState<Msal.Account>(cachedAccount);
  const [tenantId, setTenantId] = React.useState<string>(cachedTenantId);
  const [graphToken, setGraphToken] = React.useState<string>();
  const [armToken, setArmToken] = React.useState<string>();
  const [connectionString, setConnectionString] = React.useState<string>("");
  const [databaseAccount, setDatabaseAccount] = React.useState<DatabaseAccount>();

  const ref = React.useRef<HTMLIFrameElement>();

  const login = React.useCallback(async () => {
    const response = await msal.loginPopup();
    setLoggedIn();
    setAccount(response.account);
    setTenantId(response.tenantId);
    localStorage.setItem("cachedTenantId", response.tenantId);
  }, []);

  const logout = React.useCallback(() => {
    setLoggedOut();
    localStorage.removeItem("cachedTenantId");
    msal.logout();
  }, []);

  React.useEffect(() => {
    if (account && tenantId) {
      Promise.all([
        msal.acquireTokenSilent({
          scopes: ["https://graph.windows.net//.default"]
        }),
        msal.acquireTokenSilent({
          scopes: ["https://management.azure.com//.default"]
        })
      ]).then(([graphTokenResponse, armTokenResponse]) => {
        setGraphToken(graphTokenResponse.accessToken);
        setArmToken(armTokenResponse.accessToken);
      });
    }
  }, [account, tenantId]);

  React.useEffect(() => {
    // If ref.current is undefined no iframe has been rendered
    if (ref.current) {
      const frameWindow = ref.current.contentWindow as HostedExplorerChildFrame;
      frameWindow.authType = AuthType.AAD;
      frameWindow.databaseAccount = databaseAccount;
      frameWindow.authorizationToken = armToken;
      // const frameWindow = ref.current.contentWindow;
      // frameWindow.authType = AuthType.EncryptedToken;
      // frameWindow.encryptedToken = encryptedToken;
      // frameWindow.encryptedTokenMetadata = encryptedTokenMetadata;
      // frameWindow.parsedConnectionString = "foo";
    }
  }, [ref, encryptedToken, encryptedTokenMetadata, isLoggedIn, databaseAccount]);

  const photo = useGraphPhoto(graphToken);
  const directories = useDirectories(armToken);

  return (
    <div>
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
                <AccountSwitchComponent armToken={armToken} setDatabaseAccount={setDatabaseAccount} />
              </span>
            )}
            {!isLoggedIn && encryptedTokenMetadata?.accountName && (
              <span className="accountSwitchComponentContainer">
                <span className="accountNameHeader">{encryptedTokenMetadata?.accountName}</span>
              </span>
            )}
          </div>
          <div className="feedbackConnectSettingIcons">
            <CommandButtonComponent
              id="commandbutton-feedback"
              iconSrc={FeedbackIcon}
              iconAlt="feeback button"
              onCommandClick={() =>
                window.open("https://aka.ms/cosmosdbfeedback?subject=Cosmos%20DB%20Hosted%20Data%20Explorer%20Feedback")
              }
              ariaLabel="feeback button"
              tooltipText="Send feedback"
              hasPopup={true}
              disabled={false}
            />
          </div>
          <div className="meControl">
            {isLoggedIn ? (
              <FocusZone>
                <DefaultButton
                  id="mecontrolHeader"
                  className="mecontrolHeaderButton"
                  menuProps={{
                    className: "mecontrolContextualMenu",
                    isBeakVisible: false,
                    directionalHintFixed: true,
                    directionalHint: DirectionalHint.bottomRightEdge,
                    calloutProps: {
                      minPagePadding: 0
                    },
                    items: [
                      {
                        key: "SwitchDirectory",
                        text: "Switch Directory",
                        onClick: openPanel
                      },
                      {
                        key: "SignOut",
                        text: "Sign Out",
                        onClick: logout
                      }
                    ]
                  }}
                  styles={{
                    rootHovered: { backgroundColor: "#393939" },
                    rootFocused: { backgroundColor: "#393939" },
                    rootPressed: { backgroundColor: "#393939" },
                    rootExpanded: { backgroundColor: "#393939" }
                  }}
                >
                  <Persona
                    imageUrl={photo}
                    text={account?.name}
                    secondaryText={account?.userName}
                    showSecondaryText={true}
                    showInitialsUntilImageLoads={true}
                    initialsColor={PersonaInitialsColor.teal}
                    size={PersonaSize.size28}
                    className="mecontrolHeaderPersona"
                  />
                </DefaultButton>
              </FocusZone>
            ) : (
              <DefaultButton
                className="mecontrolSigninButton"
                text="Sign In"
                onClick={login}
                styles={{
                  rootHovered: { backgroundColor: "#393939", color: "#fff" },
                  rootFocused: { backgroundColor: "#393939", color: "#fff" },
                  rootPressed: { backgroundColor: "#393939", color: "#fff" }
                }}
              />
            )}
          </div>
        </div>
      </header>
      {databaseAccount && (
        // Ideally we would import and render data explorer like any other React component, however
        // because it still has a significant amount of Knockout code, this would lead to memory leaks.
        // Knockout does not have a way to tear down all of its binding and listeners with a single method.
        // It's possible this can be changed once all knockout code has been removed.
        <iframe
          // Setting key is needed so React will re-render this element on any account change
          key={databaseAccount.id}
          ref={ref}
          id="explorerMenu"
          name="explorer"
          className="iframe"
          title="explorer"
          src="explorer.html?v=1.0.1&platform=Hosted"
        ></iframe>
      )}
      {!isLoggedIn && !encryptedTokenMetadata && (
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
                  <p className="connectExplorerContent connectStringText">
                    Connect to your account with connection string
                  </p>
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
      )}
      <div data-bind="react: firewallWarningComponentAdapter" />
      <div data-bind="react: dialogComponentAdapter" />
      <Panel
        type={PanelType.medium}
        headerText="Select Directory"
        isOpen={isOpen}
        onDismiss={dismissPanel}
        closeButtonAriaLabel="Close"
      >
        <ChoiceGroup
          options={directories.map(dir => ({ key: dir.tenantId, text: `${dir.displayName} (${dir.tenantId})` }))}
          selectedKey={tenantId}
          onChange={async () => {
            dismissPanel();
            // TODO!!! This does not work. Still not sure why. Tried lots of stuff.
            // const response = await msal.loginPopup({
            //   authority: `https://login.microsoftonline.com/${option.key}`
            // });
            // // msal = new Msal.UserAgentApplication({
            // //   auth: {
            // //     authority: `https://login.microsoftonline.com/${option.key}`,
            // //     clientId: "203f1145-856a-4232-83d4-a43568fba23d",
            // //     redirectUri: "https://dataexplorer-dev.azurewebsites.net" // TODO! This should only be set in development
            // //   }
            // // });
            // setTenantId(option.key);
            // setAccount(response.account);
            // console.log(account);
          }}
        />
      </Panel>
    </div>
  );
};

render(<App />, document.getElementById("App"));
