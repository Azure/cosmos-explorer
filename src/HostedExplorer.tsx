import { Configuration, PublicClientApplication } from "@azure/msal-browser";
import { AuthenticatedTemplate, MsalProvider, UnauthenticatedTemplate } from "@azure/msal-react";
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
import "../less/hostedexplorer.less";
import { CommandButtonComponent } from "./Explorer/Controls/CommandButton/CommandButtonComponent";
import { DefaultDirectoryDropdownComponent } from "./Explorer/Controls/Directory/DefaultDirectoryDropdownComponent";
import { DirectoryListComponent } from "./Explorer/Controls/Directory/DirectoryListComponent";
import "./Explorer/Menus/NavBar/MeControlComponent.less";
import { useGraphProfile } from "./hooks/useGraphProfile";
import "./Shared/appInsights";

initializeIcons();

// MSAL configuration
const configuration: Configuration = {
  auth: {
    clientId: "e8ae3d28-de2a-4dc8-8fa3-2d2998b1c38f",
    redirectUri: "https://localhost:1234/hostedExplorer.html",
    authority: "https://login.microsoftonline.com/72f988bf-86f1-41af-91ab-2d7cd011db47"
  }
};

const application = new PublicClientApplication(configuration);

const App: React.FunctionComponent = () => {
  const [isOpen, { setTrue: openPanel, setFalse: dismissPanel }] = useBoolean(false);
  const { graphData, photo } = useGraphProfile();

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
              data-bind="click: openAzurePortal, event: { keypress: onOpenAzurePortalKeyPress }"
              tabIndex={0}
              title="Go to Azure Portal"
            >
              Microsoft Azure
            </span>
            <span className="accontSplitter" /> <span className="serviceTitle">Cosmos DB</span>
            <img
              className="chevronRight"
              src="/chevron-right.svg"
              alt="account separator"
              data-bind="visible: isAccountActive"
            />
            <span
              className="accountSwitchComponentContainer"
              data-bind="react: accountSwitchComponentAdapter, visible: isAccountActive"
            />
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
                    text={graphData?.displayName}
                    secondaryText={graphData?.displayName}
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
                  instance.loginPopup();
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
      {/* <iframe
        id="explorerMenu"
        name="explorer"
        className="iframe"
        title="explorer"
        src="explorer.html?v=1.0.1&platform=Hosted"
        data-bind="visible: navigationSelection() === 'explorer'"
      ></iframe> */}
      <div data-bind="react: firewallWarningComponentAdapter" />
      <div data-bind="react: dialogComponentAdapter" />
      <Panel
        headerText="Select Directory"
        isOpen={!isOpen}
        onDismiss={dismissPanel}
        // You MUST provide this prop! Otherwise screen readers will just say "button" with no label.
        closeButtonAriaLabel="Close"
      >
        <div className="directoryDropdownContainer">
          <DefaultDirectoryDropdownComponent />
        </div>
        <div className="directoryDivider" />
        <div className="directoryListContainer">
          <DirectoryListComponent />
        </div>
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
