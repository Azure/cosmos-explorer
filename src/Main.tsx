// CSS Dependencies
import "abort-controller/polyfill";
import "babel-polyfill";
import "bootstrap/dist/css/bootstrap.css";
import "es6-object-assign/auto";
import "es6-symbol/implement";
import "object.entries/auto";
import { initializeIcons } from "office-ui-fabric-react/lib/Icons";
import "promise-polyfill/src/polyfill";
import "promise.prototype.finally/auto";
import React, { useState } from "react";
import ReactDOM from "react-dom";
import "url-polyfill/url-polyfill.min";
import "webcrypto-liner/build/webcrypto-liner.shim.min";
import "whatwg-fetch";
import "../externals/jquery-ui.min.css";
import "../externals/jquery-ui.min.js";
import "../externals/jquery-ui.structure.min.css";
import "../externals/jquery-ui.theme.min.css";
import "../externals/jquery.dataTables.min.css";
import "../externals/jquery.typeahead.min.css";
import "../externals/jquery.typeahead.min.js";
// Image Dependencies
import "../images/CosmosDB_rgb_ui_lighttheme.ico";
import "../images/favicon.ico";
import hdeConnectImage from "../images/HdeConnectCosmosDB.svg";
import arrowLeftImg from "../images/imgarrowlefticon.svg";
import refreshImg from "../images/refresh-cosmos.svg";
import "../less/documentDB.less";
import "../less/forms.less";
import "../less/infobox.less";
import "../less/menus.less";
import "../less/messagebox.less";
import "../less/resourceTree.less";
import "../less/TableStyles/CustomizeColumns.less";
import "../less/TableStyles/EntityEditor.less";
import "../less/TableStyles/fulldatatables.less";
import "../less/TableStyles/queryBuilder.less";
import "../less/tree.less";
import "./Explorer/Controls/Accordion/AccordionComponent.less";
import "./Explorer/Controls/CollapsiblePanel/CollapsiblePanelComponent.less";
import { Dialog, DialogProps } from "./Explorer/Controls/Dialog";
import "./Explorer/Controls/DynamicList/DynamicListComponent.less";
import "./Explorer/Controls/ErrorDisplayComponent/ErrorDisplayComponent.less";
import "./Explorer/Controls/JsonEditor/JsonEditorComponent.less";
import "./Explorer/Controls/Notebook/NotebookTerminalComponent.less";
import "./Explorer/Controls/TreeComponent/treeComponent.less";
import { ExplorerParams } from "./Explorer/Explorer";
import "./Explorer/Graph/GraphExplorerComponent/graphExplorer.less";
import "./Explorer/Graph/NewVertexComponent/newVertexComponent.less";
import "./Explorer/Menus/CommandBar/CommandBarComponent.less";
import "./Explorer/Menus/CommandBar/MemoryTrackerComponent.less";
import "./Explorer/Menus/NotificationConsole/NotificationConsole.less";
import { NotificationConsoleComponent } from "./Explorer/Menus/NotificationConsole/NotificationConsoleComponent";
import "./Explorer/Panes/GraphNewVertexPane.less";
import "./Explorer/Panes/PanelComponent.less";
import { PanelContainerComponent } from "./Explorer/Panes/PanelContainerComponent";
import { SplashScreen } from "./Explorer/SplashScreen/SplashScreen";
import "./Explorer/SplashScreen/SplashScreen.less";
import "./Explorer/Tabs/QueryTab.less";
import { useConfig } from "./hooks/useConfig";
import { useKnockoutExplorer } from "./hooks/useKnockoutExplorer";
import { useSidePanel } from "./hooks/useSidePanel";
import { KOCommentEnd, KOCommentIfStart } from "./koComment";
import "./Libs/is-integer-polyfill";
import "./Libs/jquery";
import "./Shared/appInsights";

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

  const explorerParams: ExplorerParams = {
    setIsNotificationConsoleExpanded,
    setNotificationConsoleData,
    setInProgressConsoleDataIdToBeDeleted,
    openSidePanel,
    closeSidePanel,
    openDialog,
    closeDialog,
  };
  const config = useConfig();
  const explorer = useKnockoutExplorer(config?.platform, explorerParams);

  if (!explorer) {
    return <LoadingExplorer />;
  }

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
                  <div style={{ overflowY: "auto" }} data-bind="if: !isAuthWithResourceToken(), react:resourceTree" />
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

function LoadingExplorer(): JSX.Element {
  return (
    <div className="splashLoaderContainer">
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
  );
}
