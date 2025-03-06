import {
  DirectionalHint,
  Dropdown,
  DropdownMenuItemType,
  Icon,
  IDropdownOption,
  Link,
  Separator,
  Stack,
  Text,
  TooltipHost,
} from "@fluentui/react";
import * as Constants from "Common/Constants";
import { createMaterializedView } from "Common/dataAccess/createMaterializedView";
import { getErrorMessage, getErrorStack } from "Common/ErrorHandlingUtils";
import * as DataModels from "Contracts/DataModels";
import { FullTextIndex, FullTextPolicy, VectorEmbedding, VectorIndex } from "Contracts/DataModels";
import { Collection, Database } from "Contracts/ViewModels";
import Explorer from "Explorer/Explorer";
import {
  AllPropertiesIndexed,
  FullTextPolicyDefault,
  getPartitionKey,
  isSynapseLinkEnabled,
  parseUniqueKeys,
  scrollToSection,
  shouldShowAnalyticalStoreOptions,
} from "Explorer/Panes/AddCollectionPanel/AddCollectionPanelUtility";
import { AddMVAdvancedComponent } from "Explorer/Panes/AddMaterializedViewPanel/AddMVAdvancedComponent";
import { AddMVAnalyticalStoreComponent } from "Explorer/Panes/AddMaterializedViewPanel/AddMVAnalyticalStoreComponent";
import { AddMVFullTextSearchComponent } from "Explorer/Panes/AddMaterializedViewPanel/AddMVFullTextSearchComponent";
import { AddMVPartitionKeyComponent } from "Explorer/Panes/AddMaterializedViewPanel/AddMVPartitionKeyComponent";
import { AddMVThroughputComponent } from "Explorer/Panes/AddMaterializedViewPanel/AddMVThroughputComponent";
import { AddMVUniqueKeysComponent } from "Explorer/Panes/AddMaterializedViewPanel/AddMVUniqueKeysComponent";
import { AddMVVectorSearchComponent } from "Explorer/Panes/AddMaterializedViewPanel/AddMVVectorSearchComponent";
import { PanelFooterComponent } from "Explorer/Panes/PanelFooterComponent";
import { PanelInfoErrorComponent } from "Explorer/Panes/PanelInfoErrorComponent";
import { PanelLoadingScreen } from "Explorer/Panes/PanelLoadingScreen";
import { useDatabases } from "Explorer/useDatabases";
import { useSidePanel } from "hooks/useSidePanel";
import React, { useEffect, useState } from "react";
import { CollectionCreation } from "Shared/Constants";
import { Action } from "Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "Shared/Telemetry/TelemetryProcessor";
import { userContext } from "UserContext";
import { isFullTextSearchEnabled, isServerlessAccount, isVectorSearchEnabled } from "Utils/CapabilityUtils";

export interface AddMaterializedViewPanelProps {
  explorer: Explorer;
  sourceContainer?: Collection;
}
export const AddMaterializedViewPanel = (props: AddMaterializedViewPanelProps): JSX.Element => {
  const { explorer, sourceContainer } = props;

  const [sourceContainerOptions, setSourceContainerOptions] = useState<IDropdownOption[]>();
  const [selectedSourceContainer, setSelectedSourceContainer] = useState<Collection>(sourceContainer);
  const [materializedViewId, setMaterializedViewId] = useState<string>();
  const [definition, setDefinition] = useState<string>();
  const [partitionKey, setPartitionKey] = useState<string>(getPartitionKey());
  const [subPartitionKeys, setSubPartitionKeys] = useState<string[]>([]);
  const [useHashV1, setUseHashV1] = useState<boolean>();
  const [enableDedicatedThroughput, setEnabledDedicatedThroughput] = useState<boolean>();
  const [isThroughputCapExceeded, setIsThroughputCapExceeded] = useState<boolean>();
  const [uniqueKeys, setUniqueKeys] = useState<string[]>([]);
  const [enableAnalyticalStore, setEnableAnalyticalStore] = useState<boolean>();
  const [vectorEmbeddingPolicy, setVectorEmbeddingPolicy] = useState<VectorEmbedding[]>();
  const [vectorIndexingPolicy, setVectorIndexingPolicy] = useState<VectorIndex[]>();
  const [vectorPolicyValidated, setVectorPolicyValidated] = useState<boolean>();
  const [fullTextPolicy, setFullTextPolicy] = useState<FullTextPolicy>(FullTextPolicyDefault);
  const [fullTextIndexes, setFullTextIndexes] = useState<FullTextIndex[]>();
  const [fullTextPolicyValidated, setFullTextPolicyValidated] = useState<boolean>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [showErrorDetails, setShowErrorDetails] = useState<boolean>();
  const [isExecuting, setIsExecuting] = useState<boolean>();

  useEffect(() => {
    const sourceContainerOptions: IDropdownOption[] = [];
    useDatabases.getState().databases.forEach((database: Database) => {
      sourceContainerOptions.push({
        key: database.rid,
        text: database.id(),
        itemType: DropdownMenuItemType.Header,
      });

      database.collections().forEach((collection: Collection) => {
        const isMaterializedView: boolean = !!collection.materializedViewDefinition();
        sourceContainerOptions.push({
          key: collection.rid,
          text: collection.id(),
          disabled: isMaterializedView,
          ...(isMaterializedView && {
            title: "This is a materialized view.",
          }),
          data: collection,
        });
      });
    });

    setSourceContainerOptions(sourceContainerOptions);
  }, []);

  useEffect(() => {
    scrollToSection("panelContainer");
  }, [errorMessage]);

  let materializedViewThroughput: number;
  let isMaterializedViewAutoscale: boolean;
  let isCostAcknowledged: boolean;

  const materializedViewThroughputOnChange = (materializedViewThroughputValue: number): void => {
    materializedViewThroughput = materializedViewThroughputValue;
  };

  const isMaterializedViewAutoscaleOnChange = (isMaterializedViewAutoscaleValue: boolean): void => {
    isMaterializedViewAutoscale = isMaterializedViewAutoscaleValue;
  };

  const isCostAknowledgedOnChange = (isCostAcknowledgedValue: boolean): void => {
    isCostAcknowledged = isCostAcknowledgedValue;
  };

  const isSelectedSourceContainerSharedThroughput = (): boolean => {
    if (!selectedSourceContainer) {
      return false;
    }

    return !!selectedSourceContainer.getDatabase().offer();
  };

  const showCollectionThroughputInput = (): boolean => {
    if (isServerlessAccount()) {
      return false;
    }

    if (enableDedicatedThroughput) {
      return true;
    }

    return !!selectedSourceContainer && !isSelectedSourceContainerSharedThroughput();
  };

  const showVectorSearchParameters = (): boolean => {
    return isVectorSearchEnabled() && (isServerlessAccount() || showCollectionThroughputInput());
  };

  const showFullTextSearchParameters = (): boolean => {
    return isFullTextSearchEnabled() && (isServerlessAccount() || showCollectionThroughputInput());
  };

  const getAnalyticalStorageTtl = (): number => {
    if (!isSynapseLinkEnabled()) {
      return undefined;
    }

    if (!shouldShowAnalyticalStoreOptions()) {
      return undefined;
    }

    if (enableAnalyticalStore) {
      // TODO: always default to 90 days once the backend hotfix is deployed
      return userContext.features.ttl90Days
        ? Constants.AnalyticalStorageTtl.Days90
        : Constants.AnalyticalStorageTtl.Infinite;
    }

    return Constants.AnalyticalStorageTtl.Disabled;
  };

  const validateInputs = (): boolean => {
    if (!selectedSourceContainer) {
      setErrorMessage("Please select a source container");
      return false;
    }

    if (materializedViewThroughput > CollectionCreation.DefaultCollectionRUs100K && !isCostAcknowledged) {
      const errorMessage = isMaterializedViewAutoscale
        ? "Please acknowledge the estimated monthly spend."
        : "Please acknowledge the estimated daily spend.";
      setErrorMessage(errorMessage);
      return false;
    }

    if (materializedViewThroughput > CollectionCreation.MaxRUPerPartition) {
      setErrorMessage("Unsharded collections support up to 10,000 RUs");
      return false;
    }

    if (showVectorSearchParameters()) {
      if (!vectorPolicyValidated) {
        setErrorMessage("Please fix errors in container vector policy");
        return false;
      }

      if (!fullTextPolicyValidated) {
        setErrorMessage("Please fix errors in container full text search policy");
        return false;
      }
    }

    return true;
  };

  const submit = async (event?: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event?.preventDefault();

    if (!validateInputs()) {
      return;
    }

    const materializedViewIdTrimmed: string = materializedViewId.trim();

    const materializedViewDefinition: DataModels.MaterializedViewDefinition = {
      sourceCollectionId: sourceContainer.id(),
      definition: definition,
    };

    const partitionKeyTrimmed: string = partitionKey.trim();

    const uniqueKeyPolicy: DataModels.UniqueKeyPolicy = parseUniqueKeys(uniqueKeys);
    const partitionKeyVersion = useHashV1 ? undefined : 2;
    const partitionKeyPaths: DataModels.PartitionKey = partitionKeyTrimmed
      ? {
          paths: [
            partitionKeyTrimmed,
            ...(userContext.apiType === "SQL" && subPartitionKeys.length > 0 ? subPartitionKeys : []),
          ],
          kind: userContext.apiType === "SQL" && subPartitionKeys.length > 0 ? "MultiHash" : "Hash",
          version: partitionKeyVersion,
        }
      : undefined;

    const indexingPolicy: DataModels.IndexingPolicy = AllPropertiesIndexed;
    let vectorEmbeddingPolicyFinal: DataModels.VectorEmbeddingPolicy;

    if (showVectorSearchParameters()) {
      indexingPolicy.vectorIndexes = vectorIndexingPolicy;
      vectorEmbeddingPolicyFinal = {
        vectorEmbeddings: vectorEmbeddingPolicy,
      };
    }

    if (showFullTextSearchParameters()) {
      indexingPolicy.fullTextIndexes = fullTextIndexes;
    }

    const telemetryData: TelemetryProcessor.TelemetryData = {
      database: {
        id: selectedSourceContainer.databaseId,
        shared: isSelectedSourceContainerSharedThroughput(),
      },
      collection: {
        id: materializedViewIdTrimmed,
        throughput: materializedViewThroughput,
        isAutoscale: isMaterializedViewAutoscale,
        partitionKeyPaths,
        uniqueKeyPolicy,
        collectionWithDedicatedThroughput: enableDedicatedThroughput,
      },
      subscriptionQuotaId: userContext.quotaId,
      dataExplorerArea: Constants.Areas.ContextualPane,
    };

    const startKey: number = TelemetryProcessor.traceStart(Action.CreateCollection, telemetryData);
    const databaseLevelThroughput: boolean = isSelectedSourceContainerSharedThroughput() && !enableDedicatedThroughput;

    let offerThroughput: number;
    let autoPilotMaxThroughput: number;

    if (!databaseLevelThroughput) {
      if (isMaterializedViewAutoscale) {
        autoPilotMaxThroughput = materializedViewThroughput;
      } else {
        offerThroughput = materializedViewThroughput;
      }
    }

    const createMaterializedViewParams: DataModels.CreateMaterializedViewsParams = {
      materializedViewId: materializedViewIdTrimmed,
      materializedViewDefinition: materializedViewDefinition,
      databaseId: selectedSourceContainer.databaseId,
      databaseLevelThroughput: databaseLevelThroughput,
      offerThroughput: offerThroughput,
      autoPilotMaxThroughput: autoPilotMaxThroughput,
      analyticalStorageTtl: getAnalyticalStorageTtl(),
      indexingPolicy: indexingPolicy,
      partitionKey: partitionKeyPaths,
      uniqueKeyPolicy: uniqueKeyPolicy,
      vectorEmbeddingPolicy: vectorEmbeddingPolicyFinal,
      fullTextPolicy: fullTextPolicy,
    };

    setIsExecuting(true);

    try {
      await createMaterializedView(createMaterializedViewParams);
      await explorer.refreshAllDatabases();
      TelemetryProcessor.traceSuccess(Action.CreateMaterializedView, telemetryData, startKey);
      useSidePanel.getState().closeSidePanel();
    } catch (error) {
      const errorMessage: string = getErrorMessage(error);
      setErrorMessage(errorMessage);
      setShowErrorDetails(true);
      const failureTelemetryData = { ...telemetryData, error: errorMessage, errorStack: getErrorStack(error) };
      TelemetryProcessor.traceFailure(Action.CreateMaterializedView, failureTelemetryData, startKey);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <form className="panelFormWrapper" id="panelMaterializedView" onSubmit={submit}>
      {errorMessage && (
        <PanelInfoErrorComponent message={errorMessage} messageType="error" showErrorDetails={showErrorDetails} />
      )}
      <div className="panelMainContent">
        <Stack>
          <Stack horizontal>
            <span className="mandatoryStar">*&nbsp;</span>
            <Text className="panelTextBold" variant="small">
              Source container id
            </Text>
          </Stack>
          <Dropdown
            placeholder="Choose existing container"
            options={sourceContainerOptions}
            defaultSelectedKey={sourceContainer?.rid}
            styles={{ title: { height: 27, lineHeight: 27 }, dropdownItem: { fontSize: 12 } }}
            style={{ width: 300, fontSize: 12 }}
            onChange={(_, options: IDropdownOption) => setSelectedSourceContainer(options.data as Collection)}
          />
          <Separator className="panelSeparator" />
          <Stack horizontal>
            <span className="mandatoryStar">*&nbsp;</span>
            <Text className="panelTextBold" variant="small">
              View container id
            </Text>
          </Stack>
          <input
            id="materializedViewId"
            type="text"
            aria-required
            required
            autoComplete="off"
            pattern="[^/?#\\]*[^/?# \\]"
            title="May not end with space nor contain characters '\' '/' '#' '?'"
            placeholder={`e.g., viewByEmailId`}
            size={40}
            className="panelTextField"
            value={materializedViewId}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setMaterializedViewId(event.target.value)}
          />
          <Stack horizontal>
            <span className="mandatoryStar">*&nbsp;</span>
            <Text className="panelTextBold" variant="small">
              Materialized View Definition
            </Text>
            <TooltipHost
              directionalHint={DirectionalHint.bottomLeftEdge}
              content={
                <Link
                  href="https://learn.microsoft.com/en-us/azure/cosmos-db/nosql/materialized-views#defining-materialized-views"
                  target="blank"
                >
                  Learn more about defining materialized views.
                </Link>
              }
            >
              <Icon role="button" iconName="Info" className="panelInfoIcon" tabIndex={0} />
            </TooltipHost>
          </Stack>
          <input
            id="materializedViewDefinition"
            type="text"
            aria-required
            required
            autoComplete="off"
            placeholder={"SELECT c.email, c.accountId FROM c"}
            size={40}
            className="panelTextField"
            value={definition}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setDefinition(event.target.value)}
          />
          <AddMVPartitionKeyComponent
            {...{ partitionKey, setPartitionKey, subPartitionKeys, setSubPartitionKeys, useHashV1, setUseHashV1 }}
          />
          <AddMVThroughputComponent
            {...{
              selectedSourceContainer,
              enableDedicatedThroughput,
              setEnabledDedicatedThroughput,
              isSelectedSourceContainerSharedThroughput,
              showCollectionThroughputInput,
              materializedViewThroughputOnChange,
              isMaterializedViewAutoscaleOnChange,
              setIsThroughputCapExceeded,
              isCostAknowledgedOnChange,
            }}
          />
          <AddMVUniqueKeysComponent {...{ uniqueKeys, setUniqueKeys }} />
          {shouldShowAnalyticalStoreOptions() && (
            <AddMVAnalyticalStoreComponent {...{ explorer, enableAnalyticalStore, setEnableAnalyticalStore }} />
          )}
          {showVectorSearchParameters() && (
            <AddMVVectorSearchComponent
              {...{
                vectorEmbeddingPolicy,
                setVectorEmbeddingPolicy,
                vectorIndexingPolicy,
                setVectorIndexingPolicy,
                vectorPolicyValidated,
                setVectorPolicyValidated,
              }}
            />
          )}
          {showFullTextSearchParameters() && (
            <AddMVFullTextSearchComponent
              {...{ fullTextPolicy, setFullTextPolicy, setFullTextIndexes, setFullTextPolicyValidated }}
            />
          )}
          <AddMVAdvancedComponent {...{ useHashV1, setUseHashV1, setSubPartitionKeys }} />
        </Stack>
        <PanelFooterComponent buttonLabel="OK" isButtonDisabled={isThroughputCapExceeded} />
        {isExecuting && (<PanelLoadingScreen />)}
      </div>
    </form>
  );
};
