import { IColumn } from "@fluentui/react";
import ContainerCopyMessages from "../../../../ContainerCopyMessages";

const commonProps = {
  minWidth: 130,
  maxWidth: 140,
  styles: {
    root: {
      whiteSpace: "normal",
      lineHeight: "1.2",
      wordBreak: "break-word",
    },
  },
};

export const getPreviewCopyJobDetailsListColumns = (): IColumn[] => {
  return [
    {
      key: "sourcedbname",
      name: ContainerCopyMessages.sourceDatabaseLabel,
      fieldName: "sourceDatabaseName",
      ...commonProps,
    },
    {
      key: "sourcecolname",
      name: ContainerCopyMessages.sourceContainerLabel,
      fieldName: "sourceContainerName",
      ...commonProps,
    },
    {
      key: "targetdbname",
      name: ContainerCopyMessages.targetDatabaseLabel,
      fieldName: "targetDatabaseName",
      ...commonProps,
    },
    {
      key: "targetcolname",
      name: ContainerCopyMessages.targetContainerLabel,
      fieldName: "targetContainerName",
      ...commonProps,
    },
  ];
};
