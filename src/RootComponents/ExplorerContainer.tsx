import React from "react";
import { Dialog } from "../Explorer/Controls/Dialog";
import Explorer from "../Explorer/Explorer";
import { CommandBar } from "../Explorer/Menus/CommandBar/CommandBarComponentAdapter";
import { NotificationConsole } from "../Explorer/Menus/NotificationConsole/NotificationConsoleComponent";
import { SidePanel } from "../Explorer/Panes/PanelContainerComponent";
import { QueryCopilotCarousel } from "../Explorer/QueryCopilot/CopilotCarousel";
import { QuickstartCarousel } from "../Explorer/Quickstart/QuickstartCarousel";
import { MongoQuickstartTutorial } from "../Explorer/Quickstart/Tutorials/MongoQuickstartTutorial";
import { SQLQuickstartTutorial } from "../Explorer/Quickstart/Tutorials/SQLQuickstartTutorial";
import { SidebarContainer } from "../Explorer/Sidebar";
import { useCarousel } from "../hooks/useCarousel";
import MetricScenario from "../Metrics/MetricEvents";
import { useInteractive } from "../Metrics/useMetricPhases";

const ExplorerContainer: React.FC<{ explorer: Explorer }> = ({ explorer }) => {
  const isCarouselOpen = useCarousel((state) => state.shouldOpen);
  const isCopilotCarouselOpen = useCarousel((state) => state.showCopilotCarousel);
  useInteractive(MetricScenario.ApplicationLoad);

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
      {<QuickstartCarousel isOpen={isCarouselOpen} />}
      {<SQLQuickstartTutorial />}
      {<MongoQuickstartTutorial />}
      {<QueryCopilotCarousel isOpen={isCopilotCarouselOpen} explorer={explorer} />}
    </div>
  );
};

export default ExplorerContainer;
