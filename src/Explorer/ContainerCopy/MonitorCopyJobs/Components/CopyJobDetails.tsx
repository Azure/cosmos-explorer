import { DetailsList, DetailsListLayoutMode, IColumn, Stack, Text } from "@fluentui/react";
import React, { memo } from "react";
import { useThemeStore } from "../../../../hooks/useTheme";
import ContainerCopyMessages from "../../ContainerCopyMessages";
import { CopyJobStatusType } from "../../Enums/CopyJobEnums";
import { CopyJobType } from "../../Types/CopyJobTypes";
import CopyJobStatusWithIcon from "./CopyJobStatusWithIcon";

interface CopyJobDetailsProps {
  job: CopyJobType;
}

const sectionCss = {
  verticalAlign: { display: "flex", flexDirection: "column" } as React.CSSProperties,
  headingText: { marginBottom: "10px" } as React.CSSProperties,
};

const commonProps = {
  minWidth: 100,
  maxWidth: 130,
  styles: {
    root: {
      whiteSpace: "normal",
      lineHeight: "1.2",
      wordBreak: "break-word",
    },
  },
};

const getCopyJobDetailsListColumns = (): IColumn[] => {
  return [
    {
      key: "sourcedbcol",
      name: ContainerCopyMessages.sourceDatabaseLabel,
      fieldName: "sourceDatabaseName",
      ...commonProps,
    },
    {
      key: "sourcecol",
      name: ContainerCopyMessages.sourceContainerLabel,
      fieldName: "sourceContainerName",
      ...commonProps,
    },
    {
      key: "targetdbcol",
      name: ContainerCopyMessages.targetDatabaseLabel,
      fieldName: "targetDatabaseName",
      ...commonProps,
    },
    {
      key: "targetcol",
      name: ContainerCopyMessages.targetContainerLabel,
      fieldName: "targetContainerName",
      ...commonProps,
    },
    {
      key: "statuscol",
      name: ContainerCopyMessages.MonitorJobs.Columns.status,
      fieldName: "jobStatus",
      onRender: ({ jobStatus }: { jobStatus: CopyJobStatusType }) => <CopyJobStatusWithIcon status={jobStatus} />,
      ...commonProps,
    },
  ];
};

const CopyJobDetails: React.FC<CopyJobDetailsProps> = ({ job }) => {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);

  const errorMessageStyle: React.CSSProperties = {
    whiteSpace: "pre-wrap",
    ...(isDarkMode && {
      whiteSpace: "pre-wrap",
      backgroundColor: "var(--colorNeutralBackground2)",
      color: "var(--colorNeutralForeground1)",
      padding: "10px",
      borderRadius: "4px",
    }),
  };

  const selectedContainers = [
    {
      sourceContainerName: job?.Source?.containerName || "N/A",
      sourceDatabaseName: job?.Source?.databaseName || "N/A",
      targetContainerName: job?.Destination?.containerName || "N/A",
      targetDatabaseName: job?.Destination?.databaseName || "N/A",
      jobStatus: job?.Status || "",
    },
  ];

  return (
    <Stack className="copyJobDetailsContainer" tokens={{ childrenGap: 15 }} data-testid="copy-job-details">
      {job.Error ? (
        <Stack.Item data-testid="error-stack" style={sectionCss.verticalAlign}>
          <Text className="bold themeText" style={sectionCss.headingText}>
            {ContainerCopyMessages.errorTitle}
          </Text>
          <Text as="pre" style={errorMessageStyle}>
            {job.Error.message}
          </Text>
        </Stack.Item>
      ) : null}
      <Stack.Item data-testid="selectedcollection-stack">
        <Stack tokens={{ childrenGap: 15 }}>
          <Stack.Item style={sectionCss.verticalAlign}>
            <Text className="bold themeText">{ContainerCopyMessages.MonitorJobs.Columns.lastUpdatedTime}</Text>
            <Text className="themeText">{job.LastUpdatedTime}</Text>
          </Stack.Item>
          <Stack.Item style={sectionCss.verticalAlign}>
            <Text className="bold themeText">{ContainerCopyMessages.sourceAccountLabel}</Text>
            <Text className="themeText">{job.Source?.remoteAccountName}</Text>
          </Stack.Item>
          <Stack.Item style={sectionCss.verticalAlign}>
            <Text className="bold themeText">{ContainerCopyMessages.MonitorJobs.Columns.mode}</Text>
            <Text className="themeText">{job.Mode}</Text>
          </Stack.Item>
        </Stack>
      </Stack.Item>
      <Stack.Item style={sectionCss.verticalAlign}>
        <DetailsList
          items={selectedContainers}
          layoutMode={DetailsListLayoutMode.justified}
          checkboxVisibility={2}
          columns={getCopyJobDetailsListColumns()}
        />
      </Stack.Item>
    </Stack>
  );
};

export default memo(CopyJobDetails, (prevProps, nextProps) => {
  return prevProps.job.ID === nextProps.job.ID && prevProps.job.Error === nextProps.job.Error;
});
