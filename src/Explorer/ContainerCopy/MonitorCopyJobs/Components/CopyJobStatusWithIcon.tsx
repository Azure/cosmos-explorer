import { FontIcon, getTheme, mergeStyles, mergeStyleSets, Spinner, SpinnerSize, Stack, Text } from "@fluentui/react";
import React from "react";
import ContainerCopyMessages from "../../ContainerCopyMessages";
import { CopyJobStatusType } from "../../Enums/CopyJobEnums";

const theme = getTheme();

const iconClass = mergeStyles({
  fontSize: "16px",
  marginRight: "8px",
});

const classNames = mergeStyleSets({
  [CopyJobStatusType.Pending]: [{ color: theme.semanticColors.bodySubtext }, iconClass],
  [CopyJobStatusType.InProgress]: [{ color: theme.palette.themePrimary }, iconClass],
  [CopyJobStatusType.Running]: [{ color: theme.palette.themePrimary }, iconClass],
  [CopyJobStatusType.Partitioning]: [{ color: theme.palette.themePrimary }, iconClass],
  [CopyJobStatusType.Paused]: [{ color: theme.palette.themePrimary }, iconClass],
  [CopyJobStatusType.Skipped]: [{ color: theme.semanticColors.bodySubtext }, iconClass],
  [CopyJobStatusType.Cancelled]: [{ color: theme.semanticColors.bodySubtext }, iconClass],
  [CopyJobStatusType.Failed]: [{ color: theme.semanticColors.errorIcon }, iconClass],
  [CopyJobStatusType.Faulted]: [{ color: theme.semanticColors.errorIcon }, iconClass],
  [CopyJobStatusType.Completed]: [{ color: theme.semanticColors.successIcon }, iconClass],
  unknown: [{ color: theme.semanticColors.bodySubtext }, iconClass],
});

const iconMap: Partial<Record<CopyJobStatusType, string>> = {
  [CopyJobStatusType.Paused]: "CirclePause",
  [CopyJobStatusType.Skipped]: "StatusCircleBlock2",
  [CopyJobStatusType.Cancelled]: "StatusErrorFull",
  [CopyJobStatusType.Failed]: "StatusErrorFull",
  [CopyJobStatusType.Faulted]: "StatusErrorFull",
  [CopyJobStatusType.Completed]: "CompletedSolid",
};

const CopyJobStatusWithIcon: React.FC<{ status: CopyJobStatusType }> = ({ status }) => {
  const statusText = ContainerCopyMessages.MonitorJobs.Status[status] || "Unknown";

  const isSpinnerStatus = [
    CopyJobStatusType.Pending,
    CopyJobStatusType.Running,
    CopyJobStatusType.InProgress,
    CopyJobStatusType.Partitioning,
  ].includes(status);

  return (
    <Stack horizontal verticalAlign="center">
      {isSpinnerStatus ? (
        <Spinner size={SpinnerSize.small} style={{ marginRight: "8px" }} />
      ) : (
        <FontIcon
          aria-label={status}
          iconName={iconMap[status] || "UnknownSolid"}
          className={classNames[status] || classNames.unknown}
        />
      )}
      <Text>{statusText}</Text>
    </Stack>
  );
};

export default CopyJobStatusWithIcon;
