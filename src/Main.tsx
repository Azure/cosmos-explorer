// Import this first, to ensure that the dev tools hook is copied before React is loaded.
import "./ReactDevTools";

// CSS Dependencies
import { initializeIcons, loadTheme } from "@fluentui/react";
import { QuickstartCarousel } from "Explorer/Quickstart/QuickstartCarousel";
import { MongoQuickstartTutorial } from "Explorer/Quickstart/Tutorials/MongoQuickstartTutorial";
import { SQLQuickstartTutorial } from "Explorer/Quickstart/Tutorials/SQLQuickstartTutorial";
import "allotment/dist/style.css";
import "bootstrap/dist/css/bootstrap.css";
import { useCarousel } from "hooks/useCarousel";
import React from "react";
import ReactDOM from "react-dom";
import "../externals/jquery-ui.min.css";
import "../externals/jquery-ui.min.js";
import "../externals/jquery-ui.structure.min.css";
import "../externals/jquery-ui.theme.min.css";
import "../externals/jquery.dataTables.min.css";
import "../externals/jquery.typeahead.min.css";
import "../externals/jquery.typeahead.min.js";
// Image Dependencies
import { configContext, Platform } from "ConfigContext";
import ContainerCopyPanel from "Explorer/ContainerCopy/ContainerCopyPanel";
import Explorer from "Explorer/Explorer";
import { QueryCopilotCarousel } from "Explorer/QueryCopilot/CopilotCarousel";
import { SidebarContainer } from "Explorer/Sidebar";
import { KeyboardShortcutRoot } from "KeyboardShortcuts";
import { userContext } from "UserContext";
import "allotment/dist/style.css";
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
import "./Libs/jquery";
import HealthMetricScenario from "./Metrics/HealthMetrics";
import useHealthMetrics from "./Metrics/useHealthMetrics";
import { appThemeFabric } from "./Platform/Fabric/FabricTheme";
import "./Shared/appInsights";
import { useConfig } from "./hooks/useConfig";
import { useKnockoutExplorer } from "./hooks/useKnockoutExplorer";

initializeIcons();

const App: React.FunctionComponent = () => {
  const isCarouselOpen = useCarousel((state) => state.shouldOpen);
  const isCopilotCarouselOpen = useCarousel((state) => state.showCopilotCarousel);

  const config = useConfig();
  if (config?.platform === Platform.Fabric) {
    loadTheme(appThemeFabric);
    import("../less/documentDBFabric.less");
  }
  StyleConstants.updateStyles();
  const explorer = useKnockoutExplorer(config?.platform);

  // Emit an unhealthy health metric if the Explorer fails to load within a threshold.
  // We only report once per session to avoid noise.
  const { markUnhealthy } = useHealthMetrics();
  const reportedUnhealthyRef = React.useRef<boolean>(false);
  React.useEffect(() => {
    // If Explorer hasn't initialized yet, start a timeout to flag unhealthy load.
    if (!explorer) {
      const api = userContext.apiType;
      const timeoutId = window.setTimeout(() => {
        if (!reportedUnhealthyRef.current) {
          reportedUnhealthyRef.current = true;
          markUnhealthy(HealthMetricScenario.ApplicationLoad, configContext.platform, api);
        }
      }, 10000);

      return () => window.clearTimeout(timeoutId);
    }

    // If Explorer eventually loads, ensure we don't report unhealthy.
    return undefined;
  }, [explorer, markUnhealthy]);

  if (!explorer) {
    return <LoadingExplorer />;
  }

  return (
    <KeyboardShortcutRoot>
      <div className="flexContainer" aria-hidden="false" data-test="DataExplorerRoot">
        {userContext.features.enableContainerCopy && userContext.apiType === "SQL" ? (
          <ContainerCopyPanel container={explorer} />
        ) : (
          <DivExplorer explorer={explorer} />
        )}

        <SidePanel />
        <Dialog />
        {<QuickstartCarousel isOpen={isCarouselOpen} />}
        {<SQLQuickstartTutorial />}
        {<MongoQuickstartTutorial />}
        {<QueryCopilotCarousel isOpen={isCopilotCarouselOpen} explorer={explorer} />}
      </div>
    </KeyboardShortcutRoot>
  );
};

const mainElement = document.getElementById("Main");
ReactDOM.render(<App />, mainElement);

function DivExplorer({ explorer }: { explorer: Explorer }): JSX.Element {
  const { markHealthy } = useHealthMetrics();
  React.useEffect(() => {
    const api = userContext.apiType;
    markHealthy(HealthMetricScenario.ApplicationLoad, configContext.platform, api);
  }, [markHealthy]);
  return (
    <div id="divExplorer" className="flexContainer hideOverflows">
      <div id="freeTierTeachingBubble"> </div>
      {/* Main Command Bar - Start */}
      <CommandBar container={explorer} />
      {/* Collections Tree and Tabs - Begin */}
      <SidebarContainer explorer={explorer} />
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
  );
}

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
