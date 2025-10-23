import { IColumn } from "@fluentui/react";
import React from "react";
import ContainerCopyMessages from "../../ContainerCopyMessages";
import { CopyJobType } from "../../Types";
import CopyJobActionMenu from "./CopyJobActionMenu";
import CopyJobStatusWithIcon from "./CopyJobStatusWithIcon";

export const getColumns = (
    handleSort: (columnKey: string) => void,
    handleActionClick: (job: CopyJobType, action: string) => void,
    sortedColumnKey: string | undefined,
    isSortedDescending: boolean
): IColumn[] => [
        {
            key: "LastUpdatedTime",
            name: ContainerCopyMessages.MonitorJobs.Columns.lastUpdatedTime,
            fieldName: "LastUpdatedTime",
            minWidth: 100,
            maxWidth: 150,
            isResizable: true,
            isSorted: sortedColumnKey === "timestamp",
            isSortedDescending: isSortedDescending,
            onColumnClick: () => handleSort("timestamp"),
        },
        {
            key: "Name",
            name: ContainerCopyMessages.MonitorJobs.Columns.name,
            fieldName: "Name",
            minWidth: 90,
            maxWidth: 130,
            isResizable: true,
            isSorted: sortedColumnKey === "Name",
            isSortedDescending: isSortedDescending,
            onColumnClick: () => handleSort("Name"),
        },
        {
            key: "Mode",
            name: ContainerCopyMessages.MonitorJobs.Columns.mode,
            fieldName: "Mode",
            minWidth: 70,
            maxWidth: 90,
            isResizable: true,
            isSorted: sortedColumnKey === "Mode",
            isSortedDescending: isSortedDescending,
            onColumnClick: () => handleSort("Mode"),
        },
        {
            key: "CompletionPercentage",
            name: ContainerCopyMessages.MonitorJobs.Columns.completionPercentage,
            fieldName: "CompletionPercentage",
            minWidth: 120,
            maxWidth: 130,
            isResizable: true,
            isSorted: sortedColumnKey === "CompletionPercentage",
            isSortedDescending: isSortedDescending,
            onRender: (job: CopyJobType) => `${job.CompletionPercentage}%`,
            onColumnClick: () => handleSort("CompletionPercentage"),
        },
        {
            key: "CopyJobStatus",
            name: ContainerCopyMessages.MonitorJobs.Columns.status,
            fieldName: "Status",
            minWidth: 80,
            maxWidth: 100,
            isResizable: true,
            isSorted: sortedColumnKey === "Status",
            isSortedDescending: isSortedDescending,
            onRender: (job: CopyJobType) => <CopyJobStatusWithIcon status={job.Status} />,
            onColumnClick: () => handleSort("Status"),
        },
        {
            key: "Actions",
            name: ContainerCopyMessages.MonitorJobs.Columns.actions,
            minWidth: 200,
            isResizable: true,
            onRender: (job: CopyJobType) => <CopyJobActionMenu job={job} handleClick={handleActionClick} />,
        },
    ];