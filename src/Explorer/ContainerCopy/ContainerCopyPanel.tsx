import React, { useEffect } from "react";
import { Dialog } from "../Controls/Dialog";
import { SidePanel } from "../Panes/PanelContainerComponent";
import CopyJobCommandBar from "./CommandBar/CopyJobCommandBar";
import "./containerCopyStyles.less";
import { MonitorCopyJobsRefState } from "./MonitorCopyJobs/MonitorCopyJobRefState";
import MonitorCopyJobs, { MonitorCopyJobsRef } from "./MonitorCopyJobs/MonitorCopyJobs";
import { ContainerCopyProps } from "./Types/CopyJobTypes";

const ContainerCopyPanel: React.FC<ContainerCopyProps> = ({ explorer }) => {
  const monitorCopyJobsRef = React.useRef<MonitorCopyJobsRef>();
  useEffect(() => {
    if (monitorCopyJobsRef.current) {
      MonitorCopyJobsRefState.getState().setRef(monitorCopyJobsRef.current);
    }
  }, [monitorCopyJobsRef.current]);
  return (
    <div id="containerCopyWrapper" className="flexContainer hideOverflows">
      <CopyJobCommandBar explorer={explorer} />
      <MonitorCopyJobs ref={monitorCopyJobsRef} explorer={explorer} />
      <SidePanel />
      <Dialog />
    </div>
  );
};

ContainerCopyPanel.displayName = "ContainerCopyPanel";

export default ContainerCopyPanel;
