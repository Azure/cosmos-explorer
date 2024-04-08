// Import this first, to ensure that the dev tools hook is copied before React is loaded.
import "./ReactDevTools";

// CSS Dependencies
import { initializeIcons, loadTheme } from "@fluentui/react";
import { QuickstartCarousel } from "Explorer/Quickstart/QuickstartCarousel";
import { MongoQuickstartTutorial } from "Explorer/Quickstart/Tutorials/MongoQuickstartTutorial";
import { SQLQuickstartTutorial } from "Explorer/Quickstart/Tutorials/SQLQuickstartTutorial";
import { userContext } from "UserContext";
import "bootstrap/dist/css/bootstrap.css";
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
import { Platform } from "ConfigContext";
import { QueryCopilotCarousel } from "Explorer/QueryCopilot/CopilotCarousel";
import "../images/CosmosDB_rgb_ui_lighttheme.ico";
import hdeConnectImage from "../images/HdeConnectCosmosDB.svg";
import "../images/favicon.ico";
import "../less/TableStyles/CustomizeColumns.less";
import "../less/TableStyles/EntityEditor.less";
import "../less/TableStyles/fulldatatables.less";
import "../less/TableStyles/queryBuilder.less";
import "../less/documentDB.less";
import "../less/forms.less";
import "../less/infobox.less";
import "../less/menus.less";
import "../less/messagebox.less";
import "../less/resourceTree.less";
import "../less/tree.less";
import { CollapsedResourceTree } from "./Common/CollapsedResourceTree";
import { ResourceTreeContainer } from "./Common/ResourceTreeContainer";
import * as StyleConstants from "./Common/StyleConstants";
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
import "./Explorer/SplashScreen/SplashScreen.less";
import { Tabs } from "./Explorer/Tabs/Tabs";
import "./Libs/jquery";
import { appThemeFabric } from "./Platform/Fabric/FabricTheme";
import "./Shared/appInsights";
import { useConfig } from "./hooks/useConfig";
import { useKnockoutExplorer } from "./hooks/useKnockoutExplorer";

initializeIcons();

const App: React.FunctionComponent = () => {
  const [isLeftPaneExpanded, setIsLeftPaneExpanded] = useState<boolean>(true);
  const isCarouselOpen = useCarousel((state) => state.shouldOpen);
  const isCopilotCarouselOpen = useCarousel((state) => state.showCopilotCarousel);

  const config = useConfig();
  if (config?.platform === Platform.Fabric) {
    loadTheme(appThemeFabric);
    import("../less/documentDBFabric.less");
  }
  StyleConstants.updateStyles();
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
    <div className="flexContainer" aria-hidden="false">
      <div id="divExplorer" className="flexContainer hideOverflows">
        <div id="freeTierTeachingBubble"> </div>
        {/* Main Command Bar - Start */}
        <CommandBar container={explorer} />
        {/* Collections Tree and Tabs - Begin */}
        <div className="resourceTreeAndTabs">
          {/* Collections Tree - Start */}
          {userContext.apiType !== "Postgres" && userContext.apiType !== "VCoreMongo" && (
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
          )}
          <Tabs explorer={explorer} />
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
      {<SQLQuickstartTutorial />}
      {<MongoQuickstartTutorial />}
      {<QueryCopilotCarousel isOpen={isCopilotCarouselOpen} explorer={explorer} />}
    </div>
  );
};

const mainElement = document.getElementById("Main");
ReactDOM.render(<App />, mainElement);

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
