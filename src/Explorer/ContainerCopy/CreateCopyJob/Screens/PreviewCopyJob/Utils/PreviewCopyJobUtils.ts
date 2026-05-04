import { IColumn } from "@fluentui/react";
import { Keys, t } from "Localization";

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
      name: t(Keys.containerCopy.preview.sourceDatabaseLabel),
      fieldName: "sourceDatabaseName",
      ...commonProps,
    },
    {
      key: "sourcecolname",
      name: t(Keys.containerCopy.preview.sourceContainerLabel),
      fieldName: "sourceContainerName",
      ...commonProps,
    },
    {
      key: "targetdbname",
      name: t(Keys.containerCopy.preview.targetDatabaseLabel),
      fieldName: "targetDatabaseName",
      ...commonProps,
    },
    {
      key: "targetcolname",
      name: t(Keys.containerCopy.preview.targetContainerLabel),
      fieldName: "targetContainerName",
      ...commonProps,
    },
  ];
};
