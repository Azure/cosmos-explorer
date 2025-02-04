import {
  DefaultButton,
  FontWeights,
  Link,
  MessageBar,
  MessageBarType,
  PrimaryButton,
  ProgressIndicator,
  Stack,
  Text,
} from "@fluentui/react";
import * as React from "react";
import * as ViewModels from "../../../../Contracts/ViewModels";

import { handleError } from "Common/ErrorHandlingUtils";
import { cancelDataTransferJob, pollDataTransferJob } from "Common/dataAccess/dataTransfers";
import { Platform, configContext } from "ConfigContext";
import Explorer from "Explorer/Explorer";
import { ChangePartitionKeyPane } from "Explorer/Panes/ChangePartitionKeyPane/ChangePartitionKeyPane";
import {
  CosmosSqlDataTransferDataSourceSink,
  DataTransferJobGetResults,
} from "Utils/arm/generatedClients/dataTransferService/types";
import { refreshDataTransferJobs, useDataTransferJobs } from "hooks/useDataTransferJobs";
import { useSidePanel } from "hooks/useSidePanel";
import { userContext } from "../../../../UserContext";

export interface PartitionKeyComponentProps {
  database: ViewModels.Database;
  collection: ViewModels.Collection;
  explorer: Explorer;
}

export const PartitionKeyComponent: React.FC<PartitionKeyComponentProps> = ({ database, collection, explorer }) => {
  const { dataTransferJobs } = useDataTransferJobs();
  const [portalDataTransferJob, setPortalDataTransferJob] = React.useState<DataTransferJobGetResults>(null);

  React.useEffect(() => {
    const loadDataTransferJobs = refreshDataTransferOperations;
    loadDataTransferJobs();
  }, []);

  React.useEffect(() => {
    const currentJob = findPortalDataTransferJob();
    setPortalDataTransferJob(currentJob);
    startPollingforUpdate(currentJob);
  }, [dataTransferJobs]);

  const isHierarchicalPartitionedContainer = (): boolean => collection.partitionKey?.kind === "MultiHash";

  const getPartitionKeyValue = (): string => {
    return (collection.partitionKeyProperties || []).map((property) => "/" + property).join(", ");
  };

  const partitionKeyName = "Partition key";
  const partitionKeyValue = getPartitionKeyValue();

  const textHeadingStyle = {
    root: { fontWeight: FontWeights.semibold, fontSize: 16 },
  };

  const textSubHeadingStyle = {
    root: { fontWeight: FontWeights.semibold },
  };

  const startPollingforUpdate = (currentJob: DataTransferJobGetResults) => {
    if (isCurrentJobInProgress(currentJob)) {
      const jobName = currentJob?.properties?.jobName;
      try {
        pollDataTransferJob(
          jobName,
          userContext.subscriptionId,
          userContext.resourceGroup,
          userContext.databaseAccount.name,
        );
      } catch (error) {
        handleError(error, "ChangePartitionKey", `Failed to complete data transfer job ${jobName}`);
      }
    }
  };

  const cancelRunningDataTransferJob = async (currentJob: DataTransferJobGetResults) => {
    await cancelDataTransferJob(
      userContext.subscriptionId,
      userContext.resourceGroup,
      userContext.databaseAccount.name,
      currentJob?.properties?.jobName,
    );
  };

  const isCurrentJobInProgress = (currentJob: DataTransferJobGetResults) => {
    const jobStatus = currentJob?.properties?.status;
    return (
      jobStatus &&
      jobStatus !== "Completed" &&
      jobStatus !== "Cancelled" &&
      jobStatus !== "Failed" &&
      jobStatus !== "Faulted"
    );
  };

  const refreshDataTransferOperations = async () => {
    await refreshDataTransferJobs(
      userContext.subscriptionId,
      userContext.resourceGroup,
      userContext.databaseAccount.name,
    );
  };

  const findPortalDataTransferJob = (): DataTransferJobGetResults => {
    return dataTransferJobs.find((feed: DataTransferJobGetResults) => {
      const sourceSink: CosmosSqlDataTransferDataSourceSink = feed?.properties
        ?.source as CosmosSqlDataTransferDataSourceSink;
      return sourceSink.databaseName === collection.databaseId && sourceSink.containerName === collection.id();
    });
  };

  const getProgressDescription = (): string => {
    const processedCount = portalDataTransferJob?.properties?.processedCount;
    const totalCount = portalDataTransferJob?.properties?.totalCount;
    const processedCountString = totalCount > 0 ? `(${processedCount} of ${totalCount} documents processed)` : "";
    return `${portalDataTransferJob?.properties?.status} ${processedCountString}`;
  };

  const startPartitionkeyChangeWorkflow = () => {
    useSidePanel
      .getState()
      .openSidePanel(
        "Change partition key",
        <ChangePartitionKeyPane
          sourceDatabase={database}
          sourceCollection={collection}
          explorer={explorer}
          onClose={refreshDataTransferOperations}
        />,
      );
  };

  const getPercentageComplete = () => {
    const jobStatus = portalDataTransferJob?.properties?.status;
    const isCompleted = jobStatus === "Completed";
    if (isCompleted) {
      return 1;
    }
    const processedCount = portalDataTransferJob?.properties?.processedCount;
    const totalCount = portalDataTransferJob?.properties?.totalCount;
    const isJobInProgress = isCurrentJobInProgress(portalDataTransferJob);
    return isJobInProgress ? (totalCount > 0 ? processedCount / totalCount : null) : 0;
  };

  return (
    <Stack tokens={{ childrenGap: 20 }} styles={{ root: { maxWidth: 600 } }}>
      <Stack tokens={{ childrenGap: 10 }}>
        <Text styles={textHeadingStyle}>Change {partitionKeyName.toLowerCase()}</Text>
        <Stack horizontal tokens={{ childrenGap: 20 }}>
          <Stack tokens={{ childrenGap: 5 }}>
            <Text styles={textSubHeadingStyle}>Current {partitionKeyName.toLowerCase()}</Text>
            <Text styles={textSubHeadingStyle}>Partitioning</Text>
          </Stack>
          <Stack tokens={{ childrenGap: 5 }}>
            <Text>{partitionKeyValue}</Text>
            <Text>{isHierarchicalPartitionedContainer() ? "Hierarchical" : "Non-hierarchical"}</Text>
          </Stack>
        </Stack>
      </Stack>
      <MessageBar messageBarType={MessageBarType.warning}>
        To safeguard the integrity of the data being copied to the new container, ensure that no updates are made to the
        source container for the entire duration of the partition key change process.
        <Link
          href="https://learn.microsoft.com/azure/cosmos-db/container-copy#how-does-container-copy-work"
          target="_blank"
          underline
        >
          Learn more
        </Link>
      </MessageBar>
      <Text>
        To change the partition key, a new destination container must be created or an existing destination container
        selected. Data will then be copied to the destination container.
      </Text>
      {configContext.platform !== Platform.Emulator && (
        <PrimaryButton
          styles={{ root: { width: "fit-content" } }}
          text="Change"
          onClick={startPartitionkeyChangeWorkflow}
          disabled={isCurrentJobInProgress(portalDataTransferJob)}
        />
      )}
      {portalDataTransferJob && (
        <Stack>
          <Text styles={textHeadingStyle}>{partitionKeyName} change job</Text>
          <Stack
            horizontal
            tokens={{ childrenGap: 20 }}
            styles={{
              root: {
                alignItems: "center",
              },
            }}
          >
            <ProgressIndicator
              label={portalDataTransferJob?.properties?.jobName}
              description={getProgressDescription()}
              percentComplete={getPercentageComplete()}
              styles={{
                root: {
                  width: "85%",
                },
              }}
            ></ProgressIndicator>
            {isCurrentJobInProgress(portalDataTransferJob) && (
              <DefaultButton text="Cancel" onClick={() => cancelRunningDataTransferJob(portalDataTransferJob)} />
            )}
          </Stack>
        </Stack>
      )}
    </Stack>
  );
};
