import { IconButton, IContextualMenuProps } from "@fluentui/react";
import React from "react";
import ContainerCopyMessages from "../../ContainerCopyMessages";
import { CopyJobActions, CopyJobMigrationType, CopyJobStatusType } from "../../Enums";
import { CopyJobType } from "../../Types";

interface CopyJobActionMenuProps {
  job: CopyJobType;
  handleClick: (job: CopyJobType, action: string) => void;
}

const CopyJobActionMenu: React.FC<CopyJobActionMenuProps> = ({ job, handleClick }) => {
  if ([CopyJobStatusType.Completed, CopyJobStatusType.Cancelled].includes(job.Status)) {
    return null;
  }

  const getMenuItems = (): IContextualMenuProps["items"] => {
    const baseItems = [
      {
        key: CopyJobActions.pause,
        text: ContainerCopyMessages.MonitorJobs.Actions.pause,
        onClick: () => handleClick(job, CopyJobActions.pause),
      },
      {
        key: CopyJobActions.cancel,
        text: ContainerCopyMessages.MonitorJobs.Actions.cancel,
        onClick: () => handleClick(job, CopyJobActions.cancel),
      },
      {
        key: CopyJobActions.resume,
        text: ContainerCopyMessages.MonitorJobs.Actions.resume,
        onClick: () => handleClick(job, CopyJobActions.resume),
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
      if (job.Mode === CopyJobMigrationType.Online) {
        filteredItems.push({
          key: CopyJobActions.complete,
          text: ContainerCopyMessages.MonitorJobs.Actions.complete,
          onClick: () => handleClick(job, CopyJobActions.complete),
        });
      }
      return filteredItems;
    }

    if ([CopyJobStatusType.Failed, CopyJobStatusType.Faulted, CopyJobStatusType.Skipped].includes(job.Status)) {
      return baseItems.filter((item) => item.key === CopyJobActions.resume);
    }

    return baseItems;
  };

  return (
    <IconButton
      role="button"
      iconProps={{ iconName: "more" }}
      menuProps={{ items: getMenuItems() }}
      ariaLabel={ContainerCopyMessages.MonitorJobs.Columns.actions}
      title={ContainerCopyMessages.MonitorJobs.Columns.actions}
    />
  );
};

export default CopyJobActionMenu;
