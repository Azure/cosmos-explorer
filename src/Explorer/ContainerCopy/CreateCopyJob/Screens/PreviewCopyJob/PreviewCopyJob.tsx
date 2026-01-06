import { DetailsList, DetailsListLayoutMode, Stack, Text, TextField } from "@fluentui/react";
import React, { useEffect } from "react";
import ContainerCopyMessages from "../../../ContainerCopyMessages";
import { useCopyJobContext } from "../../../Context/CopyJobContext";
import { getDefaultJobName } from "../../../CopyJobUtils";
import FieldRow from "../Components/FieldRow";
import { getPreviewCopyJobDetailsListColumns } from "./Utils/PreviewCopyJobUtils";

const PreviewCopyJob: React.FC = () => {
  const { copyJobState, setCopyJobState } = useCopyJobContext();

  const selectedDatabaseAndContainers = [
    {
      sourceDatabaseName: copyJobState.source?.databaseId,
      sourceContainerName: copyJobState.source?.containerId,
      targetDatabaseName: copyJobState.target?.databaseId,
      targetContainerName: copyJobState.target?.containerId,
    },
  ];

  useEffect(() => {
    onJobNameChange(undefined, getDefaultJobName(selectedDatabaseAndContainers));
  }, []);

  const jobName = copyJobState.jobName;

  const onJobNameChange = (_ev?: React.FormEvent, newValue?: string) => {
    setCopyJobState((prevState) => ({
      ...prevState,
      jobName: newValue || "",
    }));
  };
  return (
    <Stack tokens={{ childrenGap: 20 }} className="previewCopyJobContainer" data-test="Panel:PreviewCopyJob">
      <FieldRow label={ContainerCopyMessages.jobNameLabel}>
        <TextField data-test="job-name-textfield" value={jobName} onChange={onJobNameChange} />
      </FieldRow>
      <Stack>
        <Text className="bold themeText">{ContainerCopyMessages.sourceSubscriptionLabel}</Text>
        <Text data-test="source-subscription-name" className="themeText">{copyJobState.source?.subscription?.displayName}</Text>
      </Stack>
      <Stack>
        <Text className="bold themeText">{ContainerCopyMessages.sourceAccountLabel}</Text>
        <Text data-test="source-account-name" className="themeText">{copyJobState.source?.account?.name}</Text>
      </Stack>
      <Stack>
        <DetailsList
          items={selectedDatabaseAndContainers}
          layoutMode={DetailsListLayoutMode.justified}
          checkboxVisibility={2}
          columns={getPreviewCopyJobDetailsListColumns()}
        />
      </Stack>
    </Stack>
  );
};

export default PreviewCopyJob;
