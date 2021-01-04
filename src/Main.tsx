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
import "../externals/jquery.typeahead.min.js";
import "../externals/jquery-ui.min.js";
import "promise-polyfill/src/polyfill";
import "abort-controller/polyfill";
import "whatwg-fetch";
import "es6-object-assign/auto";
import "promise.prototype.finally/auto";
import "object.entries/auto";
import "./Libs/is-integer-polyfill";
import "url-polyfill/url-polyfill.min";

initializeIcons();

import Hosted from "./Platform/Hosted/Main";
import { AuthType } from "./AuthType";

import { initializeIcons } from "office-ui-fabric-react/lib/Icons";
import { applyExplorerBindings } from "./applyExplorerBindings";
import { configContext, initializeConfiguration, Platform } from "./ConfigContext";
import Explorer from "./Explorer/Explorer";
import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import errorImage from "../images/error.svg";
import copyImage from "../images/Copy.svg";
import hdeConnectImage from "../images/HdeConnectCosmosDB.svg";
import refreshImg from "../images/refresh-cosmos.svg";
import arrowLeftImg from "../images/imgarrowlefticon.svg";
import { KOCommentEnd, KOCommentIfStart } from "./koComment";
import { updateUserContext } from "./UserContext";
import AuthHeadersUtil from "./Platform/Hosted/Authorization";
import { CollectionCreation } from "./Shared/Constants";
import { extractFeatures } from "./Platform/Hosted/extractFeatures";
import { emulatorAccount } from "./Platform/Emulator/emulatorAccount";
import { HostedExplorerChildFrame } from "./HostedExplorerChildFrame";
import {
  getDatabaseAccountKindFromExperience,
  getDatabaseAccountPropertiesFromMetadata
} from "./Platform/Hosted/HostedUtils";
import { DefaultExperienceUtility } from "./Shared/DefaultExperienceUtility";

// const accountResourceId =
// authType === AuthType.EncryptedToken
//   ? Main._databaseAccountId
//   : authType === AuthType.AAD && account
//   ? account.id
//   : "";
// const subscriptionId: string =
// accountResourceId && accountResourceId.split("subscriptions/")[1].split("/")[0];
// const resourceGroup: string =
// accountResourceId && accountResourceId.split("resourceGroups/")[1].split("/")[0];

const App: React.FunctionComponent = () => {
  useEffect(() => {
    initializeConfiguration().then(config => {
      let explorer: Explorer;
      if (config.platform === Platform.Hosted) {
        const win = (window as unknown) as HostedExplorerChildFrame;
        explorer = new Explorer();
        if (win.hostedConfig.authType === AuthType.EncryptedToken) {
          // TODO: Remove window.authType
          window.authType = AuthType.EncryptedToken;
          // Impossible to tell if this is a try cosmos sub using an encrypted token
          explorer.isTryCosmosDBSubscription(false);
          updateUserContext({
            accessToken: encodeURIComponent(win.hostedConfig.encryptedToken)
          });

          const apiExperience: string = DefaultExperienceUtility.getDefaultExperienceFromApiKind(
            win.hostedConfig.encryptedTokenMetadata.apiKind
          );
          explorer.initDataExplorerWithFrameInputs({
            databaseAccount: {
              id: "",
              // id: Main._databaseAccountId,
              name: win.hostedConfig.encryptedTokenMetadata.accountName,
              kind: getDatabaseAccountKindFromExperience(apiExperience),
              properties: getDatabaseAccountPropertiesFromMetadata(win.hostedConfig.encryptedTokenMetadata),
              tags: []
            },
            subscriptionId: undefined,
            resourceGroup: undefined,
            masterKey: undefined,
            hasWriteAccess: true, // TODO: we should embed this information in the token ideally
            authorizationToken: undefined,
            features: extractFeatures(),
            csmEndpoint: undefined,
            dnsSuffix: undefined,
            serverId: AuthHeadersUtil.serverId,
            extensionEndpoint: configContext.BACKEND_ENDPOINT,
            subscriptionType: CollectionCreation.DefaultSubscriptionType,
            quotaId: undefined,
            addCollectionDefaultFlight: explorer.flight(),
            isTryCosmosDBSubscription: explorer.isTryCosmosDBSubscription()
          });
          explorer.isAccountReady(true);
        } else if (win.hostedConfig.authType === AuthType.ResourceToken) {
          window.authType = AuthType.EncryptedToken;
        } else if (win.hostedConfig.authType === AuthType.ConnectionString) {
          // This might seem weird, but for legacy reasons lots of code expects a connection string login to look and act like an encrypted token login
          window.authType = AuthType.EncryptedToken;
        } else if (win.hostedConfig.authType === AuthType.AAD) {
          window.authType = AuthType.AAD;
          const account = win.hostedConfig.databaseAccount;
          const accountResourceId = account.id;
          const subscriptionId = accountResourceId && accountResourceId.split("subscriptions/")[1].split("/")[0];
          const resourceGroup = accountResourceId && accountResourceId.split("resourceGroups/")[1].split("/")[0];
          explorer.initDataExplorerWithFrameInputs({
            databaseAccount: account,
            subscriptionId,
            resourceGroup,
            masterKey: "",
            hasWriteAccess: true, //TODO: 425017 - support read access
            authorizationToken: `Bearer ${win.hostedConfig.authorizationToken}`,
            features: extractFeatures(),
            csmEndpoint: undefined,
            dnsSuffix: undefined,
            serverId: AuthHeadersUtil.serverId,
            extensionEndpoint: configContext.BACKEND_ENDPOINT,
            subscriptionType: CollectionCreation.DefaultSubscriptionType,
            quotaId: undefined,
            addCollectionDefaultFlight: explorer.flight(),
            isTryCosmosDBSubscription: explorer.isTryCosmosDBSubscription()
          });
          explorer.isAccountReady(true);
        }
      } else if (config.platform === Platform.Emulator) {
        window.authType = AuthType.MasterKey;
        explorer = new Explorer();
        explorer.databaseAccount(emulatorAccount);
        explorer.isAccountReady(true);
      } else if (config.platform === Platform.Portal) {
        explorer = new Explorer();

        // In development mode, try to load the iframe message from session storage.
        // This allows webpack hot reload to funciton properly
        if (process.env.NODE_ENV === "development") {
          const initMessage = sessionStorage.getItem("portalDataExplorerInitMessage");
          if (initMessage) {
            const message = JSON.parse(initMessage);
            console.warn("Loaded cached portal iframe message from session storage");
            console.dir(message);
            explorer.initDataExplorerWithFrameInputs(message);
          }
        }

        window.addEventListener("message", explorer.handleMessage.bind(explorer), false);
      }
      applyExplorerBindings(explorer);
    });
  }, []);

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
                  read-only={true}
                  data-bind="value: shareAccessUrl"
                />
                <span
                  className="urlTokenCopyInfoTooltip"
                  data-bind="click: copyUrlLink, event: { keypress: onCopyUrlLinkKeyPress }"
                  aria-label="Copy url link"
                  role="button"
                  tabIndex={0}
                >
                  <img src={copyImage} alt="Copy link" />
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
                          <img className="refreshcol" src={refreshImg} data-bind="attr: { alt: refreshTreeTitle }" />
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
                          <img className="refreshcol1" src={arrowLeftImg} alt="Hide" />
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Collections Window Title/Command Bar - End  */}

                  {!window.dataExplorer?.isAuthWithResourceToken() && (
                    <div style={{ overflowY: "auto" }} data-bind="react:resourceTree" />
                  )}
                  {window.dataExplorer?.isAuthWithResourceToken() && (
                    <div style={{ overflowY: "auto" }} data-bind="react:resourceTreeForResourceToken" />
                  )}
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
                        <img className="arrowCollapsed" src={arrowLeftImg} alt="Expand" />
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
            data-bind='component: { name: "tabs-manager", params: {data: tabsManager} }'
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
              <img src={hdeConnectImage} alt="Azure Cosmos DB" />
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
                  <img className="errorImg" src={errorImage} alt="Error notification" />
                  <span className="errorDetails" data-bind="text: renewTokenError" />
                </span>
              </p>
              <p className="connectExplorerContent">
                <input className="filterbtnstyle" type="submit" value="Connect" />
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
            <img src={hdeConnectImage} alt="Azure Cosmos DB" />
          </p>
          <p className="splashLoaderTitle" id="explorerLoadingStatusTitle">
            Welcome to Azure Cosmos DB
          </p>
          <p className="splashLoaderText" id="explorerLoadingStatusText" role="alert">
            Connecting...
          </p>
        </div>
      </div>
      {/* Global loader - End */}
      <div data-bind="react:uploadItemsPaneAdapter" />
      <div data-bind='component: { name: "add-database-pane", params: {data: addDatabasePane} }' />
      <div data-bind='component: { name: "add-collection-pane", params: { data: addCollectionPane} }' />
      <div data-bind='component: { name: "delete-collection-confirmation-pane", params: { data: deleteCollectionConfirmationPane} }' />
      <div data-bind='component: { name: "delete-database-confirmation-pane", params: { data: deleteDatabaseConfirmationPane} }' />
      <div data-bind='component: { name: "graph-new-vertex-pane", params: { data: newVertexPane} }' />
      <div data-bind='component: { name: "graph-styling-pane", params: { data: graphStylingPane} }' />
      <div data-bind='component: { name: "table-add-entity-pane", params: { data: addTableEntityPane} }' />
      <div data-bind='component: { name: "table-edit-entity-pane", params: { data: editTableEntityPane} }' />
      <div data-bind='component: { name: "table-column-options-pane", params: { data: tableColumnOptionsPane} }' />
      <div data-bind='component: { name: "table-query-select-pane", params: { data: querySelectPane} }' />
      <div data-bind='component: { name: "cassandra-add-collection-pane", params: { data: cassandraAddCollectionPane} }' />
      <div data-bind='component: { name: "settings-pane", params: { data: settingsPane} }' />
      <div data-bind='component: { name: "upload-items-pane", params: { data: uploadItemsPane} }' />
      <div data-bind='component: { name: "load-query-pane", params: { data: loadQueryPane} }' />
      <div data-bind='component: { name: "execute-sproc-params-pane", params: { data: executeSprocParamsPane} }' />
      <div data-bind='component: { name: "renew-adhoc-access-pane", params: { data: renewAdHocAccessPane} }' />
      <div data-bind='component: { name: "save-query-pane", params: { data: saveQueryPane} }' />
      <div data-bind='component: { name: "browse-queries-pane", params: { data: browseQueriesPane} }' />
      <div data-bind='component: { name: "upload-file-pane", params: { data: uploadFilePane} }' />
      <div data-bind='component: { name: "string-input-pane", params: { data: stringInputPane} }' />
      <div data-bind='component: { name: "setup-notebooks-pane", params: { data: setupNotebooksPane} }' />
      <KOCommentIfStart if="isGitHubPaneEnabled" />
      <div data-bind='component: { name: "github-repos-pane", params: { data: gitHubReposPane } }' />
      <KOCommentEnd />
      <KOCommentIfStart if="isPublishNotebookPaneEnabled" />
      <div data-bind="react: publishNotebookPaneAdapter" />
      <KOCommentEnd />
      <KOCommentIfStart if="isCopyNotebookPaneEnabled" />
      <div data-bind="react: copyNotebookPaneAdapter" />
      <KOCommentEnd />
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

ReactDOM.render(<App />, document.body);
