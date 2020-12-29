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
import * as Msal from "msal";
import { fetchMe } from "./hooks/useGraphProfile";
import { fetchSubscriptions } from "./hooks/useSubscriptions";

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

// const application = new PublicClientApplication(configuration);

const msal = new Msal.UserAgentApplication({
  auth: {
    authority: "https://login.microsoft.com/common",
    clientId: "203f1145-856a-4232-83d4-a43568fba23d",
    redirectUri: "https://dataexplorer-dev.azurewebsites.net"
  }
});

// msal.handleRedirectCallback((error, response) => {
//   console.log(error, response);
//   debugger;
//   // handle redirect response or error
// });

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
                  msal.loginPopup().then(foo => {
                    msal.acquireTokenSilent({ scopes: ["https://graph.windows.net//.default"] }).then(bar => {
                      debugger;
                      // const token =
                      //   "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IjVPZjlQNUY5Z0NDd0NtRjJCT0hIeEREUS1EayIsImtpZCI6IjVPZjlQNUY5Z0NDd0NtRjJCT0hIeEREUS1EayJ9.eyJhdWQiOiJodHRwczovL21hbmFnZW1lbnQuYXp1cmUuY29tLyIsImlzcyI6Imh0dHBzOi8vc3RzLndpbmRvd3MubmV0LzcyZjk4OGJmLTg2ZjEtNDFhZi05MWFiLTJkN2NkMDExZGI0Ny8iLCJpYXQiOjE2MDkyMDYwNDQsIm5iZiI6MTYwOTIwNjA0NCwiZXhwIjoxNjA5MjA5OTQ0LCJhY3IiOiIxIiwiYWlvIjoiQVpRQWEvOFNBQUFBYzZ3RmNHOWRDYTRDS2tXL2YxdnM5b3Z2Y0tqN3NLazJqc3c5MG1MRlJkclJLelZ3cnJpS0hMNXBua0tFejVlQWlXYTRwd2JHNXdKY240dkpLVUpXb2JGdmdkVXhteWd4NGlxOXk1Z0l6TW9zM25DRGdodCtxa3lyVGlrVzJ0WTA0amRLeFA2Q2wzWm10UzYxMmhmdkFkQVRBZ3Arc0w1TUdzU05KcElUR1dBZ1RKZXZ4c1dHek5Sb2hPOXdWVUN4IiwiYW1yIjpbInB3ZCIsInJzYSIsIm1mYSJdLCJhcHBpZCI6IjIwM2YxMTQ1LTg1NmEtNDIzMi04M2Q0LWE0MzU2OGZiYTIzZCIsImFwcGlkYWNyIjoiMCIsImRldmljZWlkIjoiMzI3NjNiYjktMDNlNS00ZDBkLTliZmEtZmEyY2U5OGQ1ZGVlIiwiZmFtaWx5X25hbWUiOiJGYXVsa25lciIsImdpdmVuX25hbWUiOiJTdGV2ZSIsImhhc2dyb3VwcyI6InRydWUiLCJpcGFkZHIiOiI0NS4yMi4xMjIuMjIwIiwibmFtZSI6IlN0ZXZlIEZhdWxrbmVyIiwib2lkIjoiN2M4Yjk4ZGItOTA3OC00NGM3LWE5YWItYzJiOGYxOGRiZDM2Iiwib25wcmVtX3NpZCI6IlMtMS01LTIxLTIxMjc1MjExODQtMTYwNDAxMjkyMC0xODg3OTI3NTI3LTMyMjM1ODIxIiwicHVpZCI6IjEwMDM3RkZFQUJDNTk0QjYiLCJyaCI6IjAuQVJvQXY0ajVjdkdHcjBHUnF5MTgwQkhiUjBVUlB5QnFoVEpDZzlTa05XajdvajBhQUprLiIsInNjcCI6InVzZXJfaW1wZXJzb25hdGlvbiIsInN1YiI6InNJV3JwSTFoQVNUWXJoUFVrYWp1NUtQb3Z6SHdzUkdnOTN3U2t1OEs0aW8iLCJ0aWQiOiI3MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDciLCJ1bmlxdWVfbmFtZSI6InN0ZmF1bEBtaWNyb3NvZnQuY29tIiwidXBuIjoic3RmYXVsQG1pY3Jvc29mdC5jb20iLCJ1dGkiOiJ2ME0xNVdjSWkwcVpwNTdEd1QwSUFnIiwidmVyIjoiMS4wIiwieG1zX3RjZHQiOjEyODkyNDE1NDd9.WD_NlNg2C9rOeES_zRDEIn9MQaNTElyd1NjmQ89dGg8PxCurhZpnuSNmv6J8KuAaiVtifppu64zP5nPDouAsdq5lWrJ5N6WZE9Aox0RuVMqoQRTYEYSeC0R-2wh_77G77zPHVq2qMTOHKz60_Que6_T5VTOFsNpfPzRQwqXmnIvUZnKqf6cBvxLyJYE2IsXSuOdB7jDNWfnsGv19Ew7IdScS4PoIrsVGX5E7rQ4B_bUoYm74ooiH8W0TmVXah21Z66fVAEzuWYlIX5G6ylmT9ncDefVon5JKKe5ksN5GrNjPpVVm3tyCwJeRO_zmtd7nqOZ6GLrn5hzR4CpKB63Fng";
                      fetchMe(bar.accessToken).then(resp => {
                        debugger;
                      });
                    });
                    // msal.acquireTokenSilent({ scopes: ["https://graph.windows.net//.default"] }).then(bar => {
                    //   debugger;
                    // });
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

render(<App />, document.body);
