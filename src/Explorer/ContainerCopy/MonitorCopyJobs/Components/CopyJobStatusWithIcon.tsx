import { FontIcon, mergeStyles, mergeStyleSets, Stack, Text } from "@fluentui/react";
import React from "react";
import ContainerCopyMessages from "../../ContainerCopyMessages";
import { CopyJobStatusType } from "../../Enums";

// Styles
const iconClass = mergeStyles({
  fontSize: "1em",
  marginRight: "0.3em",
});
const classNames = mergeStyleSets({
  [CopyJobStatusType.Pending]: [{ color: "#fe7f2d" }, iconClass],
  [CopyJobStatusType.InProgress]: [{ color: "#ee9b00" }, iconClass],
  [CopyJobStatusType.Running]: [{ color: "#ee9b00" }, iconClass],
  [CopyJobStatusType.Partitioning]: [{ color: "#ee9b00" }, iconClass],
  [CopyJobStatusType.Paused]: [{ color: "#bb3e03" }, iconClass],
  [CopyJobStatusType.Skipped]: [{ color: "#00bbf9" }, iconClass],
  [CopyJobStatusType.Cancelled]: [{ color: "#00bbf9" }, iconClass],
  [CopyJobStatusType.Failed]: [{ color: "#d90429" }, iconClass],
  [CopyJobStatusType.Faulted]: [{ color: "#d90429" }, iconClass],
  [CopyJobStatusType.Completed]: [{ color: "#386641" }, iconClass],
  unknown: [{ color: "#000814" }, iconClass],
});

// Icon Mapping
const iconMap: Record<CopyJobStatusType, string> = {
  [CopyJobStatusType.Pending]: "MSNVideosSolid",
  [CopyJobStatusType.InProgress]: "SyncStatusSolid",
  [CopyJobStatusType.Running]: "SyncStatusSolid",
  [CopyJobStatusType.Partitioning]: "SyncStatusSolid",
  [CopyJobStatusType.Paused]: "CirclePauseSolid",
  [CopyJobStatusType.Skipped]: "Blocked2Solid",
  [CopyJobStatusType.Cancelled]: "Blocked2Solid",
  [CopyJobStatusType.Failed]: "AlertSolid",
  [CopyJobStatusType.Faulted]: "AlertSolid",
  [CopyJobStatusType.Completed]: "CompletedSolid",
};

const CopyJobStatusWithIcon: React.FC<{ status: CopyJobStatusType }> = ({ status }) => {
  const statusText = ContainerCopyMessages.MonitorJobs.Status[status] || "Unknown";
  return (
    <Stack horizontal verticalAlign="center">
      <FontIcon
        aria-label={status}
        iconName={iconMap[status] || "UnknownSolid"}
        className={classNames[status] || classNames.unknown}
      />
      <Text>{statusText}</Text>
    </Stack>
  );
};

export default CopyJobStatusWithIcon;
