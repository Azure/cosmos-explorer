// CSS Dependencies
import { initializeIcons } from "@fluentui/react";
import "bootstrap/dist/css/bootstrap.css";
import { QuickstartCarousel } from "Explorer/Tutorials/QuickstartCarousel";
import { QuickstartTutorial } from "Explorer/Tutorials/QuickstartTutorial";
import { useCarousel } from "hooks/useCarousel";
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
import { ResourceTreeContainer } from "./Common/ResourceTreeContainer";
import "./Explorer/Controls/Accordion/AccordionComponent.less";
import "./Explorer/Controls/CollapsiblePanel/CollapsiblePanelComponent.less";
import { Dialog } from "./Explorer/Controls/Dialog";
import "./Explorer/Controls/ErrorDisplayComponent/ErrorDisplayComponent.less";
import "./Explorer/Controls/JsonEditor/JsonEditorComponent.less";
import "./Explorer/Controls/Notebook/NotebookTerminalComponent.less";
import "./Explorer/Controls/TreeComponent/treeComponent.less";
import "./Explorer/Graph/GraphExplorerComponent/graphExplorer.less";
import "./Explorer/Menus/CommandBar/CommandBarComponent.less";
import { CommandBar } from "./Explorer/Menus/CommandBar/CommandBarComponentAdapter";
import "./Explorer/Menus/CommandBar/ConnectionStatusComponent.less";
import "./Explorer/Menus/CommandBar/MemoryTrackerComponent.less";
import "./Explorer/Menus/NotificationConsole/NotificationConsole.less";
import { NotificationConsole } from "./Explorer/Menus/NotificationConsole/NotificationConsoleComponent";
import "./Explorer/Panes/PanelComponent.less";
import { SidePanel } from "./Explorer/Panes/PanelContainerComponent";
import { SplashScreen } from "./Explorer/SplashScreen/SplashScreen";
import "./Explorer/SplashScreen/SplashScreen.less";
import { Tabs } from "./Explorer/Tabs/Tabs";
import { useConfig } from "./hooks/useConfig";
import { useKnockoutExplorer } from "./hooks/useKnockoutExplorer";
import { useTabs } from "./hooks/useTabs";
import "./Libs/jquery";
import "./Shared/appInsights";

initializeIcons();

const App: React.FunctionComponent = () => {
  const [isLeftPaneExpanded, setIsLeftPaneExpanded] = useState<boolean>(true);
  const openedTabs = useTabs((state) => state.openedTabs);
  const isConnectTabOpen = useTabs((state) => state.isConnectTabOpen);
  const isCarouselOpen = useCarousel((state) => state.shouldOpen);

  const config = useConfig();
  const explorer = useKnockoutExplorer(config?.platform);

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
      <div id="divExplorer" className="flexContainer hideOverflows">
        {/* Main Command Bar - Start */}
        <CommandBar container={explorer} />
        {/* Collections Tree and Tabs - Begin */}
        <div className="resourceTreeAndTabs">
          {/* Collections Tree - Start */}
          <div id="resourcetree" data-test="resourceTreeId" className="resourceTree">
            <div className="collectionsTreeWithSplitter">
              {/* Collections Tree Expanded - Start */}
              <ResourceTreeContainer
                container={explorer}
                toggleLeftPaneExpanded={toggleLeftPaneExpanded}
                isLeftPaneExpanded={isLeftPaneExpanded}
              />
              {/* Collections Tree Expanded - End */}
              {/* Collections Tree Collapsed - Start */}
              <CollapsedResourceTree
                toggleLeftPaneExpanded={toggleLeftPaneExpanded}
                isLeftPaneExpanded={isLeftPaneExpanded}
              />
              {/* Collections Tree Collapsed - End */}
            </div>
          </div>
          {/* Collections Tree - End */}
          {openedTabs.length === 0 && !isConnectTabOpen && <SplashScreen explorer={explorer} />}
          <Tabs />
        </div>
        {/* Collections Tree and Tabs - End */}
        <div
          className="dataExplorerErrorConsoleContainer"
          role="contentinfo"
          aria-label="Notification console"
          id="explorerNotificationConsole"
        >
          <NotificationConsole />
        </div>
      </div>
      <SidePanel />
      <Dialog />
      {<QuickstartCarousel isOpen={isCarouselOpen} />}
      {<QuickstartTutorial />}
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
