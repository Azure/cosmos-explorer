import { DetailsList, DetailsListLayoutMode, IColumn, Stack, Text } from "@fluentui/react";
import React, { memo } from "react";
import ContainerCopyMessages from "../../ContainerCopyMessages";
import { CopyJobStatusType } from "../../Enums";
import { CopyJobType } from "../../Types";
import CopyJobStatusWithIcon from "./CopyJobStatusWithIcon";

interface CopyJobDetailsProps {
  job: CopyJobType;
}

const sectionCss = {
  verticalAlign: { display: "flex", flexDirection: "column" } as React.CSSProperties,
  headingText: { marginBottom: "10px" } as React.CSSProperties,
};

const commonProps = {
  minWidth: 150,
  maxWidth: 190,
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
      key: "sourcecol",
      name: ContainerCopyMessages.sourceContainerLabel,
      fieldName: "sourceContainerName",
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
  const selectedContainers = [
    {
      sourceContainerName: job?.Source?.containerName || "N/A",
      targetContainerName: job?.Destination?.containerName || "N/A",
      jobStatus: job?.Status || "",
    },
  ];

  return (
    <Stack className="copyJobDetailsContainer" tokens={{ childrenGap: 15 }} data-testid="copy-job-details">
      {job.Error ? (
        <Stack.Item data-testid="error-stack" style={sectionCss.verticalAlign}>
          <Text className="bold" style={sectionCss.headingText}>
            {ContainerCopyMessages.errorTitle}
          </Text>
          <Text as="pre" style={{ whiteSpace: "pre-wrap" }}>
            {job.Error.message}
          </Text>
        </Stack.Item>
      ) : null}
      <Stack.Item data-testid="selectedcollection-stack">
        <Stack tokens={{ childrenGap: 15 }}>
          <Stack.Item style={sectionCss.verticalAlign}>
            <Text className="bold">{ContainerCopyMessages.MonitorJobs.Columns.lastUpdatedTime}</Text>
            <Text>{job.LastUpdatedTime}</Text>
          </Stack.Item>
          <Stack.Item style={sectionCss.verticalAlign}>
            <Text className="bold">{ContainerCopyMessages.sourceAccountLabel}</Text>
            <Text>{job.Source?.remoteAccountName}</Text>
          </Stack.Item>
          <Stack.Item style={sectionCss.verticalAlign}>
            <Text className="bold">{ContainerCopyMessages.MonitorJobs.Columns.mode}</Text>
            <Text>{job.Mode}</Text>
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
