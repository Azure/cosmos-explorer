import { DirectionalHint, IconButton, IContextualMenuProps, Stack } from "@fluentui/react";
import React from "react";
import { useDialog } from "../../../Controls/Dialog";
import ContainerCopyMessages from "../../ContainerCopyMessages";
import { CopyJobActions, CopyJobMigrationType, CopyJobStatusType } from "../../Enums/CopyJobEnums";
import { CopyJobType, HandleJobActionClickType } from "../../Types/CopyJobTypes";

interface CopyJobActionMenuProps {
  job: CopyJobType;
  handleClick: HandleJobActionClickType;
}

const dialogBody = {
  [CopyJobActions.cancel]: (jobName: string) => (
    <Stack tokens={{ childrenGap: 10 }}>
      <Stack.Item>
        You are about to cancel <b>{jobName}</b>:
      </Stack.Item>
      <Stack.Item>
        Cancelling this job will stop it immediately. Any running or pending steps will not be completed.
      </Stack.Item>
      <Stack.Item>
        <b>This action cannot be undone. Do you want to continue?</b>
      </Stack.Item>
    </Stack>
  ),
  [CopyJobActions.complete]: (jobName: string) => (
    <Stack tokens={{ childrenGap: 10 }}>
      <Stack.Item>
        You are about to complete <b>{jobName}</b>:
      </Stack.Item>
      <Stack.Item>
        Completing this job will stop the continuous data synchronization between the source and destination containers.
      </Stack.Item>
      <Stack.Item>
        <b>This action cannot be undone. Do you want to continue?</b>
      </Stack.Item>
    </Stack>
  ),
};

const CopyJobActionMenu: React.FC<CopyJobActionMenuProps> = ({ job, handleClick }) => {
  const [updatingJobAction, setUpdatingJobAction] = React.useState<{ jobName: string; action: string } | null>(null);
  if (
    [
      CopyJobStatusType.Completed,
      CopyJobStatusType.Cancelled,
      CopyJobStatusType.Failed,
      CopyJobStatusType.Faulted,
    ].includes(job.Status)
  ) {
    return null;
  }

  const showActionConfirmationDialog = (job: CopyJobType, action: CopyJobActions): void => {
    useDialog
      .getState()
      .showOkCancelModalDialog(
        ContainerCopyMessages.MonitorJobs.dialog.heading,
        null,
        ContainerCopyMessages.MonitorJobs.dialog.confirmButtonText,
        () => handleClick(job, action, setUpdatingJobAction),
        ContainerCopyMessages.MonitorJobs.dialog.cancelButtonText,
        null,
        action in dialogBody ? dialogBody[action as keyof typeof dialogBody](job.Name) : null,
      );
  };

  const getMenuItems = (): IContextualMenuProps["items"] => {
    const isThisJobUpdating = updatingJobAction?.jobName === job.Name;

    const baseItems = [
      {
        key: CopyJobActions.pause,
        text: ContainerCopyMessages.MonitorJobs.Actions.pause,
        iconProps: { iconName: "Pause" },
        onClick: () => handleClick(job, CopyJobActions.pause, setUpdatingJobAction),
        disabled: isThisJobUpdating,
      },
      {
        key: CopyJobActions.cancel,
        text: ContainerCopyMessages.MonitorJobs.Actions.cancel,
        iconProps: { iconName: "Cancel" },
        onClick: () => showActionConfirmationDialog(job, CopyJobActions.cancel),
        disabled: isThisJobUpdating,
      },
      {
        key: CopyJobActions.resume,
        text: ContainerCopyMessages.MonitorJobs.Actions.resume,
        iconProps: { iconName: "Play" },
        onClick: () => handleClick(job, CopyJobActions.resume, setUpdatingJobAction),
        disabled: isThisJobUpdating,
      },
    ];

    if (CopyJobStatusType.Paused === job.Status) {
      return baseItems.filter((item) => item.key !== CopyJobActions.pause);
    }

    if (CopyJobStatusType.Pending === job.Status) {
      return baseItems.filter((item) => item.key !== CopyJobActions.resume);
    }

    if (
      [CopyJobStatusType.InProgress, CopyJobStatusType.Running, CopyJobStatusType.Partitioning].includes(job.Status)
    ) {
      const filteredItems = baseItems.filter((item) => item.key !== CopyJobActions.resume);
      if ((job.Mode ?? "").toLowerCase() === CopyJobMigrationType.Online) {
        filteredItems.push({
          key: CopyJobActions.complete,
          text: ContainerCopyMessages.MonitorJobs.Actions.complete,
          iconProps: { iconName: "CheckMark" },
          onClick: () => showActionConfirmationDialog(job, CopyJobActions.complete),
          disabled: isThisJobUpdating,
        });
      }
      return filteredItems;
    }

    if ([CopyJobStatusType.Skipped].includes(job.Status)) {
      return baseItems.filter((item) => item.key === CopyJobActions.resume);
    }

    return baseItems;
  };

  return (
    <IconButton
      data-test={`CopyJobActionMenu/Button:${job.Name}`}
      role="button"
      iconProps={{ iconName: "More", styles: { root: { fontSize: "20px", fontWeight: "bold" } } }}
      menuProps={{ items: getMenuItems(), directionalHint: DirectionalHint.leftTopEdge, directionalHintFixed: false }}
      menuIconProps={{ iconName: "", className: "hidden" }}
      ariaLabel={ContainerCopyMessages.MonitorJobs.Columns.actions}
      title={ContainerCopyMessages.MonitorJobs.Columns.actions}
      data-test={`CopyJobActionMenu/Button:${job.Name}`}
    />
  );
};

export default CopyJobActionMenu;
