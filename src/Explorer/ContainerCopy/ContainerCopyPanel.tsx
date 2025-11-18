import React, { useEffect } from "react";
import CopyJobCommandBar from "./CommandBar/CopyJobCommandBar";
import "./containerCopyStyles.less";
import { MonitorCopyJobsRefState } from "./MonitorCopyJobs/MonitorCopyJobRefState";
import MonitorCopyJobs, { MonitorCopyJobsRef } from "./MonitorCopyJobs/MonitorCopyJobs";
import { ContainerCopyProps } from "./Types/CopyJobTypes";

const ContainerCopyPanel: React.FC<ContainerCopyProps> = ({ container }) => {
  const monitorCopyJobsRef = React.useRef<MonitorCopyJobsRef>();
  useEffect(() => {
    if (monitorCopyJobsRef.current) {
      MonitorCopyJobsRefState.getState().setRef(monitorCopyJobsRef.current);
    }
  }, [monitorCopyJobsRef.current]);
  return (
    <div id="containerCopyWrapper" className="flexContainer hideOverflows">
      <CopyJobCommandBar container={container} />
      <MonitorCopyJobs ref={monitorCopyJobsRef} />
    </div>
  );
};

export default ContainerCopyPanel;
