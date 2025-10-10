import { IColumn } from "@fluentui/react";
import ContainerCopyMessages from "../../../../ContainerCopyMessages";

export const getPreviewCopyJobDetailsListColumns = function (): IColumn[] {
    return [
        {
            key: 'sourcedbname',
            name: ContainerCopyMessages.sourceDatabaseLabel,
            fieldName: 'sourceDatabaseName',
            minWidth: 100
        },
        {
            key: 'sourcecolname',
            name: ContainerCopyMessages.sourceContainerLabel,
            fieldName: 'sourceContainerName',
            minWidth: 100
        },
        {
            key: 'targetdbname',
            name: ContainerCopyMessages.targetDatabaseLabel,
            fieldName: 'targetDatabaseName',
            minWidth: 100
        },
        {
            key: 'targetcolname',
            name: ContainerCopyMessages.targetContainerLabel,
            fieldName: 'targetContainerName',
            minWidth: 100
        }
    ];
};
