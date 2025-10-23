// Import this first, to ensure that the dev tools hook is copied before React is loaded.
import "./ReactDevTools";

// CSS Dependencies
import { initializeIcons, loadTheme, useTheme } from "@fluentui/react";
import { FluentProvider, makeStyles, webDarkTheme, webLightTheme } from "@fluentui/react-components";
import { Platform } from "ConfigContext";
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
import { SidePanel } from "Explorer/Panes/PanelContainerComponent";
import { QueryCopilotCarousel } from "Explorer/QueryCopilot/CopilotCarousel";
import { SidebarContainer } from "Explorer/Sidebar";
import { KeyboardShortcutRoot } from "KeyboardShortcuts";
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
import { ErrorBoundary } from "./Explorer/ErrorBoundary";
import "./Explorer/Graph/GraphExplorerComponent/graphExplorer.less";
import "./Explorer/Menus/CommandBar/CommandBarComponent.less";
import { CommandBar } from "./Explorer/Menus/CommandBar/CommandBarComponentAdapter";
import "./Explorer/Menus/CommandBar/ConnectionStatusComponent.less";
import "./Explorer/Menus/CommandBar/MemoryTrackerComponent.less";
import "./Explorer/Menus/NotificationConsole/NotificationConsole.less";
import { NotificationConsole } from "./Explorer/Menus/NotificationConsole/NotificationConsoleComponent";
import "./Explorer/Panes/PanelComponent.less";
import "./Explorer/SplashScreen/SplashScreen.less";
import "./Libs/jquery";
import { appThemeFabric } from "./Platform/Fabric/FabricTheme";
import "./Shared/appInsights";
import { useConfig } from "./hooks/useConfig";
import { useKnockoutExplorer } from "./hooks/useKnockoutExplorer";
import { useThemeStore } from "./hooks/useTheme";
import "./less/DarkModeMenus.less";
import "./less/ThemeSystem.less";
// Initialize icons before React is loaded
initializeIcons(undefined, { disableWarnings: true });

const useStyles = makeStyles({
  root: {
    height: "100vh",
    width: "100vw",
    backgroundColor: "var(--colorNeutralBackground1)",
    color: "var(--colorNeutralForeground1)",
  },
});

const App = (): JSX.Element => {
  const config = useConfig();
  const isCarouselOpen = useCarousel((state) => state.shouldOpen);
  const isCopilotCarouselOpen = useCarousel((state) => state.showCopilotCarousel);
  const styles = useStyles();
  // theme is used for application-wide styling
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const theme = useTheme();

  // Load Fabric theme and styles only once when platform is Fabric
  React.useEffect(() => {
    if (config?.platform === Platform.Fabric) {
      loadTheme(appThemeFabric);
      import("../less/documentDBFabric.less");
    }
    StyleConstants.updateStyles();
  }, [config?.platform]);

  const explorer = useKnockoutExplorer(config?.platform);

  if (!explorer) {
    return <LoadingExplorer />;
  }

  return (
    <div id="Main" className={styles.root}>
      <KeyboardShortcutRoot>
        <div
          className="flexContainer"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            backgroundColor: "var(--colorNeutralBackground1)",
            color: "var(--colorNeutralForeground1)",
          }}
          aria-hidden="false"
          data-test="DataExplorerRoot"
        >
          <div
            id="divExplorer"
            className="flexContainer hideOverflows"
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              backgroundColor: "var(--colorNeutralBackground1)",
              color: "var(--colorNeutralForeground1)",
            }}
          >
            <div id="freeTierTeachingBubble"> </div>
            <CommandBar container={explorer} />
            <SidebarContainer explorer={explorer} />
            <div
              className="dataExplorerErrorConsoleContainer"
              role="contentinfo"
              aria-label="Notification console"
              id="explorerNotificationConsole"
              style={{
                backgroundColor: "var(--colorNeutralBackground1)",
                color: "var(--colorNeutralForeground1)",
              }}
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
      </KeyboardShortcutRoot>
    </div>
  );
};

const Root: React.FC = () => {
  // Use React state to track isDarkMode and subscribe to changes
  const [isDarkMode, setIsDarkMode] = React.useState(useThemeStore.getState().isDarkMode);
  const currentTheme = isDarkMode ? webDarkTheme : webLightTheme;

  // Subscribe to theme changes
  React.useEffect(() => {
    return useThemeStore.subscribe((state) => {
      setIsDarkMode(state.isDarkMode);
    });
  }, []);

  return (
    <ErrorBoundary>
      <FluentProvider theme={currentTheme}>
        <App />
      </FluentProvider>
    </ErrorBoundary>
  );
};

const mainElement = document.getElementById("Main");
if (mainElement) {
  ReactDOM.render(<Root />, mainElement);
}

function LoadingExplorer(): JSX.Element {
  const styles = useStyles();
  return (
    <div className={styles.root}>
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
    </div>
  );
}
