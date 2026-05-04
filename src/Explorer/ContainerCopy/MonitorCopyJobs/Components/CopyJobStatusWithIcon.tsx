import { FontIcon, mergeStyles, Spinner, SpinnerSize, Stack, Text } from "@fluentui/react";
import PropTypes from "prop-types";
import React from "react";
import { Keys, t } from "Localization";
import { CopyJobStatusType } from "../../Enums/CopyJobEnums";

const iconClass = mergeStyles({
  fontSize: "16px",
  marginRight: "8px",
});

const iconMap: Partial<Record<CopyJobStatusType, string>> = {
  [CopyJobStatusType.Pending]: "Clock",
  [CopyJobStatusType.Paused]: "CirclePause",
  [CopyJobStatusType.Skipped]: "StatusCircleBlock2",
  [CopyJobStatusType.Cancelled]: "StatusErrorFull",
  [CopyJobStatusType.Failed]: "StatusErrorFull",
  [CopyJobStatusType.Faulted]: "StatusErrorFull",
  [CopyJobStatusType.Completed]: "CompletedSolid",
};

// Icon colors for different statuses
const statusIconColors: Partial<Record<CopyJobStatusType, string>> = {
  [CopyJobStatusType.Failed]: "var(--colorPaletteRedForeground1)",
  [CopyJobStatusType.Faulted]: "var(--colorPaletteRedForeground1)",
  [CopyJobStatusType.Completed]: "var(--colorSuccessGreen)",
  [CopyJobStatusType.InProgress]: "var(--colorBrandForeground1)",
  [CopyJobStatusType.Running]: "var(--colorBrandForeground1)",
  [CopyJobStatusType.Partitioning]: "var(--colorBrandForeground1)",
  [CopyJobStatusType.Paused]: "var(--colorBrandForeground1)",
};

const statusKeyMap: Record<CopyJobStatusType, string> = {
  [CopyJobStatusType.Pending]: Keys.containerCopy.monitorJobs.status.pending,
  [CopyJobStatusType.InProgress]: Keys.containerCopy.monitorJobs.status.inProgress,
  [CopyJobStatusType.Running]: Keys.containerCopy.monitorJobs.status.running,
  [CopyJobStatusType.Partitioning]: Keys.containerCopy.monitorJobs.status.partitioning,
  [CopyJobStatusType.Paused]: Keys.containerCopy.monitorJobs.status.paused,
  [CopyJobStatusType.Completed]: Keys.containerCopy.monitorJobs.status.completed,
  [CopyJobStatusType.Failed]: Keys.containerCopy.monitorJobs.status.failed,
  [CopyJobStatusType.Faulted]: Keys.containerCopy.monitorJobs.status.faulted,
  [CopyJobStatusType.Skipped]: Keys.containerCopy.monitorJobs.status.skipped,
  [CopyJobStatusType.Cancelled]: Keys.containerCopy.monitorJobs.status.cancelled,
};

export interface CopyJobStatusWithIconProps {
  status: CopyJobStatusType;
}

const CopyJobStatusWithIcon: React.FC<CopyJobStatusWithIconProps> = React.memo(({ status }) => {
  const statusText = statusKeyMap[status] ? t(statusKeyMap[status] as Parameters<typeof t>[0]) : "Unknown";

  const isSpinnerStatus = [
    CopyJobStatusType.Running,
    CopyJobStatusType.InProgress,
    CopyJobStatusType.Partitioning,
  ].includes(status);
  const iconColor = statusIconColors[status] || "var(--colorNeutralForeground2)";
  const iconStyle = mergeStyles(iconClass, { color: iconColor });

  return (
    <Stack horizontal verticalAlign="center">
      {isSpinnerStatus ? (
        <Spinner size={SpinnerSize.small} style={{ marginRight: "8px" }} />
      ) : (
        <FontIcon aria-label={status} iconName={iconMap[status] || "UnknownSolid"} className={iconStyle} />
      )}
      <Text className="themeText">{statusText}</Text>
    </Stack>
  );
});

CopyJobStatusWithIcon.displayName = "CopyJobStatusWithIcon";
CopyJobStatusWithIcon.propTypes = {
  status: PropTypes.oneOf(Object.values(CopyJobStatusType)).isRequired,
};

export default CopyJobStatusWithIcon;
