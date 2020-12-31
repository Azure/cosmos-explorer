import "./Platform/Hosted/ConnectScreen.less";
import { useBoolean } from "@uifabric/react-hooks";
import {
  DefaultButton,
  DetailsList,
  DirectionalHint,
  FocusZone,
  IContextualMenuProps,
  initializeIcons,
  Panel,
  PanelType,
  Persona,
  PersonaInitialsColor,
  PersonaSize,
  SelectionMode,
  Selection
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
import { usePortalAccessToken } from "./hooks/usePortalAccessToken";
import { useDirectories } from "./hooks/useDirectories";
import { AuthType } from "./AuthType";

initializeIcons();

const App: React.FunctionComponent = () => {
  const params = new URLSearchParams(window.location.search);
  const encryptedToken = params && params.get("key");
  const encryptedTokenMetadata = usePortalAccessToken(encryptedToken);
  const [isOpen, { setTrue: openPanel, setFalse: dismissPanel }] = useBoolean(false);
  const { isLoggedIn, aadlogin: login, account, aadlogout: logout, tenantId } = React.useContext(AuthContext);
  const [isConnectionStringVisible, { setTrue: showConnectionString }] = useBoolean(false);
  const photo = useGraphPhoto();
  const directories = useDirectories();
  // const [selectedItem, setSelectedItem] = React.useState<any>(undefined);
  const selection = new Selection({
    getKey: item => item.tenantId,
    items: directories,
    onSelectionChanged: () => {
      const selected = selection.getSelection()[0];
      if (selected.tenantId !== tenantId) {
        console.log("new Tenant", selected.tenantId);
      }
    },
    selectionMode: SelectionMode.single
  });
  selection.setKeySelected(tenantId, true, false);

  // private _renderPersonaComponent = (): JSX.Element => {
  //   const { user } = this.props;
  //   const personaProps: IPersonaSharedProps = {
  //     imageUrl: user.imageUrl,
  //     text: user.name,
  //     secondaryText: user.email,
  //     showSecondaryText: true,
  //     showInitialsUntilImageLoads: true,
  //     initialsColor: PersonaInitialsColor.teal,
  //     size: PersonaSize.size72,
  //     className: "mecontrolContextualMenuPersona"
  //   };

  //   return <Persona {...personaProps} />;
  // };

  const menuProps: IContextualMenuProps = {
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
    menuProps,
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
            {(isLoggedIn || encryptedTokenMetadata?.accountName) && (
              <img className="chevronRight" src={ChevronRight} alt="account separator" />
            )}
            {isLoggedIn && (
              <span className="accountSwitchComponentContainer">
                <AccountSwitchComponent />
              </span>
            )}
            {!isLoggedIn && encryptedTokenMetadata?.accountName && (
              <span className="accountSwitchComponentContainer">
                <span className="accountNameHeader">{encryptedTokenMetadata?.accountName}</span>
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
      {encryptedTokenMetadata && !isLoggedIn && (
        <iframe
          id="explorerMenu"
          name="explorer"
          className="iframe"
          title="explorer"
          src={`explorer.html?v=1.0.1&platform=Hosted&authType=${AuthType.EncryptedToken}&key=${encodeURIComponent(
            encryptedToken
          )}&metadata=${JSON.stringify(encryptedTokenMetadata)}`}
        ></iframe>
      )}
      {!encryptedTokenMetadata && isLoggedIn && (
        <iframe
          id="explorerMenu"
          name="explorer"
          className="iframe"
          title="explorer"
          src={`explorer.html?v=1.0.1&platform=Hosted&authType=${AuthType.AAD}`}
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
      <div data-bind="react: firewallWarningComponentAdapter" />
      <div data-bind="react: dialogComponentAdapter" />
      <Panel
        type={PanelType.medium}
        headerText="Select Directory"
        isOpen={isOpen}
        onDismiss={dismissPanel}
        closeButtonAriaLabel="Close"
      >
        <DetailsList
          items={selection.getItems()}
          columns={[
            {
              key: "name",
              name: "Name",
              minWidth: 200,
              maxWidth: 200,
              fieldName: "displayName"
            },
            {
              key: "id",
              name: "ID",
              minWidth: 200,
              maxWidth: 200,
              fieldName: "tenantId"
            }
          ]}
          selectionMode={SelectionMode.single}
          selection={selection}
        />
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
