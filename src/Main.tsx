// CSS Dependencies
import { initializeIcons } from "@fluentui/react";
import "bootstrap/dist/css/bootstrap.css";
import React, { useState } from "react";
import ReactDOM from "react-dom";
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
import { CollapsedResourceTree } from "./Common/CollapsedResourceTree";
import { ResourceTree } from "./Common/ResourceTree";
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
import "./Explorer/Menus/CommandBar/CommandBarComponent.less";
import "./Explorer/Menus/CommandBar/MemoryTrackerComponent.less";
import "./Explorer/Menus/NotificationConsole/NotificationConsole.less";
import { NotificationConsoleComponent } from "./Explorer/Menus/NotificationConsole/NotificationConsoleComponent";
import "./Explorer/Panes/PanelComponent.less";
import { PanelContainerComponent } from "./Explorer/Panes/PanelContainerComponent";
import { SplashScreen } from "./Explorer/SplashScreen/SplashScreen";
import "./Explorer/SplashScreen/SplashScreen.less";
import "./Explorer/Tabs/QueryTab.less";
import { Tabs } from "./Explorer/Tabs/Tabs";
import { useConfig } from "./hooks/useConfig";
import { useKnockoutExplorer } from "./hooks/useKnockoutExplorer";
import { useSidePanel } from "./hooks/useSidePanel";
import { useTabs } from "./hooks/useTabs";
import "./Libs/jquery";
import "./Shared/appInsights";

initializeIcons();

const App: React.FunctionComponent = () => {
  const [isNotificationConsoleExpanded, setIsNotificationConsoleExpanded] = useState(false);
  const [notificationConsoleData, setNotificationConsoleData] = useState(undefined);
  //TODO: Refactor so we don't need to pass the id to remove a console data
  const [inProgressConsoleDataIdToBeDeleted, setInProgressConsoleDataIdToBeDeleted] = useState("");
  const [isLeftPaneExpanded, setIsLeftPaneExpanded] = useState<boolean>(true);

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
  const { tabs, activeTab, tabsManager } = useTabs();

  const explorerParams: ExplorerParams = {
    setIsNotificationConsoleExpanded,
    setNotificationConsoleData,
    setInProgressConsoleDataIdToBeDeleted,
    openSidePanel,
    closeSidePanel,
    openDialog,
    closeDialog,
    tabsManager,
  };

  const config = useConfig();
  const explorer = useKnockoutExplorer(config?.platform, explorerParams);

  const toggleLeftPaneExpanded = () => {
    setIsLeftPaneExpanded(!isLeftPaneExpanded);
    if (isLeftPaneExpanded) {
      document.getElementById("expandToggleLeftPaneButton").focus();
    } else {
      document.getElementById("collapseToggleLeftPaneButton").focus();
    }
  };

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
              <ResourceTree toggleLeftPaneExpanded={toggleLeftPaneExpanded} isLeftPaneExpanded={isLeftPaneExpanded} />
              {/* Collections Tree Expanded - End */}
              {/* Collections Tree Collapsed - Start */}
              <CollapsedResourceTree
                toggleLeftPaneExpanded={toggleLeftPaneExpanded}
                isLeftPaneExpanded={isLeftPaneExpanded}
              />
              {/* Collections Tree Collapsed - End */}
            </div>
            {/* Splitter - Start */}
            <div className="splitter ui-resizable-handle ui-resizable-e" id="h_splitter1" />
            {/* Splitter - End */}
          </div>
          {/* Collections Tree - End */}
          {tabs.length === 0 && <SplashScreen explorer={explorer} />}
          <Tabs tabs={tabs} activeTab={activeTab} />
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
      <div data-bind='component: { name: "cassandra-add-collection-pane", params: { data: cassandraAddCollectionPane} }' />
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
