// Import this first, to ensure that the dev tools hook is copied before React is loaded.
import "./ReactDevTools";

// CSS Dependencies
import { initializeIcons, loadTheme, useTheme } from "@fluentui/react";
import { FluentProvider, makeStyles, webDarkTheme, webLightTheme } from "@fluentui/react-components";
import { Platform } from "ConfigContext";
import Explorer from "Explorer/Explorer";
import { userContext } from "UserContext";
import "allotment/dist/style.css";
import { useCarousel } from "hooks/useCarousel";
import React from "react";
import ReactDOM from "react-dom";
// Image Dependencies
import { SidePanel } from "Explorer/Panes/PanelContainerComponent";
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
import MetricScenario from "./Metrics/MetricEvents";
import { MetricScenarioProvider, useMetricScenario } from "./Metrics/MetricScenarioProvider";
import { ApplicationMetricPhase } from "./Metrics/ScenarioConfig";
import { useInteractive } from "./Metrics/useMetricPhases";
import { appThemeFabric } from "./Platform/Fabric/FabricTheme";
import "./Shared/appInsights";
import { useConfig } from "./hooks/useConfig";
import { useKnockoutExplorer } from "./hooks/useKnockoutExplorer";
import { useThemeStore } from "./hooks/useTheme";
import "./less/DarkModeMenus.less";
import "./less/ThemeSystem.less";
// Lazy-loaded components (code-split into separate chunks)
const ContainerCopyPanel = React.lazy(
  () => import(/* webpackChunkName: "ContainerCopyPanel" */ "Explorer/ContainerCopy/ContainerCopyPanel"),
);
const QuickstartCarousel = React.lazy(() =>
  import(/* webpackChunkName: "QuickstartCarousel" */ "Explorer/Quickstart/QuickstartCarousel").then((m) => ({
    default: m.QuickstartCarousel,
  })),
);
const SQLQuickstartTutorial = React.lazy(() =>
  import(/* webpackChunkName: "SQLQuickstartTutorial" */ "Explorer/Quickstart/Tutorials/SQLQuickstartTutorial").then(
    (m) => ({ default: m.SQLQuickstartTutorial }),
  ),
);
const MongoQuickstartTutorial = React.lazy(() =>
  import(
    /* webpackChunkName: "MongoQuickstartTutorial" */ "Explorer/Quickstart/Tutorials/MongoQuickstartTutorial"
  ).then((m) => ({ default: m.MongoQuickstartTutorial })),
);
const QueryCopilotCarousel = React.lazy(() =>
  import(/* webpackChunkName: "QueryCopilotCarousel" */ "Explorer/QueryCopilot/CopilotCarousel").then((m) => ({
    default: m.QueryCopilotCarousel,
  })),
);

// Defer loading legacy jQuery/Bootstrap CSS and JS — they are needed by Tables features, not on initial render
const loadLegacyDependencies = () => {
  // @ts-expect-error — side-effect-only imports handled by webpack, not real TS/ES modules
  import(/* webpackChunkName: "legacy-styles" */ "bootstrap/dist/css/bootstrap.css");
  // @ts-expect-error — webpack handles CSS imports
  import(/* webpackChunkName: "legacy-styles" */ "../externals/jquery-ui.min.css");
  // @ts-expect-error — webpack handles JS side-effect imports
  import(/* webpackChunkName: "legacy-scripts" */ "../externals/jquery-ui.min.js");
  // @ts-expect-error — webpack handles CSS imports
  import(/* webpackChunkName: "legacy-styles" */ "../externals/jquery-ui.structure.min.css");
  // @ts-expect-error — webpack handles CSS imports
  import(/* webpackChunkName: "legacy-styles" */ "../externals/jquery-ui.theme.min.css");
  // @ts-expect-error — webpack handles CSS imports
  import(/* webpackChunkName: "legacy-styles" */ "../externals/jquery.dataTables.min.css");
  // @ts-expect-error — webpack handles CSS imports
  import(/* webpackChunkName: "legacy-styles" */ "../externals/jquery.typeahead.min.css");
  import(/* webpackChunkName: "legacy-scripts" */ "../externals/jquery.typeahead.min.js");
};

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
    // Load legacy jQuery/Bootstrap dependencies after initial render
    loadLegacyDependencies();
  }, [config?.platform]);

  const explorer = useKnockoutExplorer(config?.platform);

  // Scenario-based health tracking: start ApplicationLoad and complete phases.
  const { startScenario, completePhase } = useMetricScenario();
  React.useEffect(() => {
    // Only start scenario after config is initialized to avoid race conditions
    // with message handlers that depend on configContext.platform
    if (config) {
      startScenario(MetricScenario.ApplicationLoad);
    }
  }, [config, startScenario]);

  React.useEffect(() => {
    if (explorer) {
      completePhase(MetricScenario.ApplicationLoad, ApplicationMetricPhase.ExplorerInitialized);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [explorer]);

  // Track interactive phase for both ContainerCopyPanel and DivExplorer paths
  useInteractive(MetricScenario.ApplicationLoad, !!config);

  if (!explorer) {
    return <LoadingExplorer />;
  }

  return (
    <div id="Main" className={styles.root}>
      <KeyboardShortcutRoot>
        <div className="flexContainer" aria-hidden="false">
          {userContext.features.enableContainerCopy && userContext.apiType === "SQL" ? (
            <React.Suspense fallback={null}>
              <ContainerCopyPanel explorer={explorer} />
              <SidePanel />
              <Dialog />
            </React.Suspense>
          ) : (
            <DivExplorer explorer={explorer} />
          )}
        </div>
      </KeyboardShortcutRoot>
    </div>
  );
};

const DivExplorer: React.FC<{ explorer: Explorer }> = ({ explorer }) => {
  const isCarouselOpen = useCarousel((state) => state.shouldOpen);
  const isCopilotCarouselOpen = useCarousel((state) => state.showCopilotCarousel);

  return (
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
      <React.Suspense fallback={null}>
        {<QuickstartCarousel isOpen={isCarouselOpen} />}
        {<SQLQuickstartTutorial />}
        {<MongoQuickstartTutorial />}
        {<QueryCopilotCarousel isOpen={isCopilotCarouselOpen} explorer={explorer} />}
      </React.Suspense>
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
  ReactDOM.render(
    <MetricScenarioProvider>
      <Root />
    </MetricScenarioProvider>,
    mainElement,
  );
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
