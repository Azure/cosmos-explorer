import {
  ChoiceGroup,
  DefaultButton,
  DirectionalHint,
  Icon,
  IconButton,
  IDropdownOption,
  Link,
  ProgressIndicator,
  Separator,
  Stack,
  TeachingBubble,
  Text,
  TooltipHost
} from "@fluentui/react";
import * as Constants from "Common/Constants";
import { createCollection } from "Common/dataAccess/createCollection";
import { getNewDatabaseSharedThroughputDefault } from "Common/DatabaseUtility";
import { getErrorMessage, getErrorStack } from "Common/ErrorHandlingUtils";
import { configContext, Platform } from "ConfigContext";
import * as DataModels from "Contracts/DataModels";
import { VectorEmbeddingPoliciesComponent } from "Explorer/Controls/VectorSearch/VectorEmbeddingPoliciesComponent";
import {
  AllPropertiesIndexed,
  ContainerVectorPolicyTooltipContent,
  FullTextPolicyDefault,
  getPartitionKey,
  getPartitionKeyName,
  getPartitionKeyPlaceHolder,
  getPartitionKeyTooltipText,
  isFreeTierAccount,
  isSynapseLinkEnabled,
  parseUniqueKeys,
  scrollToSection,
  SharedDatabaseDefault,
  shouldShowAnalyticalStoreOptions
} from "Explorer/Panes/AddCollectionPanel/AddCollectionPanelUtility";
import { useSidePanel } from "hooks/useSidePanel";
import { useTeachingBubble } from "hooks/useTeachingBubble";
import { isFabricNative } from "Platform/Fabric/FabricUtil";
import React from "react";
import { CollectionCreation } from "Shared/Constants";
import { Action } from "Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "Shared/Telemetry/TelemetryProcessor";
import { userContext } from "UserContext";
import { getCollectionName } from "Utils/APITypeUtils";
import { isCapabilityEnabled, isServerlessAccount, isVectorSearchEnabled } from "Utils/CapabilityUtils";
import * as AutoPilotUtils from "../../../Utils/AutoPilotUtils";
import { CollapsibleSectionComponent } from "../../Controls/CollapsiblePanel/CollapsibleSectionComponent";
import { ContainerSampleGenerator } from "../../DataSamples/ContainerSampleGenerator";
import Explorer from "../../Explorer";
import { useDatabases } from "../../useDatabases";
import { PanelFooterComponent } from "../PanelFooterComponent";
import { PanelInfoErrorComponent } from "../PanelInfoErrorComponent";
import { PanelLoadingScreen } from "../PanelLoadingScreen";

interface AddFabricShortcutPanelProps {
  explorer: Explorer;
  shortcutId: string;


  databaseId?: string;
  isQuickstart?: boolean;
}

export const DefaultVectorEmbeddingPolicy: DataModels.VectorEmbeddingPolicy = {
  vectorEmbeddings: [],
};

export interface AddCollectionPanelState {
  createNewDatabase: boolean;
  newDatabaseId: string;
  isSharedThroughputChecked: boolean;
  selectedDatabaseId: string;
  collectionId: string;
  enableIndexing: boolean;
  isSharded: boolean;
  partitionKey: string;
  subPartitionKeys: string[];
  enableDedicatedThroughput: boolean;
  createMongoWildCardIndex: boolean;
  useHashV1: boolean;
  enableAnalyticalStore: boolean;
  uniqueKeys: string[];
  errorMessage: string;
  showErrorDetails: boolean;
  isExecuting: boolean;
  isThroughputCapExceeded: boolean;
  teachingBubbleStep: number;
  vectorIndexingPolicy: DataModels.VectorIndex[];
  vectorEmbeddingPolicy: DataModels.VectorEmbedding[];
  vectorPolicyValidated: boolean;
  fullTextPolicy: DataModels.FullTextPolicy;
  fullTextIndexes: DataModels.FullTextIndex[];
  fullTextPolicyValidated: boolean;
}

export class AddFabricShortcutPanel extends React.Component<AddFabricShortcutPanelProps, AddCollectionPanelState> {
  private newDatabaseThroughput: number;
  private isNewDatabaseAutoscale: boolean;
  private collectionThroughput: number;
  private isCollectionAutoscale: boolean;
  private isCostAcknowledged: boolean;
  private showFullTextSearch: boolean;

  constructor(props: AddFabricShortcutPanelProps) {
    super(props);

    this.state = {
      createNewDatabase:
        userContext.apiType !== "Tables" && configContext.platform !== Platform.Fabric && !this.props.databaseId,
      newDatabaseId: props.isQuickstart ? this.getSampleDBName() : "",
      isSharedThroughputChecked: getNewDatabaseSharedThroughputDefault(),
      selectedDatabaseId:
        userContext.apiType === "Tables" ? CollectionCreation.TablesAPIDefaultDatabase : this.props.databaseId,
      collectionId: props.isQuickstart ? `Sample${getCollectionName()}` : "",
      enableIndexing: true,
      isSharded: userContext.apiType !== "Tables",
      partitionKey: getPartitionKey(props.isQuickstart),
      subPartitionKeys: [],
      enableDedicatedThroughput: isFabricNative(), // Dedicated throughput is only enabled in Fabric Native by default
      createMongoWildCardIndex:
        isCapabilityEnabled("EnableMongo") && !isCapabilityEnabled("EnableMongo16MBDocumentSupport"),
      useHashV1: false,
      enableAnalyticalStore: false,
      uniqueKeys: [],
      errorMessage: "",
      showErrorDetails: false,
      isExecuting: false,
      isThroughputCapExceeded: false,
      teachingBubbleStep: 0,
      vectorEmbeddingPolicy: [],
      vectorIndexingPolicy: [],
      vectorPolicyValidated: true,
      fullTextPolicy: FullTextPolicyDefault,
      fullTextIndexes: [],
      fullTextPolicyValidated: true,
    };

    this.showFullTextSearch = userContext.apiType === "SQL";
  }

  componentDidMount(): void {
    if (this.state.teachingBubbleStep === 0 && this.props.isQuickstart) {
      this.setState({ teachingBubbleStep: 1 });
    }
  }

  componentDidUpdate(_prevProps: AddFabricShortcutPanelProps, prevState: AddCollectionPanelState): void {
    if (this.state.errorMessage && this.state.errorMessage !== prevState.errorMessage) {
      scrollToSection("panelContainer");
    }
  }

  render(): JSX.Element {
    const options: IChoiceGroupOption[] = [
      { key: 'continuous', text: 'Continuous' },
      { key: 'manual', text: 'Manual' },
    ];


    return (
      <form className="panelFormWrapper" onSubmit={this.submit.bind(this)} id="panelContainer">
        {this.state.errorMessage && (
          <PanelInfoErrorComponent
            message={this.state.errorMessage}
            messageType="error"
            showErrorDetails={this.state.showErrorDetails}
          />
        )}

        <div className="panelMainContent">
          <Stack>
            <Stack horizontal style={{ marginTop: -5, marginBottom: -4 }}>
              <Text className="panelTextBold" variant="small">Container id</Text>
              <TooltipHost directionalHint={DirectionalHint.bottomLeftEdge} content={getPartitionKeyTooltipText()}>
                <Icon
                  iconName="Info"
                  className="panelInfoIcon"
                  tabIndex={0}
                  ariaLabel={getPartitionKeyTooltipText()}
                />
              </TooltipHost>
            </Stack>
            <div>{this.props.shortcutId}</div>
            <div>publicHolidays</div>
            <Separator className="panelSeparator" style={{ marginTop: 2, marginBottom: -4 }} />
          </Stack>


          <Stack>
            <Stack horizontal style={{ marginTop: -5, marginBottom: -4 }}>
              <span className="mandatoryStar">*&nbsp;</span>
              <Text className="panelTextBold" variant="small">
                {getPartitionKeyName()}
              </Text>
              <TooltipHost directionalHint={DirectionalHint.bottomLeftEdge} content={getPartitionKeyTooltipText()}>
                <Icon
                  iconName="Info"
                  className="panelInfoIcon"
                  tabIndex={0}
                  ariaLabel={getPartitionKeyTooltipText()}
                />
              </TooltipHost>
            </Stack>

            <Text variant="small">{this.getPartitionKeySubtext()}</Text>

            <input
              type="text"
              id="addCollection-partitionKeyValue"
              aria-required
              required
              size={40}
              className="panelTextField"
              placeholder={getPartitionKeyPlaceHolder()}
              aria-label={getPartitionKeyName()}
              pattern={userContext.apiType === "Gremlin" ? "^/[^/]*" : ".*"}
              title={userContext.apiType === "Gremlin" ? "May not use composite partition key" : ""}
              value={this.state.partitionKey}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                if (
                  userContext.apiType !== "Mongo" &&
                  !this.state.partitionKey &&
                  !event.target.value.startsWith("/")
                ) {
                  this.setState({ partitionKey: "/" + event.target.value });
                } else {
                  this.setState({ partitionKey: event.target.value });
                }
              }}
            />
            {userContext.apiType === "SQL" &&
              this.state.subPartitionKeys.map((subPartitionKey: string, index: number) => {
                return (
                  <Stack style={{ marginBottom: 2, marginTop: -5 }} key={`uniqueKey${index}`} horizontal>
                    <div
                      style={{
                        width: "20px",
                        border: "solid",
                        borderWidth: "0px 0px 1px 1px",
                        marginRight: "5px",
                      }}
                    ></div>
                    <input
                      type="text"
                      id="addCollection-partitionKeyValue"
                      key={`addCollection-partitionKeyValue_${index}`}
                      aria-required
                      required
                      size={40}
                      tabIndex={index > 0 ? 1 : 0}
                      className="panelTextField"
                      autoComplete="off"
                      placeholder={getPartitionKeyPlaceHolder(index)}
                      aria-label={getPartitionKeyName()}
                      pattern={".*"}
                      title={""}
                      value={subPartitionKey}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        const subPartitionKeys = [...this.state.subPartitionKeys];
                        if (!this.state.subPartitionKeys[index] && !event.target.value.startsWith("/")) {
                          subPartitionKeys[index] = "/" + event.target.value.trim();
                          this.setState({ subPartitionKeys });
                        } else {
                          subPartitionKeys[index] = event.target.value.trim();
                          this.setState({ subPartitionKeys });
                        }
                      }}
                    />
                    <IconButton
                      iconProps={{ iconName: "Delete" }}
                      style={{ height: 27 }}
                      onClick={() => {
                        const subPartitionKeys = this.state.subPartitionKeys.filter((uniqueKey, j) => index !== j);
                        this.setState({ subPartitionKeys });
                      }}
                    />
                  </Stack>
                );
              })}
            {userContext.apiType === "SQL" && (
              <Stack className="panelGroupSpacing">
                <DefaultButton
                  styles={{ root: { padding: 0, width: 200, height: 30 }, label: { fontSize: 12 } }}
                  hidden={this.state.useHashV1}
                  disabled={this.state.subPartitionKeys.length >= Constants.BackendDefaults.maxNumMultiHashPartition}
                  onClick={() => this.setState({ subPartitionKeys: [...this.state.subPartitionKeys, ""] })}
                >
                  Add hierarchical partition key
                </DefaultButton>
                {this.state.subPartitionKeys.length > 0 && (
                  <Text variant="small">
                    <Icon iconName="InfoSolid" className="removeIcon" tabIndex={0} /> This feature allows you to
                    partition your data with up to three levels of keys for better data distribution. Requires .NET
                    V3, Java V4 SDK, or preview JavaScript V3 SDK.{" "}
                    <Link href="https://aka.ms/cosmos-hierarchical-partitioning" target="_blank">
                      Learn more
                    </Link>
                  </Text>
                )}
              </Stack>
            )}
            <Separator className="panelSeparator" style={{ marginTop: 2, marginBottom: -4 }} />
          </Stack>


          <Stack>
            <CollapsibleSectionComponent
              title="Container Vector Policy"
              isExpandedByDefault={false}
              onExpand={() => {
                scrollToSection("collapsibleVectorPolicySectionContent");
              }}
              tooltipContent={ContainerVectorPolicyTooltipContent()}
            >
              <Stack id="collapsibleVectorPolicySectionContent" styles={{ root: { position: "relative" } }}>
                <Stack styles={{ root: { paddingLeft: 40 } }}>
                  <VectorEmbeddingPoliciesComponent
                    vectorEmbeddings={this.state.vectorEmbeddingPolicy}
                    vectorIndexes={this.state.vectorIndexingPolicy}
                    onVectorEmbeddingChange={(
                      vectorEmbeddingPolicy: DataModels.VectorEmbedding[],
                      vectorIndexingPolicy: DataModels.VectorIndex[],
                      vectorPolicyValidated: boolean,
                    ) => {
                      this.setState({ vectorEmbeddingPolicy, vectorIndexingPolicy, vectorPolicyValidated });
                    }}
                  />
                </Stack>
              </Stack>
            </CollapsibleSectionComponent>
            <Separator className="panelSeparator" style={{ marginTop: 2, marginBottom: -4 }} />
          </Stack>

          <Stack>
            <CollapsibleSectionComponent
              title="ETL Frequency"
              isExpandedByDefault={false}
              onExpand={() => {
                scrollToSection("collapsibleVectorPolicySectionContent");
              }}
              tooltipContent={ContainerVectorPolicyTooltipContent()}
            >
              <ChoiceGroup defaultSelectedKey="continuous" options={options} onChange={() => { }} required={true} />
            </CollapsibleSectionComponent>
          </Stack>
        </div>

        <PanelFooterComponent buttonLabel="OK" isButtonDisabled={this.state.isThroughputCapExceeded} />

        {this.state.isExecuting && (
          <div>
            <PanelLoadingScreen />
            {this.state.teachingBubbleStep === 5 && (
              <TeachingBubble
                headline="Creating sample container"
                target={"#loadingScreen"}
                onDismiss={() => this.setState({ teachingBubbleStep: 0 })}
                styles={{ footer: { width: "100%" } }}
              >
                A sample container is now being created and we are adding sample data for you. It should take about 1
                minute.
                <br />
                <br />
                Once the sample container is created, review your sample dataset and follow next steps
                <br />
                <br />
                <ProgressIndicator
                  styles={{
                    itemName: { color: "white" },
                    progressTrack: { backgroundColor: "#A6A6A6" },
                    progressBar: { background: "white" },
                  }}
                  label="Adding sample data set"
                />
              </TeachingBubble>
            )}
          </div>
        )}
      </form>
    );
  }

  private getDatabaseOptions(): IDropdownOption[] {
    return useDatabases.getState().databases?.map((database) => ({
      key: database.id(),
      text: database.id(),
    }));
  }

  private onCreateNewDatabaseRadioBtnChange(event: React.ChangeEvent<HTMLInputElement>): void {
    if (event.target.checked && !this.state.createNewDatabase) {
      this.setState({
        createNewDatabase: true,
      });
    }
  }

  private onUseExistingDatabaseRadioBtnChange(event: React.ChangeEvent<HTMLInputElement>): void {
    if (event.target.checked && this.state.createNewDatabase) {
      this.setState({
        createNewDatabase: false,
      });
    }
  }

  private onUnshardedRadioBtnChange(event: React.ChangeEvent<HTMLInputElement>): void {
    if (event.target.checked && this.state.isSharded) {
      this.setState({
        isSharded: false,
      });
    }
  }

  private onShardedRadioBtnChange(event: React.ChangeEvent<HTMLInputElement>): void {
    if (event.target.checked && !this.state.isSharded) {
      this.setState({
        isSharded: true,
      });
    }
  }

  private onEnableAnalyticalStoreRadioBtnChange(event: React.ChangeEvent<HTMLInputElement>): void {
    if (event.target.checked && !this.state.enableAnalyticalStore) {
      this.setState({
        enableAnalyticalStore: true,
      });
    }
  }

  private onDisableAnalyticalStoreRadioBtnChange(event: React.ChangeEvent<HTMLInputElement>): void {
    if (event.target.checked && this.state.enableAnalyticalStore) {
      this.setState({
        enableAnalyticalStore: false,
      });
    }
  }

  private onTurnOnIndexing(event: React.ChangeEvent<HTMLInputElement>): void {
    if (event.target.checked && !this.state.enableIndexing) {
      this.setState({
        enableIndexing: true,
      });
    }
  }

  private onTurnOffIndexing(event: React.ChangeEvent<HTMLInputElement>): void {
    if (event.target.checked && this.state.enableIndexing) {
      this.setState({
        enableIndexing: false,
      });
    }
  }

  private setVectorEmbeddingPolicy(vectorEmbeddingPolicy: DataModels.VectorEmbedding[]): void {
    this.setState({
      vectorEmbeddingPolicy,
    });
  }

  private setVectorIndexingPolicy(vectorIndexingPolicy: DataModels.VectorIndex[]): void {
    this.setState({
      vectorIndexingPolicy,
    });
  }

  private isSelectedDatabaseSharedThroughput(): boolean {
    if (!this.state.selectedDatabaseId) {
      return false;
    }

    const selectedDatabase = useDatabases
      .getState()
      .databases?.find((database) => database.id() === this.state.selectedDatabaseId);
    return !!selectedDatabase?.offer();
  }

  private getFreeTierIndexingText(): string {
    return this.state.enableIndexing
      ? "All properties in your documents will be indexed by default for flexible and efficient queries."
      : "Indexing will be turned off. Recommended if you don't need to run queries or only have key value operations.";
  }

  private getPartitionKeySubtext(): string {
    if (
      userContext.features.partitionKeyDefault &&
      (userContext.apiType === "SQL" || userContext.apiType === "Mongo")
    ) {
      const subtext = "For small workloads, the item ID is a suitable choice for the partition key.";
      return subtext;
    }
    return "";
  }

  //TODO: uncomment when learn more text becomes available
  // private getContainerFullTextPolicyTooltipContent(): JSX.Element {
  //   return (
  //     <Text variant="small">
  //       Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
  //       magna aliqua.{" "}
  //       <Link target="_blank" href="https://aka.ms/CosmosFullTextSearch">
  //         Learn more
  //       </Link>
  //     </Text>
  //   );
  // }

  private shouldShowCollectionThroughputInput(): boolean {
    if (isServerlessAccount()) {
      return false;
    }

    if (this.state.createNewDatabase) {
      return !this.state.isSharedThroughputChecked;
    }

    if (this.state.enableDedicatedThroughput) {
      return true;
    }

    return this.state.selectedDatabaseId && !this.isSelectedDatabaseSharedThroughput();
  }

  private shouldShowIndexingOptionsForFreeTierAccount(): boolean {
    if (!isFreeTierAccount()) {
      return false;
    }

    return this.state.createNewDatabase
      ? this.state.isSharedThroughputChecked
      : this.isSelectedDatabaseSharedThroughput();
  }

  private shouldShowVectorSearchParameters() {
    return isVectorSearchEnabled() && (isServerlessAccount() || this.shouldShowCollectionThroughputInput());
  }

  private shouldShowFullTextSearchParameters() {
    return !isFabricNative() && this.showFullTextSearch;
  }

  private parseUniqueKeys(): DataModels.UniqueKeyPolicy {
    if (this.state.uniqueKeys?.length === 0) {
      return undefined;
    }

    const uniqueKeyPolicy: DataModels.UniqueKeyPolicy = { uniqueKeys: [] };
    this.state.uniqueKeys.forEach((uniqueKey) => {
      if (uniqueKey) {
        const validPaths: string[] = uniqueKey.split(",")?.filter((path) => path?.length > 0);
        const trimmedPaths: string[] = validPaths?.map((path) => path.trim());
        if (trimmedPaths?.length > 0) {
          if (userContext.apiType === "Mongo") {
            trimmedPaths.map((path) => {
              const transformedPath = path.split(".").join("/");
              if (transformedPath[0] !== "/") {
                return "/" + transformedPath;
              }
              return transformedPath;
            });
          }
          uniqueKeyPolicy.uniqueKeys.push({ paths: trimmedPaths });
        }
      }
    });

    return uniqueKeyPolicy;
  }

  private validateInputs(): boolean {
    if (!this.state.createNewDatabase && !this.state.selectedDatabaseId) {
      this.setState({ errorMessage: "Please select an existing database" });
      return false;
    }

    const throughput = this.state.createNewDatabase ? this.newDatabaseThroughput : this.collectionThroughput;
    if (throughput > CollectionCreation.DefaultCollectionRUs100K && !this.isCostAcknowledged) {
      const errorMessage = this.isNewDatabaseAutoscale
        ? "Please acknowledge the estimated monthly spend."
        : "Please acknowledge the estimated daily spend.";
      this.setState({ errorMessage });
      return false;
    }

    if (throughput > CollectionCreation.MaxRUPerPartition && !this.state.isSharded) {
      this.setState({ errorMessage: "Unsharded collections support up to 10,000 RUs" });
      return false;
    }

    if (
      userContext.apiType === "Gremlin" &&
      (this.state.partitionKey === "/id" || this.state.partitionKey === "/label")
    ) {
      this.setState({ errorMessage: "/id and /label as partition keys are not allowed for graph." });
      return false;
    }

    if (this.shouldShowVectorSearchParameters()) {
      if (!this.state.vectorPolicyValidated) {
        this.setState({ errorMessage: "Please fix errors in container vector policy" });
        return false;
      }

      if (!this.state.fullTextPolicyValidated) {
        this.setState({ errorMessage: "Please fix errors in container full text search polilcy" });
        return false;
      }
    }

    return true;
  }

  private getAnalyticalStorageTtl(): number {
    if (!isSynapseLinkEnabled()) {
      return undefined;
    }

    if (!shouldShowAnalyticalStoreOptions()) {
      return undefined;
    }

    if (this.state.enableAnalyticalStore) {
      // TODO: always default to 90 days once the backend hotfix is deployed
      return userContext.features.ttl90Days
        ? Constants.AnalyticalStorageTtl.Days90
        : Constants.AnalyticalStorageTtl.Infinite;
    }

    return Constants.AnalyticalStorageTtl.Disabled;
  }

  private getSampleDBName(): string {
    const existingSampleDBs = useDatabases
      .getState()
      .databases?.filter((database) => database.id().startsWith("SampleDB"));
    const existingSampleDBNames = existingSampleDBs?.map((database) => database.id());
    if (!existingSampleDBNames || existingSampleDBNames.length === 0) {
      return "SampleDB";
    }

    let i = 1;
    while (existingSampleDBNames.indexOf(`SampleDB${i}`) !== -1) {
      i++;
    }

    return `SampleDB${i}`;
  }

  private async submit(event?: React.FormEvent<HTMLFormElement>): Promise<void> {
    event?.preventDefault();

    if (!this.validateInputs()) {
      return;
    }

    const collectionId: string = this.state.collectionId.trim();
    let databaseId = this.state.createNewDatabase ? this.state.newDatabaseId.trim() : this.state.selectedDatabaseId;
    let partitionKeyString = this.state.isSharded ? this.state.partitionKey.trim() : undefined;

    if (userContext.apiType === "Tables") {
      // Table require fixed Database: TablesDB, and fixed Partition Key: /'$pk'
      databaseId = CollectionCreation.TablesAPIDefaultDatabase;
      partitionKeyString = "/'$pk'";
    }

    const uniqueKeyPolicy: DataModels.UniqueKeyPolicy = parseUniqueKeys(this.state.uniqueKeys);
    const partitionKeyVersion = this.state.useHashV1 ? undefined : 2;
    const partitionKey: DataModels.PartitionKey = partitionKeyString
      ? {
        paths: [
          partitionKeyString,
          ...(userContext.apiType === "SQL" && this.state.subPartitionKeys.length > 0
            ? this.state.subPartitionKeys
            : []),
        ],
        kind: userContext.apiType === "SQL" && this.state.subPartitionKeys.length > 0 ? "MultiHash" : "Hash",
        version: partitionKeyVersion,
      }
      : undefined;

    const indexingPolicy: DataModels.IndexingPolicy = this.state.enableIndexing
      ? AllPropertiesIndexed
      : SharedDatabaseDefault;

    let vectorEmbeddingPolicy: DataModels.VectorEmbeddingPolicy;

    if (this.shouldShowVectorSearchParameters()) {
      indexingPolicy.vectorIndexes = this.state.vectorIndexingPolicy;
      vectorEmbeddingPolicy = {
        vectorEmbeddings: this.state.vectorEmbeddingPolicy,
      };
    }

    if (this.showFullTextSearch) {
      indexingPolicy.fullTextIndexes = this.state.fullTextIndexes;
    }

    const telemetryData = {
      database: {
        id: databaseId,
        new: this.state.createNewDatabase,
        shared: this.state.createNewDatabase
          ? this.state.isSharedThroughputChecked
          : this.isSelectedDatabaseSharedThroughput(),
      },
      collection: {
        id: this.state.collectionId,
        throughput: this.collectionThroughput,
        isAutoscale: this.isCollectionAutoscale,
        partitionKey,
        uniqueKeyPolicy,
        collectionWithDedicatedThroughput: this.state.enableDedicatedThroughput,
      },
      subscriptionQuotaId: userContext.quotaId,
      dataExplorerArea: Constants.Areas.ContextualPane,
      useIndexingForSharedThroughput: this.state.enableIndexing,
      isQuickstart: !!this.props.isQuickstart,
    };
    const startKey: number = TelemetryProcessor.traceStart(Action.CreateCollection, telemetryData);

    const databaseLevelThroughput: boolean = this.state.createNewDatabase
      ? this.state.isSharedThroughputChecked
      : this.isSelectedDatabaseSharedThroughput() && !this.state.enableDedicatedThroughput;

    let offerThroughput: number;
    let autoPilotMaxThroughput: number;

    // Throughput
    if (isFabricNative()) {
      // Fabric Native accounts are always autoscale and have a fixed throughput of 5K
      autoPilotMaxThroughput = AutoPilotUtils.autoPilotThroughput5K;
      offerThroughput = undefined;
    } else if (databaseLevelThroughput) {
      if (this.state.createNewDatabase) {
        if (this.isNewDatabaseAutoscale) {
          autoPilotMaxThroughput = this.newDatabaseThroughput;
        } else {
          offerThroughput = this.newDatabaseThroughput;
        }
      }
    } else {
      if (this.isCollectionAutoscale) {
        autoPilotMaxThroughput = this.collectionThroughput;
      } else {
        offerThroughput = this.collectionThroughput;
      }
    }

    const createCollectionParams: DataModels.CreateCollectionParams = {
      createNewDatabase: this.state.createNewDatabase,
      collectionId,
      databaseId,
      databaseLevelThroughput,
      offerThroughput,
      autoPilotMaxThroughput,
      analyticalStorageTtl: this.getAnalyticalStorageTtl(),
      indexingPolicy,
      partitionKey,
      uniqueKeyPolicy,
      createMongoWildcardIndex: this.state.createMongoWildCardIndex,
      vectorEmbeddingPolicy,
      fullTextPolicy: this.state.fullTextPolicy,
    };

    this.setState({ isExecuting: true });

    try {
      await createCollection(createCollectionParams);
      await this.props.explorer.refreshAllDatabases();
      if (this.props.isQuickstart) {
        const database = useDatabases.getState().findDatabaseWithId(databaseId);
        if (database) {
          database.isSampleDB = true;
          // populate sample container with sample data
          await database.loadCollections();
          const collection = database.findCollectionWithId(collectionId);
          collection.isSampleCollection = true;
          useTeachingBubble.getState().setSampleCollection(collection);
          const sampleGenerator = await ContainerSampleGenerator.createSampleGeneratorAsync(this.props.explorer);
          await sampleGenerator.populateContainerAsync(collection, partitionKeyString);
          // auto-expand sample database + container and show teaching bubble
          await database.expandDatabase();
          collection.expandCollection();
          useDatabases.getState().updateDatabase(database);
          useTeachingBubble.getState().setIsSampleDBExpanded(true);
          TelemetryProcessor.traceOpen(Action.LaunchUITour);
        }
      }
      this.setState({ isExecuting: false });
      TelemetryProcessor.traceSuccess(Action.CreateCollection, telemetryData, startKey);
      useSidePanel.getState().closeSidePanel();
    } catch (error) {
      const errorMessage: string = getErrorMessage(error);
      this.setState({ isExecuting: false, errorMessage, showErrorDetails: true });
      const failureTelemetryData = { ...telemetryData, error: errorMessage, errorStack: getErrorStack(error) };
      TelemetryProcessor.traceFailure(Action.CreateCollection, failureTelemetryData, startKey);
    }
  }
}
