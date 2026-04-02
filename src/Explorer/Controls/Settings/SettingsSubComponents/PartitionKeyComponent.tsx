import {
  DefaultButton,
  FontWeights,
  IMessageBarStyles,
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
import { Keys, t } from "Localization";
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
  isReadOnly?: boolean; // true: cannot change partition key
}

const darkThemeMessageBarStyles: Partial<IMessageBarStyles> = {
  root: {
    selectors: {
      "&.ms-MessageBar--warning": {
        backgroundColor: "var(--colorStatusWarningBackground1)",
        border: "1px solid var(--colorStatusWarningBorder1)",
      },
      ".ms-MessageBar-icon": {
        color: "var(--colorNeutralForeground1)",
      },
      ".ms-MessageBar-text": {
        color: "var(--colorNeutralForeground1)",
      },
    },
  },
};

export const PartitionKeyComponent: React.FC<PartitionKeyComponentProps> = ({
  database,
  collection,
  explorer,
  isReadOnly,
}) => {
  const { dataTransferJobs } = useDataTransferJobs();
  const [portalDataTransferJob, setPortalDataTransferJob] = React.useState<DataTransferJobGetResults>(null);

  React.useEffect(() => {
    if (isReadOnly) {
      return;
    }

    const loadDataTransferJobs = refreshDataTransferOperations;
    loadDataTransferJobs();
  }, [isReadOnly]);

  React.useEffect(() => {
    const currentJob = findPortalDataTransferJob();
    setPortalDataTransferJob(currentJob);
    startPollingforUpdate(currentJob);
  }, [dataTransferJobs]);

  const isHierarchicalPartitionedContainer = (): boolean => collection.partitionKey?.kind === "MultiHash";

  const getPartitionKeyValue = (): string => {
    return (collection.partitionKeyProperties || []).map((property) => "/" + property).join(", ");
  };

  const partitionKeyName = t(Keys.controls.settings.partitionKey.partitionKey);
  const partitionKeyValue = getPartitionKeyValue();

  const textHeadingStyle = {
    root: { fontWeight: FontWeights.semibold, fontSize: 16, color: "var(--colorNeutralForeground1)" },
  };

  const textSubHeadingStyle = {
    root: { fontWeight: FontWeights.semibold, color: "var(--colorNeutralForeground1)" },
  };
  const textSubHeadingStyle1 = {
    root: { color: "var(--colorNeutralForeground1)" },
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
    const processedCountString =
      totalCount > 0
        ? t(Keys.controls.settings.partitionKeyEditor.documentsProcessed, {
            processedCount: String(processedCount),
            totalCount: String(totalCount),
          })
        : "";
    return `${portalDataTransferJob?.properties?.status} ${processedCountString}`;
  };

  const startPartitionkeyChangeWorkflow = () => {
    useSidePanel.getState().openSidePanel(
      t(Keys.controls.settings.partitionKeyEditor.changePartitionKey, {
        partitionKeyName: t(Keys.controls.settings.partitionKey.partitionKey).toLowerCase(),
      }),
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
        {!isReadOnly && (
          <Text styles={textHeadingStyle}>
            {t(Keys.controls.settings.partitionKeyEditor.changePartitionKey, {
              partitionKeyName: partitionKeyName.toLowerCase(),
            })}
          </Text>
        )}
        <Stack horizontal tokens={{ childrenGap: 20 }}>
          <Stack tokens={{ childrenGap: 5 }}>
            <Text styles={textSubHeadingStyle}>
              {t(Keys.controls.settings.partitionKeyEditor.currentPartitionKey, {
                partitionKeyName: partitionKeyName.toLowerCase(),
              })}
            </Text>
            <Text styles={textSubHeadingStyle}>{t(Keys.controls.settings.partitionKeyEditor.partitioning)}</Text>
          </Stack>
          <Stack tokens={{ childrenGap: 5 }} data-test="partition-key-values">
            <Text styles={textSubHeadingStyle1}>{partitionKeyValue}</Text>
            <Text styles={textSubHeadingStyle1}>
              {isHierarchicalPartitionedContainer()
                ? t(Keys.controls.settings.partitionKeyEditor.hierarchical)
                : t(Keys.controls.settings.partitionKeyEditor.nonHierarchical)}
            </Text>
          </Stack>
        </Stack>
      </Stack>

      {!isReadOnly && (
        <>
          <MessageBar
            data-test="partition-key-warning"
            messageBarType={MessageBarType.warning}
            messageBarIconProps={{ iconName: "WarningSolid", className: "messageBarWarningIcon" }}
            styles={darkThemeMessageBarStyles}
          >
            {t(Keys.controls.settings.partitionKeyEditor.safeguardWarning)}
            <Link
              href="https://learn.microsoft.com/azure/cosmos-db/container-copy#how-does-container-copy-work"
              target="_blank"
              underline
              style={{ color: "var(--colorBrandForeground1)" }}
            >
              {t(Keys.common.learnMore)}
            </Link>
          </MessageBar>
          <Text styles={{ root: { color: "var(--colorNeutralForeground1)" } }}>
            {t(Keys.controls.settings.partitionKeyEditor.changeDescription)}
          </Text>
          {configContext.platform !== Platform.Emulator && (
            <PrimaryButton
              data-test="change-partition-key-button"
              styles={{ root: { width: "fit-content" } }}
              text={t(Keys.controls.settings.partitionKeyEditor.changeButton)}
              onClick={startPartitionkeyChangeWorkflow}
              disabled={isCurrentJobInProgress(portalDataTransferJob)}
            />
          )}
          {portalDataTransferJob && (
            <Stack>
              <Text styles={textHeadingStyle}>
                {t(Keys.controls.settings.partitionKeyEditor.changeJob, { partitionKeyName })}
              </Text>
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
                  <DefaultButton
                    text={t(Keys.controls.settings.partitionKeyEditor.cancelButton)}
                    onClick={() => cancelRunningDataTransferJob(portalDataTransferJob)}
                  />
                )}
              </Stack>
            </Stack>
          )}
        </>
      )}
    </Stack>
  );
};
