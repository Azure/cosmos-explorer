import { DetailsList, DetailsListLayoutMode, Stack, Text } from "@fluentui/react";
import { getPreviewCopyJobDetailsListColumns } from "Explorer/ContainerCopy/CreateCopyJob/Screens/PreviewCopyJob/Utils/PreviewCopyJobUtils";
import React, { memo } from "react";
import ContainerCopyMessages from "../../ContainerCopyMessages";
import { CopyJobType } from "../../Types";

interface CopyJobDetailsProps {
  job: CopyJobType;
}

const sectionCss = {
  verticalAlign: { display: "flex", flexDirection: "column", marginBottom: "20px" } as React.CSSProperties,
  headingText: { marginBottom: "10px" } as React.CSSProperties,
};

const CopyJobDetails: React.FC<CopyJobDetailsProps> = ({ job }) => {
  const selectedContainers = [
    {
      sourceDatabaseName: job?.Source?.databaseName || "N/A",
      sourceContainerName: job?.Source?.containerName || "N/A",
      targetDatabaseName: job?.Destination?.databaseName || "N/A",
      targetContainerName: job?.Destination?.containerName || "N/A",
    },
  ];

  return (
    <Stack className="copyJobDetailsContainer" tokens={{ childrenGap: 8 }} data-testid="copy-job-details">
      {job.Error ? (
        <Stack.Item data-testid="error-stack" style={sectionCss.verticalAlign}>
          <Text className="bold" style={sectionCss.headingText}>
            {ContainerCopyMessages.errorTitle}
          </Text>
          <Text>{job.Error.message}</Text>
        </Stack.Item>
      ) : null}
      <Stack.Item data-testid="selectedcollection-stack">
        <Stack.Item style={sectionCss.verticalAlign}>
          <Text className="bold">{ContainerCopyMessages.sourceAccountLabel}</Text>
          <Text>{job.Source?.remoteAccountName}</Text>
        </Stack.Item>
        <Stack.Item style={sectionCss.verticalAlign}>
          {/* <Text className="bold">{ContainerCopyMessages.selectedContainers}</Text> */}
          <DetailsList
            items={selectedContainers}
            layoutMode={DetailsListLayoutMode.justified}
            checkboxVisibility={2}
            columns={getPreviewCopyJobDetailsListColumns()}
          />
        </Stack.Item>
      </Stack.Item>
    </Stack>
  );
};

export default memo(CopyJobDetails, (prevProps, nextProps) => {
  return prevProps.job.ID === nextProps.job.ID && prevProps.job.Error === nextProps.job.Error;
});
