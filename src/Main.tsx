// CSS Dependencies
import "bootstrap/dist/css/bootstrap.css";
import "../less/documentDB.less";
import "../less/tree.less";
import "../less/forms.less";
import "../less/menus.less";
import "../less/infobox.less";
import "../less/messagebox.less";
import "./Explorer/Controls/ErrorDisplayComponent/ErrorDisplayComponent.less";
import "./Explorer/Menus/NotificationConsole/NotificationConsole.less";
import "./Explorer/Menus/CommandBar/CommandBarComponent.less";
import "./Explorer/Menus/CommandBar/MemoryTrackerComponent.less";
import "./Explorer/Controls/CollapsiblePanel/CollapsiblePanelComponent.less";
import "./Explorer/Controls/DynamicList/DynamicListComponent.less";
import "./Explorer/Controls/JsonEditor/JsonEditorComponent.less";
import "./Explorer/Graph/GraphExplorerComponent/graphExplorer.less";
import "../less/TableStyles/queryBuilder.less";
import "../externals/jquery.dataTables.min.css";
import "../less/TableStyles/fulldatatables.less";
import "../externals/jquery.contextMenu.css";
import "../less/TableStyles/EntityEditor.less";
import "../less/TableStyles/CustomizeColumns.less";
import "../less/resourceTree.less";
import "../externals/jquery.typeahead.min.css";
import "../externals/jquery-ui.min.css";
import "../externals/jquery-ui.structure.min.css";
import "../externals/jquery-ui.theme.min.css";
import "./Explorer/Graph/NewVertexComponent/newVertexComponent.less";
import "./Explorer/Panes/GraphNewVertexPane.less";
import "./Explorer/Tabs/QueryTab.less";
import "./Explorer/Controls/TreeComponent/treeComponent.less";
import "./Explorer/Controls/Accordion/AccordionComponent.less";
import "./Explorer/SplashScreen/SplashScreenComponent.less";
import "./Explorer/Controls/Notebook/NotebookTerminalComponent.less";

// Image Dependencies
import "../images/CosmosDB_rgb_ui_lighttheme.ico";
import "../images/favicon.ico";

import "./Shared/appInsights";
import "babel-polyfill";
import "es6-symbol/implement";
import "webcrypto-liner/build/webcrypto-liner.shim.min";
import "./Libs/jquery";
import "bootstrap/dist/js/npm";
import "../externals/jquery.contextMenu.js";
import "../externals/jquery.typeahead.min.js";
import "../externals/jquery-ui.min.js";
import "../externals/adal.js";
import "promise-polyfill/src/polyfill";
import "abort-controller/polyfill";
import "whatwg-fetch";
import "es6-object-assign/auto";
import "promise.prototype.finally/auto";
import "object.entries/auto";
import "./Libs/is-integer-polyfill";
import "url-polyfill/url-polyfill.min";

import copyImg from "../images/Copy.svg";
import hdeConnect from "../images/HdeConnectCosmosDB.svg";
import error from "../images/error.svg";
import imagearrowleft from "../images/imgarrowlefticon.svg";
import refreshCosmos from "../images/refresh-cosmos.svg";

// TODO: Enable ReactDevTools after fixing the portal CORS issue
// import "./ReactDevTools"

import * as ko from "knockout";
import "./Explorer/ComponentRegisterer";
import * as TelemetryProcessor from "./Shared/Telemetry/TelemetryProcessor";
import { Action, ActionModifiers } from "./Shared/Telemetry/TelemetryConstants";

import { BindingHandlersRegisterer } from "./Bindings/BindingHandlersRegisterer";
import * as Emulator from "./Platform/Emulator/Main";
import Hosted from "./Platform/Hosted/Main";
import * as Portal from "./Platform/Portal/Main";
import { PlatformType } from "./PlatformType";
import { AuthType } from "./AuthType";

import { initializeIcons } from "office-ui-fabric-react/lib/Icons";
import { applyExplorerBindings } from "./applyExplorerBindings";
import { initializeConfiguration, Platform } from "./ConfigContext";
import Explorer from "./Explorer/Explorer";
import React, { useEffect } from "react";
import ReactDOM from "react-dom";

initializeIcons(/* optional base url */);
// TODO: Encapsulate and reuse all global variables as environment variables
window.authType = AuthType.AAD;

const Main: React.FunctionComponent = () => {
  useEffect(() => {
    window.dataExplorerPlatform = PlatformType.Portal;
    TelemetryProcessor.trace(Action.InitializeDataExplorer, ActionModifiers.Open, {});
    const explorer = Portal.initializeExplorer();
    TelemetryProcessor.trace(Action.InitializeDataExplorer, ActionModifiers.IFrameReady, {});
    applyExplorerBindings(explorer);
  }, []);
  // initializeConfiguration().then(config => {
  //   if (config.platform === Platform.Hosted) {
  //     try {
  //       // TODO Remove. All window variables should move to src/Config file
  //       window.dataExplorerPlatform = PlatformType.Hosted;
  //       Hosted.initializeExplorer().then(
  //         (explorer: Explorer) => {
  //           applyExplorerBindings(explorer);
  //           Hosted.configureTokenValidationDisplayPrompt(explorer);
  //         },
  //         (error: any) => {
  //           try {
  //             const uninitializedExplorer: Explorer = Hosted.getUninitializedExplorerForGuestAccess();
  //             window.dataExplorer = uninitializedExplorer;
  //             ko.applyBindings(uninitializedExplorer);
  //             BindingHandlersRegisterer.registerBindingHandlers();
  //             if (window.authType !== AuthType.AAD) {
  //               uninitializedExplorer.isRefreshingExplorer(false);
  //               uninitializedExplorer.displayConnectExplorerForm();
  //             }
  //           } catch (e) {
  //             console.log(e);
  //           }
  //           console.error(error);
  //         }
  //       );
  //     } catch (e) {
  //       console.log(e);
  //     }
  //   } else if (config.platform === Platform.Emulator) {
  //     // TODO Remove. All window variables should move to src/Config file
  //     window.dataExplorerPlatform = PlatformType.Emulator;
  //     window.authType = AuthType.MasterKey;
  //     const explorer = Emulator.initializeExplorer();
  //     applyExplorerBindings(explorer);
  //   } else if (config.platform === Platform.Portal) {
  //     // TODO Remove. All window variables should move to src/Config file
  //     window.dataExplorerPlatform = PlatformType.Portal;
  //     TelemetryProcessor.trace(Action.InitializeDataExplorer, ActionModifiers.Open, {});
  //     const explorer = Portal.initializeExplorer();
  //     TelemetryProcessor.trace(Action.InitializeDataExplorer, ActionModifiers.IFrameReady, {});
  //     applyExplorerBindings(explorer);
  //   }
  // });

  return (
    <div className="flexContainer">
      <div id="divExplorer" className="flexContainer hideOverflows" style={{ display: "none" }}>
        {/* Main Command Bar - Start */}
        <div data-bind="react: commandBarComponentAdapter" />
        {/* Main Command Bar - End */}
        {/* Share url flyout - Start */}
        <div
          id="shareDataAccessFlyout"
          className="shareDataAccessFlyout"
          data-bind="visible: shouldShowShareDialogContents"
        >
          <div className="shareDataAccessFlyoutContent">
            <div className="urlContainer">
              <span className="urlContentText">
                Open this database account in a new browser tab with Cosmos DB Explorer. Or copy the read-write or read
                only access urls below to share with others. For security purposes, the URLs grant time-bound access to
                the account. When access expires, you can reconnect, using a valid connection string for the account.
              </span>
              <br />
              <div
                className="toggles"
                data-bind="event: { keydown: onToggleKeyDown }, visible: shareAccessData().readWriteUrl != null"
                tabIndex={0}
                aria-label="Read-Write and Read toggle"
              >
                <div className="tab">
                  <input type="radio" className="radio" defaultValue="readwrite" />
                  <span
                    className="toggleSwitch"
                    role="presentation"
                    data-bind="click: toggleReadWrite, css:{ selectedToggle: isReadWriteToggled(), unselectedToggle: !isReadWriteToggled() }"
                  >
                    Read-Write
                  </span>
                </div>
                <div className="tab">
                  <input type="radio" className="radio" defaultValue="read" />
                  <span
                    className="toggleSwitch"
                    role="presentation"
                    data-bind="click: toggleRead, css:{ selectedToggle: isReadToggled(), unselectedToggle: !isReadToggled() }"
                  >
                    Read
                  </span>
                </div>
              </div>
              <div className="urlSpace">
                <input
                  id="shareUrlLink"
                  aria-label="Share url link"
                  className="shareLink"
                  type="text"
                  read-only
                  data-bind="value: shareAccessUrl"
                />
                <span
                  className="urlTokenCopyInfoTooltip"
                  data-bind="click: copyUrlLink, event: { keypress: onCopyUrlLinkKeyPress }"
                  aria-label="Copy url link"
                  role="button"
                  tabIndex={0}
                >
                  <img src={copyImg} alt="Copy link" />
                  <span className="urlTokenCopyTooltiptext" data-bind="text: shareUrlCopyHelperText" />
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Share url flyout - End */}
        {/* Collections Tree and Tabs - Begin */}
        <div className="resourceTreeAndTabs">
          {/* Collections Tree - Start */}
          <div id="resourcetree" data-test="resourceTreeId" className="resourceTree">
            <div className="collectionsTreeWithSplitter">
              {/* Collections Tree Expanded - Start */}
              <div
                id="main"
                className="main"
                data-bind="
                      visible: isLeftPaneExpanded()"
              >
                {/* Collections Window - - Start */}
                <div id="mainslide" className="flexContainer">
                  {/* Collections Window Title/Command Bar - Start */}
                  <div className="collectiontitle">
                    <div className="coltitle">
                      <span className="titlepadcol" data-bind="text: collectionTitle" />
                      <div className="float-right">
                        <span
                          className="padimgcolrefresh"
                          data-test="refreshTree"
                          role="button"
                          data-bind="
                                          click: onRefreshResourcesClick, clickBubble: false, event: { keypress: onRefreshDatabasesKeyPress }"
                          tabIndex={0}
                          aria-label="Refresh tree"
                          title="Refresh tree"
                        >
                          <img className="refreshcol" src={refreshCosmos} data-bind="attr: { alt: refreshTreeTitle }" />
                        </span>
                        <span
                          className="padimgcolrefresh1"
                          id="expandToggleLeftPaneButton"
                          role="button"
                          data-bind="
                                          click: toggleLeftPaneExpanded, event: { keypress: toggleLeftPaneExpandedKeyPress }"
                          tabIndex={0}
                          aria-label="Collapse Tree"
                          title="Collapse Tree"
                        >
                          <img className="refreshcol1" src={imagearrowleft} alt="Hide" />
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Collections Window Title/Command Bar - End  */}
                  {/* ko if: !isAuthWithResourceToken() */}
                  <div style={{ overflowY: "auto" }} data-bind="react:resourceTree" />
                  {/* /ko */}
                  {/* ko if: isAuthWithResourceToken() */}
                  <div style={{ overflowY: "auto" }} data-bind="react:resourceTreeForResourceToken" />
                  {/* /ko */}
                </div>
                {/*  Collections Window - End */}
              </div>
              {/* Collections Tree Expanded - End */}
              {/* Collections Tree Collapsed - Start */}
              <div
                id="mini"
                className="mini toggle-mini"
                data-bind="visible: !isLeftPaneExpanded()
                      attr: { style: { width: collapsedResourceTreeWidth }}"
              >
                <div className="main-nav nav">
                  <ul className="nav">
                    <li
                      className="resourceTreeCollapse"
                      id="collapseToggleLeftPaneButton"
                      role="button"
                      data-bind="event: { keypress: toggleLeftPaneExpandedKeyPress }"
                      tabIndex={0}
                      aria-label="Expand Tree"
                    >
                      <span
                        className="leftarrowCollapsed"
                        data-bind="
                                      click: toggleLeftPaneExpanded"
                      >
                        <img className="arrowCollapsed" src={imagearrowleft} alt="Expand" />
                      </span>
                      <span
                        className="collectionCollapsed"
                        data-bind="
                                      click: toggleLeftPaneExpanded"
                      >
                        <span
                          data-bind="
                                          text: collectionTitle"
                        />
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
              {/* Collections Tree Collapsed - End */}
            </div>
            {/* Splitter - Start */}
            <div className="splitter ui-resizable-handle ui-resizable-e" id="h_splitter1" />
            {/* Splitter - End */}
          </div>
          {/* Collections Tree - End */}
          <div
            className="connectExplorerContainer"
            data-bind="visible: !isRefreshingExplorer() && tabsManager.openedTabs().length === 0"
          >
            <form className="connectExplorerFormContainer">
              <div className="connectExplorer" data-bind="react: splashScreenAdapter" />
            </form>
          </div>
          <div
            className="tabsManagerContainer"
            data-bind='component: { name: "tabs-manager", params: {data: tabsManager}, visible: tabsManager.openedTabs().length > 0 }'
          />
        </div>
        {/* Collections Tree and Tabs - End */}
        <div
          className="dataExplorerErrorConsoleContainer"
          role="contentinfo"
          aria-label="Notification console"
          id="explorerNotificationConsole"
          data-bind="react: notificationConsoleComponentAdapter"
        />
      </div>
      {/* Explorer Connection - Encryption Token / AAD - Start */}
      <div id="connectExplorer" className="connectExplorerContainer" style={{ display: "none" }}>
        <div className="connectExplorerFormContainer">
          <div className="connectExplorer">
            <p className="connectExplorerContent">
              <img src={hdeConnect} alt="Azure Cosmos DB" />
            </p>
            <p className="welcomeText">Welcome to Azure Cosmos DB</p>
            <div id="connectWithAad">
              <input
                className="filterbtnstyle"
                data-test="cosmosdb-signinBtn"
                type="button"
                defaultValue="Sign In"
                data-bind="click: $data.signInAad"
              />
              <p
                className="switchConnectTypeText"
                data-test="cosmosdb-connectionString"
                data-bind="click: $data.onSwitchToConnectionString"
              >
                Connect to your account with connection string
              </p>
            </div>
            <form id="connectWithConnectionString" data-bind="submit: renewToken" style={{ display: "none" }}>
              <p className="connectExplorerContent connectStringText">Connect to your account with connection string</p>
              <p className="connectExplorerContent">
                <input
                  className="inputToken"
                  type="text"
                  required
                  placeholder="Please enter a connection string"
                  data-bind="value: tokenForRenewal"
                />
                <span className="errorDetailsInfoTooltip" data-bind="visible: renewTokenError().length > 0">
                  <img className="errorImg" src={error} alt="Error notification" />
                  <span className="errorDetails" data-bind="text: renewTokenError" />
                </span>
              </p>
              <p className="connectExplorerContent">
                <input className="filterbtnstyle" type="submit" defaultValue="Connect" />
              </p>
              <p className="switchConnectTypeText" data-bind="click: $data.signInAad">
                Sign In with Azure Account
              </p>
            </form>
          </div>
        </div>
      </div>
      {/* Explorer Connection - Encryption Token / AAD - End */}
      {/* Global loader - Start */}
      <div className="splashLoaderContainer" data-bind="visible: isRefreshingExplorer">
        <div className="splashLoaderContentContainer">
          <p className="connectExplorerContent">
            <img src={hdeConnect} alt="Azure Cosmos DB" />
          </p>
          <p className="splashLoaderTitle" id="explorerLoadingStatusTitle">
            Welcome to Azure Cosmos DB
          </p>
          <p className="splashLoaderText" id="explorerLoadingStatusText" role="alert">
            Connecting...
          </p>
        </div>
      </div>
      {/* Global access token expiration dialog - Start */}
      <div
        id="dataAccessTokenModal"
        className="dataAccessTokenModal"
        style={{ display: "none" }}
        data-bind="visible: shouldShowDataAccessExpiryDialog"
      >
        <div className="dataAccessTokenModalContent">
          <p className="dataAccessTokenExpireText">Please reconnect to the account using the connection string.</p>
        </div>
      </div>
      {/* Global access token expiration dialog - End */}
      {/* Context switch prompt - Start */}
      <div
        id="contextSwitchPrompt"
        className="dataAccessTokenModal"
        style={{ display: "none" }}
        data-bind="visible: shouldShowContextSwitchPrompt"
      >
        <div className="dataAccessTokenModalContent">
          <p className="dataAccessTokenExpireText">
            Please save your work before you switch! When you switch to a different Azure Cosmos DB account, current
            Data Explorer tabs will be closed.
          </p>
          <p className="dataAccessTokenExpireText">Proceed anyway?</p>
        </div>
      </div>
      <div data-bind="react: dialogComponentAdapter" />
      <div data-bind="react: addSynapseLinkDialog" />
    </div>
  );
};

ReactDOM.render(<Main />, document.body.firstElementChild);
