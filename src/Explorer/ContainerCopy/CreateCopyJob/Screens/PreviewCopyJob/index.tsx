import { DetailsList, DetailsListLayoutMode, Stack, Text, TextField } from '@fluentui/react';
import FieldRow from 'Explorer/ContainerCopy/CreateCopyJob/Screens/Components/FieldRow';
import React from 'react';
import ContainerCopyMessages from '../../../ContainerCopyMessages';
import { useCopyJobContext } from '../../../Context/CopyJobContext';
import { getPreviewCopyJobDetailsListColumns } from './Utils/PreviewCopyJobUtils';

const PreviewCopyJob: React.FC = () => {
    const { copyJobState, setCopyJobState } = useCopyJobContext();

    const selectedDatabaseAndContainers = [{
        sourceDatabaseName: copyJobState.source?.databaseId,
        sourceContainerName: copyJobState.source?.containerId,
        targetDatabaseName: copyJobState.target?.databaseId,
        targetContainerName: copyJobState.target?.containerId,
    }];
    const jobName = copyJobState.jobName;

    const onJobNameChange = (_ev?: React.FormEvent, newValue?: string) => {
        setCopyJobState((prevState) => ({
            ...prevState,
            jobName: newValue || '',
        }));
    };
    return (
        <Stack tokens={{ childrenGap: 20 }} className="previewCopyJobContainer">
            <FieldRow label={ContainerCopyMessages.jobNameLabel}>
                <TextField
                    value={jobName}
                    onChange={onJobNameChange}
                />
            </FieldRow>
            <Stack>
                <Text className='bold'>{ContainerCopyMessages.sourceSubscriptionLabel}</Text>
                <Text>{copyJobState.source?.subscription?.displayName}</Text>
            </Stack>
            <Stack>
                <Text className='bold'>{ContainerCopyMessages.sourceAccountLabel}</Text>
                <Text>{copyJobState.source?.account?.name}</Text>
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
