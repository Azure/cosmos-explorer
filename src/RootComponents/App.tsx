import { loadTheme, makeStyles } from "@fluentui/react";
import React from "react";
import * as StyleConstants from "../Common/StyleConstants";
import { Platform } from "../ConfigContext";
import ContainerCopyPanel from "../Explorer/ContainerCopy/ContainerCopyPanel";
import { useConfig } from "../hooks/useConfig";
import { useKnockoutExplorer } from "../hooks/useKnockoutExplorer";
import { KeyboardShortcutRoot } from "../KeyboardShortcuts";
import MetricScenario from "../Metrics/MetricEvents";
import { useMetricScenario } from "../Metrics/MetricScenarioProvider";
import { ApplicationMetricPhase } from "../Metrics/ScenarioConfig";
import { appThemeFabric } from "../Platform/Fabric/FabricTheme";
import { userContext } from "../UserContext";
import ExplorerContainer from "./ExplorerContainer";
import LoadingExplorer from "./LoadingExplorer";

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
  // Load Fabric theme and styles only once when platform is Fabric
  React.useEffect(() => {
    if (config?.platform === Platform.Fabric) {
      loadTheme(appThemeFabric);
      import("../../less/documentDBFabric.less");
    }
    StyleConstants.updateStyles();
  }, [config?.platform]);

  const explorer = useKnockoutExplorer(config?.platform);

  // Scenario-based health tracking: start ApplicationLoad and complete phases.
  const { startScenario, completePhase } = useMetricScenario();
  React.useEffect(() => {
    startScenario(MetricScenario.ApplicationLoad);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (explorer) {
      completePhase(MetricScenario.ApplicationLoad, ApplicationMetricPhase.ExplorerInitialized);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [explorer]);

  if (!explorer) {
    return <LoadingExplorer />;
  }

  return (
    <div id="Main" className={styles.root}>
      <KeyboardShortcutRoot>
        <div className="flexContainer" aria-hidden="false">
          {userContext.features.enableContainerCopy && userContext.apiType === "SQL" ? (
            <ContainerCopyPanel explorer={explorer} />
          ) : (
            <ExplorerContainer explorer={explorer} />
          )}
        </div>
      </KeyboardShortcutRoot>
    </div>
  );
};

export default App;
