import { IColumn } from "@fluentui/react";
import React from "react";
import { Keys, t } from "Localization";
import { CopyJobType, HandleJobActionClickType } from "../../Types/CopyJobTypes";
import CopyJobActionMenu from "./CopyJobActionMenu";
import CopyJobStatusWithIcon from "./CopyJobStatusWithIcon";

export const getColumns = (
  handleSort: (columnKey: string) => void,
  handleActionClick: HandleJobActionClickType,
  sortedColumnKey: string | undefined,
  isSortedDescending: boolean,
): IColumn[] => [
  {
    key: "LastUpdatedTime",
    name: t(Keys.containerCopy.monitorJobs.columns.lastUpdatedTime),
    fieldName: "LastUpdatedTime",
    minWidth: 140,
    maxWidth: 300,
    isResizable: true,
    isSorted: sortedColumnKey === "timestamp",
    isSortedDescending: isSortedDescending,
    onColumnClick: () => handleSort("timestamp"),
  },
  {
    key: "Name",
    name: t(Keys.containerCopy.monitorJobs.columns.name),
    fieldName: "Name",
    minWidth: 140,
    maxWidth: 300,
    isResizable: true,
    isSorted: sortedColumnKey === "Name",
    isSortedDescending: isSortedDescending,
    onColumnClick: () => handleSort("Name"),
    onRender: (job: CopyJobType) => <span className="jobNameLink">{job.Name}</span>,
  },
  {
    key: "Mode",
    name: t(Keys.containerCopy.monitorJobs.columns.mode),
    fieldName: "Mode",
    minWidth: 90,
    maxWidth: 200,
    isResizable: true,
    isSorted: sortedColumnKey === "Mode",
    isSortedDescending: isSortedDescending,
    onColumnClick: () => handleSort("Mode"),
  },
  {
    key: "CompletionPercentage",
    name: t(Keys.containerCopy.monitorJobs.columns.completionPercentage),
    fieldName: "CompletionPercentage",
    minWidth: 110,
    maxWidth: 200,
    isResizable: true,
    isSorted: sortedColumnKey === "CompletionPercentage",
    isSortedDescending: isSortedDescending,
    onRender: (job: CopyJobType) => `${job.CompletionPercentage}%`,
    onColumnClick: () => handleSort("CompletionPercentage"),
  },
  {
    key: "CopyJobStatus",
    name: t(Keys.containerCopy.monitorJobs.columns.status),
    fieldName: "Status",
    minWidth: 130,
    maxWidth: 200,
    isResizable: true,
    isSorted: sortedColumnKey === "Status",
    isSortedDescending: isSortedDescending,
    onRender: (job: CopyJobType) => <CopyJobStatusWithIcon status={job.Status} />,
    onColumnClick: () => handleSort("Status"),
  },
  {
    key: "Actions",
    name: "",
    minWidth: 80,
    maxWidth: 200,
    isResizable: true,
    onRender: (job: CopyJobType) => <CopyJobActionMenu job={job} handleClick={handleActionClick} />,
  },
];
