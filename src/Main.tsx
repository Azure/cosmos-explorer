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
import "./Explorer/Panes/PanelComponent.less";
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
import "./Explorer/SplashScreen/SplashScreen.less";
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

import { initializeIcons } from "office-ui-fabric-react/lib/Icons";
import Explorer, { ExplorerParams } from "./Explorer/Explorer";
import React, { useState } from "react";
import ReactDOM from "react-dom";
import hdeConnectImage from "../images/HdeConnectCosmosDB.svg";
import refreshImg from "../images/refresh-cosmos.svg";
import arrowLeftImg from "../images/imgarrowlefticon.svg";
import { KOCommentEnd, KOCommentIfStart } from "./koComment";
import { useConfig } from "./hooks/useConfig";
import { useKnockoutExplorer } from "./hooks/useKnockoutExplorer";
import { useSidePanel } from "./hooks/useSidePanel";
import { NotificationConsoleComponent } from "./Explorer/Menus/NotificationConsole/NotificationConsoleComponent";
import { PanelContainerComponent } from "./Explorer/Panes/PanelContainerComponent";
import { SplashScreen } from "./Explorer/SplashScreen/SplashScreen";
import { Dialog, DialogProps } from "./Explorer/Controls/Dialog";
import { ResourceTree } from "./Explorer/Tree/ResourceTree";
import { useNotebooks } from "./hooks/useNotebooks";

initializeIcons();

const App: React.FunctionComponent = () => {
  const [isNotificationConsoleExpanded, setIsNotificationConsoleExpanded] = useState(false);
  const [notificationConsoleData, setNotificationConsoleData] = useState(undefined);
  //TODO: Refactor so we don't need to pass the id to remove a console data
  const [inProgressConsoleDataIdToBeDeleted, setInProgressConsoleDataIdToBeDeleted] = useState("");

  const [dialogProps, setDialogProps] = useState<DialogProps>();
  const [showDialog, setShowDialog] = useState<boolean>(false);

  const openDialog = (props: DialogProps) => {
    setDialogProps(props);
    setShowDialog(true);
  };
  const closeDialog = () => {
    setShowDialog(false);
  };

  const { isPanelOpen, panelContent, headerText, openSidePanel, closeSidePanel } = useSidePanel();

  // TODO Figure out a better pattern: this is because we don't have container, yet
  const context: { container: Explorer } = { container: undefined };
  const {
    lastRefreshTime,
    galleryContentRoot,
    myNotebooksContentRoot,
    gitHubNotebooksContentRoot,
    refreshList,
    initializeGitHubRepos,
    getMyNotebooksContentRoot,
  } = useNotebooks(context);

  const explorerParams: ExplorerParams = {
    setIsNotificationConsoleExpanded,
    setNotificationConsoleData,
    setInProgressConsoleDataIdToBeDeleted,
    openSidePanel,
    closeSidePanel,
    openDialog,
    closeDialog,
    onRefreshNotebookList: refreshList,
    initializeGitHubRepos,
    getMyNotebooksContentRoot,
  };
  const config = useConfig();
  const explorer = useKnockoutExplorer(config?.platform, explorerParams);

  context.container = explorer;

  return (
    <div className="flexContainer">
      <div id="divExplorer" className="flexContainer hideOverflows" style={{ display: "none" }}>
        {/* Main Command Bar - Start */}
        <div data-bind="react: commandBarComponentAdapter" />
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
                  <div
                    style={{ overflowY: "auto" }}
                    data-bind="if: isAuthWithResourceToken(), react:resourceTreeForResourceToken"
                  />
                  <div style={{ overflowY: "auto" }} data-bind="if: !isAuthWithResourceToken()">
                    <ResourceTree
                      explorer={explorer}
                      lastRefreshedTime={lastRefreshTime}
                      galleryContentRoot={galleryContentRoot}
                      myNotebooksContentRoot={myNotebooksContentRoot}
                      gitHubNotebooksContentRoot={gitHubNotebooksContentRoot}
                    />
                  </div>
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
              <SplashScreen explorer={explorer} />
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
        >
          <NotificationConsoleComponent
            isConsoleExpanded={isNotificationConsoleExpanded}
            consoleData={notificationConsoleData}
            inProgressConsoleDataIdToBeDeleted={inProgressConsoleDataIdToBeDeleted}
            setIsConsoleExpanded={setIsNotificationConsoleExpanded}
          />
        </div>
      </div>
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
      <PanelContainerComponent
        isOpen={isPanelOpen}
        panelContent={panelContent}
        headerText={headerText}
        closePanel={closeSidePanel}
        isConsoleExpanded={isNotificationConsoleExpanded}
      />
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
      {showDialog && <Dialog {...dialogProps} />}
    </div>
  );
};

ReactDOM.render(<App />, document.body);
