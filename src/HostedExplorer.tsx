import "./Platform/Hosted/ConnectScreen.less";
import { useBoolean } from "@uifabric/react-hooks";
import {
  DefaultButton,
  DirectionalHint,
  FocusZone,
  initializeIcons,
  Panel,
  Persona,
  PersonaInitialsColor,
  PersonaSize
} from "office-ui-fabric-react";
import * as React from "react";
import { render } from "react-dom";
import FeedbackIcon from "../images/Feedback.svg";
import ConnectIcon from "../images/HostedConnectwhite.svg";
import ChevronRight from "../images/chevron-right.svg";
import "../less/hostedexplorer.less";
import { CommandButtonComponent } from "./Explorer/Controls/CommandButton/CommandButtonComponent";
import "./Explorer/Menus/NavBar/MeControlComponent.less";
import { useGraphPhoto } from "./hooks/useGraphPhoto";
import "./Shared/appInsights";
import { AccountSwitchComponent } from "./Explorer/Controls/AccountSwitch/AccountSwitchComponent";
import { AuthContext, AuthProvider } from "./contexts/authContext";

initializeIcons();

const App: React.FunctionComponent = () => {
  const [isOpen, { setTrue: openPanel, setFalse: dismissPanel }] = useBoolean(false);
  const { isLoggedIn, login, account, logout } = React.useContext(AuthContext);
  const [isConnectionStringVisible, { setTrue: showConnectionString }] = useBoolean(false);
  const photo = useGraphPhoto();

  const menuProps = {
    className: "mecontrolContextualMenu",
    isBeakVisible: false,
    directionalHintFixed: true,
    directionalHint: DirectionalHint.bottomRightEdge,
    calloutProps: {
      minPagePadding: 0
    },
    items: [
      {
        key: "Persona",
        onRender: () => <Persona />
      },
      {
        key: "SwitchDirectory",
        onRender: () => (
          <div className="switchDirectoryLink" onClick={() => openPanel}>
            Switch Directory
          </div>
        )
      },
      {
        key: "SignOut",
        onRender: () => (
          <div
            className="signOutLink"
            onClick={() => {
              logout();
            }}
          >
            Sign out
          </div>
        )
      }
    ]
  };

  // {
  //   id: "commandbutton-settings",
  //   iconSrc: SettingsIcon,
  //   iconAlt: "setting button",
  //   onCommandClick: () => {},
  //   commandButtonLabel: undefined,
  //   ariaLabel: "setting button",
  //   tooltipText: "Global settings",
  //   hasPopup: true,
  //   disabled: false
  // },
  // {
  //   id: "commandbutton-feedback",
  //   iconSrc: FeedbackIcon,
  //   iconAlt: "feeback button",
  //   onCommandClick: () =>
  //     window.open(
  //       "https://aka.ms/cosmosdbfeedback?subject=Cosmos%20DB%20Hosted%20Data%20Explorer%20Feedback"
  //     ),
  //   commandButtonLabel: undefined,
  //   ariaLabel: "feeback button",
  //   tooltipText: "Send feedback",
  //   hasPopup: true,
  //   disabled: false
  // }

  const buttonProps = {
    id: "mecontrolHeader",
    className: "mecontrolHeaderButton",
    menuProps: menuProps,
    onRenderMenuIcon: () => <span />,
    styles: {
      rootHovered: { backgroundColor: "#393939" },
      rootFocused: { backgroundColor: "#393939" },
      rootPressed: { backgroundColor: "#393939" },
      rootExpanded: { backgroundColor: "#393939" }
    }
  };

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
            {isLoggedIn && <img className="chevronRight" src={ChevronRight} alt="account separator" />}
            {isLoggedIn && (
              <span className="accountSwitchComponentContainer">
                <AccountSwitchComponent />
                <span className="accountNameHeader">REPLACE ME - Connection string mode</span>;
              </span>
            )}
          </div>
          <div className="feedbackConnectSettingIcons">
            {isLoggedIn && (
              <CommandButtonComponent
                id="commandbutton-connect"
                iconSrc={ConnectIcon}
                iconAlt="connect button"
                onCommandClick={() => {}}
                ariaLabel="connect button"
                tooltipText="Connect to a Cosmos DB account"
                hasPopup={true}
                disabled={false}
              />
            )}
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
                <DefaultButton {...buttonProps}>
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
      {isLoggedIn ? (
        <p>LOGGED IN!</p>
      ) : (
        <div id="connectExplorer" className="connectExplorerContainer" style={{ display: "flex" }}>
          <div className="connectExplorerFormContainer">
            <div className="connectExplorer">
              <p className="connectExplorerContent">
                <img src="images/HdeConnectCosmosDB.svg" alt="Azure Cosmos DB" />
              </p>
              <p className="welcomeText">Welcome to Azure Cosmos DB</p>
              {isConnectionStringVisible ? (
                <form id="connectWithConnectionString">
                  <p className="connectExplorerContent connectStringText">
                    Connect to your account with connection string
                  </p>
                  <p className="connectExplorerContent">
                    <input className="inputToken" type="text" required placeholder="Please enter a connection string" />
                    <span className="errorDetailsInfoTooltip" style={{ display: "none" }}>
                      <img className="errorImg" src="images/error.svg" alt="Error notification" />
                      <span className="errorDetails" />
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
      {/* <iframe
          id="explorerMenu"
          name="explorer"
          className="iframe"
          title="explorer"
          src="explorer.html?v=1.0.1&platform=Portal"
        ></iframe> */}
      <div data-bind="react: firewallWarningComponentAdapter" />
      <div data-bind="react: dialogComponentAdapter" />
      <Panel headerText="Select Directory" isOpen={isOpen} onDismiss={dismissPanel} closeButtonAriaLabel="Close">
        {/* <div className="directoryDropdownContainer">
          <DefaultDirectoryDropdownComponent />
        </div>
        <div className="directoryDivider" />
        <div className="directoryListContainer">
          <DirectoryListComponent />
        </div> */}
      </Panel>
    </div>
  );
};

render(
  <AuthProvider>
    <App />
  </AuthProvider>,
  document.body
);
