import { Configuration, PublicClientApplication } from "@azure/msal-browser";
import { AuthenticatedTemplate, MsalProvider, UnauthenticatedTemplate, useMsal } from "@azure/msal-react";
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
import { AccountSwitchComponent } from "./Explorer/Controls/AccountSwitch/AccountSwitchComponent";
import { CommandButtonComponent } from "./Explorer/Controls/CommandButton/CommandButtonComponent";
import { DefaultDirectoryDropdownComponent } from "./Explorer/Controls/Directory/DefaultDirectoryDropdownComponent";
import { DirectoryListComponent } from "./Explorer/Controls/Directory/DirectoryListComponent";
import "./Explorer/Menus/NavBar/MeControlComponent.less";
import { useGraphPhoto } from "./hooks/useGraphPhoto";
import { ConnectScreen } from "./Platform/Hosted/ConnectScreen";
import "./Shared/appInsights";
import { useAADAccount } from "./hooks/useAADAccount";

initializeIcons();

// MSAL configuration
const configuration: Configuration = {
  auth: {
    clientId: "203f1145-856a-4232-83d4-a43568fba23d",
    redirectUri: "https://localhost:1234/hostedExplorer.html",
    authority: "https://login.windows-ppe.net/common"
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false
  }
};

// const configuration: Configuration = {
//   auth: {
//     clientId: "b4d07291-7936-4c8e-b413-f58b6d1c67e8",
//     redirectUri: "https://localhost:1234/hostedExplorer.html",
//     authority: "https://login.microsoftonline.com/907765e9-1846-4d84-ad7f-a2f5030ef5ba"
//   },
//   cache: {
//     cacheLocation: "sessionStorage"
//   }
// };

const application = new PublicClientApplication(configuration);

const App: React.FunctionComponent = () => {
  const [isOpen, { setTrue: openPanel, setFalse: dismissPanel }] = useBoolean(false);
  const { instance } = useMsal();
  const account = useAADAccount();
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
              instance.logout();
            }}
          >
            Sign out
          </div>
        )
      }
    ]
  };
  const personaProps = {};

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
            <img className="chevronRight" src={ChevronRight} alt="account separator" />
            <span className="accountSwitchComponentContainer">
              {/* <AccountSwitchComponent /> */}
              <span className="accountNameHeader">REPLACE ME - Connection string mode</span>;
            </span>
          </div>
          <div className="feedbackConnectSettingIcons">
            <AuthenticatedTemplate>
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
            </AuthenticatedTemplate>
            <UnauthenticatedTemplate>
              <CommandButtonComponent
                id="commandbutton-feedback"
                iconSrc={FeedbackIcon}
                iconAlt="feeback button"
                onCommandClick={() =>
                  window.open(
                    "https://aka.ms/cosmosdbfeedback?subject=Cosmos%20DB%20Hosted%20Data%20Explorer%20Feedback"
                  )
                }
                ariaLabel="feeback button"
                tooltipText="Send feedback"
                hasPopup={true}
                disabled={false}
              />
            </UnauthenticatedTemplate>
          </div>
          <div className="meControl">
            <AuthenticatedTemplate>
              <FocusZone>
                <DefaultButton {...buttonProps}>
                  <Persona
                    imageUrl={photo}
                    text={account?.name}
                    secondaryText={account?.username}
                    showSecondaryText={true}
                    showInitialsUntilImageLoads={true}
                    initialsColor={PersonaInitialsColor.teal}
                    size={PersonaSize.size28}
                    className="mecontrolHeaderPersona"
                  />
                </DefaultButton>
              </FocusZone>
            </AuthenticatedTemplate>
            <UnauthenticatedTemplate>
              <DefaultButton
                className="mecontrolSigninButton"
                text="Sign In"
                onClick={() => {
                  instance.loginPopup({
                    scopes: ["https://graph.microsoft-ppe.com/" + "/.default"],
                    redirectUri: "https://localhost:1234/hostedExplorer.html"
                  });
                }}
                styles={{
                  rootHovered: { backgroundColor: "#393939", color: "#fff" },
                  rootFocused: { backgroundColor: "#393939", color: "#fff" },
                  rootPressed: { backgroundColor: "#393939", color: "#fff" }
                }}
              />
            </UnauthenticatedTemplate>
          </div>
        </div>
      </header>
      <AuthenticatedTemplate>
        <p>LOGGED IN!</p>
        {/* <iframe
          id="explorerMenu"
          name="explorer"
          className="iframe"
          title="explorer"
          src="explorer.html?v=1.0.1&platform=Portal"
        ></iframe> */}
      </AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <ConnectScreen />
      </UnauthenticatedTemplate>
      <ConnectScreen />
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
  <MsalProvider instance={application}>
    <App />
  </MsalProvider>,
  document.body
);
