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
import { createGlobalSecondaryIndex } from "Common/dataAccess/createMaterializedView";
import { getErrorMessage, getErrorStack } from "Common/ErrorHandlingUtils";
import * as DataModels from "Contracts/DataModels";
import { FullTextIndex, FullTextPolicy, VectorEmbedding, VectorIndex } from "Contracts/DataModels";
import { Collection, Database } from "Contracts/ViewModels";
import Explorer from "Explorer/Explorer";
import {
  AllPropertiesIndexed,
  FullTextPolicyDefault,
  getPartitionKey,
  scrollToSection,
} from "Explorer/Panes/AddCollectionPanel/AddCollectionPanelUtility";
import {
  chooseSourceContainerStyle,
  chooseSourceContainerStyles,
} from "Explorer/Panes/AddGlobalSecondaryIndexPanel/AddGlobalSecondaryIndexPanelStyles";
import { AdvancedComponent } from "Explorer/Panes/AddGlobalSecondaryIndexPanel/Components/AdvancedComponent";
import { FullTextSearchComponent } from "Explorer/Panes/AddGlobalSecondaryIndexPanel/Components/FullTextSearchComponent";
import { PartitionKeyComponent } from "Explorer/Panes/AddGlobalSecondaryIndexPanel/Components/PartitionKeyComponent";
import { ThroughputComponent } from "Explorer/Panes/AddGlobalSecondaryIndexPanel/Components/ThroughputComponent";
import { VectorSearchComponent } from "Explorer/Panes/AddGlobalSecondaryIndexPanel/Components/VectorSearchComponent";
import { PanelFooterComponent } from "Explorer/Panes/PanelFooterComponent";
import { PanelInfoErrorComponent } from "Explorer/Panes/PanelInfoErrorComponent";
import { PanelLoadingScreen } from "Explorer/Panes/PanelLoadingScreen";
import { useDatabases } from "Explorer/useDatabases";
import { useSidePanel } from "hooks/useSidePanel";
import React, { MutableRefObject, useEffect, useRef, useState } from "react";
import { CollectionCreation } from "Shared/Constants";
import { Action } from "Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "Shared/Telemetry/TelemetryProcessor";
import { userContext } from "UserContext";
import { isServerlessAccount, isVectorSearchEnabled } from "Utils/CapabilityUtils";
import { ValidCosmosDbIdDescription, ValidCosmosDbIdInputPattern } from "Utils/ValidationUtils";

export interface AddGlobalSecondaryIndexPanelProps {
  explorer: Explorer;
  sourceContainer?: Collection;
}
export const AddGlobalSecondaryIndexPanel = (props: AddGlobalSecondaryIndexPanelProps): JSX.Element => {
  const { explorer, sourceContainer } = props;

  const [sourceContainerOptions, setSourceContainerOptions] = useState<IDropdownOption[]>();
  const [selectedSourceContainer, setSelectedSourceContainer] = useState<Collection>(sourceContainer);
  const [globalSecondaryIndexId, setGlobalSecondaryIndexId] = useState<string>();
  const [definition, setDefinition] = useState<string>();
  const [partitionKey, setPartitionKey] = useState<string>(getPartitionKey());
  const [subPartitionKeys, setSubPartitionKeys] = useState<string[]>([]);
  const [useHashV1, setUseHashV1] = useState<boolean>();
  const [enableDedicatedThroughput, setEnabledDedicatedThroughput] = useState<boolean>();
  const [isThroughputCapExceeded, setIsThroughputCapExceeded] = useState<boolean>();
  const [vectorEmbeddingPolicy, setVectorEmbeddingPolicy] = useState<VectorEmbedding[]>([]);
  const [vectorIndexingPolicy, setVectorIndexingPolicy] = useState<VectorIndex[]>([]);
  const [vectorPolicyValidated, setVectorPolicyValidated] = useState<boolean>(true);
  const [fullTextPolicy, setFullTextPolicy] = useState<FullTextPolicy>(FullTextPolicyDefault);
  const [fullTextIndexes, setFullTextIndexes] = useState<FullTextIndex[]>([]);
  const [fullTextPolicyValidated, setFullTextPolicyValidated] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [showErrorDetails, setShowErrorDetails] = useState<boolean>();
  const [isExecuting, setIsExecuting] = useState<boolean>();

  const showFullTextSearch: MutableRefObject<boolean> = useRef<boolean>(userContext.apiType === "SQL");

  useEffect(() => {
    const sourceContainerOptions: IDropdownOption[] = [];
    useDatabases.getState().databases.forEach((database: Database) => {
      sourceContainerOptions.push({
        key: database.rid,
        text: database.id(),
        itemType: DropdownMenuItemType.Header,
      });

      database.collections().forEach((collection: Collection) => {
        const isGlobalSecondaryIndex: boolean = !!collection.materializedViewDefinition();
        sourceContainerOptions.push({
          key: collection.rid,
          text: collection.id(),
          disabled: isGlobalSecondaryIndex,
          ...(isGlobalSecondaryIndex && {
            title: "This is a global secondary index.",
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

  let globalSecondaryIndexThroughput: number;
  let isCostAcknowledged: boolean;

  const globalSecondaryIndexThroughputOnChange = (globalSecondaryIndexThroughputValue: number): void => {
    globalSecondaryIndexThroughput = globalSecondaryIndexThroughputValue;
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

  const validateInputs = (): boolean => {
    if (!selectedSourceContainer) {
      setErrorMessage("Please select a source container");
      return false;
    }

    if (globalSecondaryIndexThroughput > CollectionCreation.DefaultCollectionRUs100K && !isCostAcknowledged) {
      const errorMessage: string = "Please acknowledge the estimated monthly spend.";
      setErrorMessage(errorMessage);
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

    const globalSecondaryIdTrimmed: string = globalSecondaryIndexId.trim();

    const globalSecondaryIndexDefinition: DataModels.MaterializedViewDefinition = {
      sourceCollectionId: selectedSourceContainer.id(),
      definition: definition,
    };

    const partitionKeyTrimmed: string = partitionKey.trim();

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

    if (showFullTextSearch) {
      indexingPolicy.fullTextIndexes = fullTextIndexes;
    }

    const telemetryData: TelemetryProcessor.TelemetryData = {
      database: {
        id: selectedSourceContainer.databaseId,
        shared: isSelectedSourceContainerSharedThroughput(),
      },
      collection: {
        id: globalSecondaryIdTrimmed,
        throughput: globalSecondaryIndexThroughput,
        isAutoscale: true,
        partitionKeyPaths,
        collectionWithDedicatedThroughput: enableDedicatedThroughput,
      },
      subscriptionQuotaId: userContext.quotaId,
      dataExplorerArea: Constants.Areas.ContextualPane,
    };

    const startKey: number = TelemetryProcessor.traceStart(Action.CreateCollection, telemetryData);
    const databaseLevelThroughput: boolean = isSelectedSourceContainerSharedThroughput() && !enableDedicatedThroughput;

    const createGlobalSecondaryIndexParams: DataModels.CreateMaterializedViewsParams = {
      materializedViewId: globalSecondaryIdTrimmed,
      materializedViewDefinition: globalSecondaryIndexDefinition,
      databaseId: selectedSourceContainer.databaseId,
      databaseLevelThroughput: databaseLevelThroughput,
      ...(!databaseLevelThroughput && {
        autoPilotMaxThroughput: globalSecondaryIndexThroughput,
      }),
      indexingPolicy: indexingPolicy,
      partitionKey: partitionKeyPaths,
      vectorEmbeddingPolicy: vectorEmbeddingPolicyFinal,
      fullTextPolicy: fullTextPolicy,
    };

    setIsExecuting(true);

    try {
      await createGlobalSecondaryIndex(createGlobalSecondaryIndexParams);
      await explorer.refreshAllDatabases();
      TelemetryProcessor.traceSuccess(Action.CreateGlobalSecondaryIndex, telemetryData, startKey);
      useSidePanel.getState().closeSidePanel();
    } catch (error) {
      const errorMessage: string = getErrorMessage(error);
      setErrorMessage(errorMessage);
      setShowErrorDetails(true);
      const failureTelemetryData = { ...telemetryData, error: errorMessage, errorStack: getErrorStack(error) };
      TelemetryProcessor.traceFailure(Action.CreateGlobalSecondaryIndex, failureTelemetryData, startKey);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <form className="panelFormWrapper" id="panelGlobalSecondaryIndex" onSubmit={submit}>
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
            placeholder="Choose source container"
            options={sourceContainerOptions}
            defaultSelectedKey={selectedSourceContainer?.rid}
            styles={chooseSourceContainerStyles()}
            style={chooseSourceContainerStyle()}
            onChange={(_, options: IDropdownOption) => setSelectedSourceContainer(options.data as Collection)}
          />
          <Separator className="panelSeparator" />
          <Stack horizontal>
            <span className="mandatoryStar">*&nbsp;</span>
            <Text className="panelTextBold" variant="small">
              Global secondary index container id
            </Text>
          </Stack>
          <input
            id="globalSecondaryIndexId"
            type="text"
            aria-required
            required
            autoComplete="off"
            pattern={ValidCosmosDbIdInputPattern.source}
            title={ValidCosmosDbIdDescription}
            placeholder={`e.g., indexbyEmailId`}
            size={40}
            className="panelTextField"
            value={globalSecondaryIndexId}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setGlobalSecondaryIndexId(event.target.value)}
          />
          <Stack horizontal>
            <span className="mandatoryStar">*&nbsp;</span>
            <Text className="panelTextBold" variant="small">
              Global secondary index definition
            </Text>
            <TooltipHost
              directionalHint={DirectionalHint.bottomLeftEdge}
              content={
                <Link
                  href="https://learn.microsoft.com/en-us/azure/cosmos-db/nosql/materialized-views#defining-materialized-views"
                  target="blank"
                >
                  Learn more about defining global secondary indexes.
                </Link>
              }
            >
              <Icon role="button" iconName="Info" className="panelInfoIcon" tabIndex={0} />
            </TooltipHost>
          </Stack>
          <input
            id="globalSecondaryIndexDefinition"
            type="text"
            aria-required
            required
            autoComplete="off"
            placeholder={"SELECT c.email, c.accountId FROM c"}
            size={40}
            className="panelTextField"
            value={definition || ""}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setDefinition(event.target.value)}
          />
          <PartitionKeyComponent
            {...{ partitionKey, setPartitionKey, subPartitionKeys, setSubPartitionKeys, useHashV1 }}
          />
          <ThroughputComponent
            {...{
              enableDedicatedThroughput,
              setEnabledDedicatedThroughput,
              isSelectedSourceContainerSharedThroughput,
              showCollectionThroughputInput,
              globalSecondaryIndexThroughputOnChange,
              setIsThroughputCapExceeded,
              isCostAknowledgedOnChange,
            }}
          />

          {showVectorSearchParameters() && (
            <VectorSearchComponent
              {...{
                vectorEmbeddingPolicy,
                setVectorEmbeddingPolicy,
                vectorIndexingPolicy,
                setVectorIndexingPolicy,
                vectorPolicyValidated,
                setVectorPolicyValidated,
                isGlobalSecondaryIndex: true,
              }}
            />
          )}
          {showFullTextSearch && (
            <FullTextSearchComponent
              {...{ fullTextPolicy, setFullTextPolicy, setFullTextIndexes, setFullTextPolicyValidated }}
            />
          )}
          <AdvancedComponent {...{ useHashV1, setUseHashV1, setSubPartitionKeys }} />
        </Stack>
      </div>
      <PanelFooterComponent buttonLabel="OK" isButtonDisabled={isThroughputCapExceeded} />
      {isExecuting && <PanelLoadingScreen />}
    </form>
  );
};
