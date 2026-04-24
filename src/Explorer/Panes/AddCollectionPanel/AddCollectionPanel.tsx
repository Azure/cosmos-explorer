import {
  ActionButton,
  Checkbox,
  DefaultButton,
  DirectionalHint,
  Dropdown,
  Icon,
  IconButton,
  IDropdownOption,
  Link,
  ProgressIndicator,
  Separator,
  Stack,
  TeachingBubble,
  Text,
  TooltipHost,
} from "@fluentui/react";
import * as Constants from "Common/Constants";
import { createCollection } from "Common/dataAccess/createCollection";
import { getErrorMessage, getErrorStack } from "Common/ErrorHandlingUtils";
import { configContext, Platform } from "ConfigContext";
import * as DataModels from "Contracts/DataModels";
import { FullTextPoliciesComponent } from "Explorer/Controls/FullTextSeach/FullTextPoliciesComponent";
import { VectorEmbeddingPoliciesComponent } from "Explorer/Controls/VectorSearch/VectorEmbeddingPoliciesComponent";
import {
  AllPropertiesIndexed,
  AnalyticalStoreHeader,
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
  shouldShowAnalyticalStoreOptions,
  UniqueKeysHeader,
} from "Explorer/Panes/AddCollectionPanel/AddCollectionPanelUtility";
import { useSidePanel } from "hooks/useSidePanel";
import { useTeachingBubble } from "hooks/useTeachingBubble";
import { Keys, t } from "Localization";
import { DEFAULT_FABRIC_NATIVE_CONTAINER_THROUGHPUT, isFabricNative } from "Platform/Fabric/FabricUtil";
import React from "react";
import { CollectionCreation } from "Shared/Constants";
import { Action } from "Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "Shared/Telemetry/TelemetryProcessor";
import { userContext } from "UserContext";
import { getCollectionName } from "Utils/APITypeUtils";
import { isCapabilityEnabled, isServerlessAccount, isVectorSearchEnabled } from "Utils/CapabilityUtils";
import { getUpsellMessage } from "Utils/PricingUtils";
import { ValidCosmosDbIdDescription, ValidCosmosDbIdInputPattern } from "Utils/ValidationUtils";
import { CollapsibleSectionComponent } from "../../Controls/CollapsiblePanel/CollapsibleSectionComponent";
import { ThroughputInput } from "../../Controls/ThroughputInput/ThroughputInput";
import { ContainerSampleGenerator } from "../../DataSamples/ContainerSampleGenerator";
import Explorer from "../../Explorer";
import { useDatabases } from "../../useDatabases";
import { PanelFooterComponent } from "../PanelFooterComponent";
import { PanelInfoErrorComponent } from "../PanelInfoErrorComponent";
import { PanelLoadingScreen } from "../PanelLoadingScreen";

export interface AddCollectionPanelProps {
  explorer: Explorer;
  databaseId?: string;
  isQuickstart?: boolean;
  isCopyJobFlow?: boolean;
  onSubmitSuccess?: (collectionData: { databaseId: string; collectionId: string }) => void;
}

export const DefaultVectorEmbeddingPolicy: DataModels.VectorEmbeddingPolicy = {
  vectorEmbeddings: [],
};

export interface AddCollectionPanelState {
  createNewDatabase: boolean;
  newDatabaseId: string;
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

export class AddCollectionPanel extends React.Component<AddCollectionPanelProps, AddCollectionPanelState> {
  private collectionThroughput: number;
  private isCollectionAutoscale: boolean;
  private isCostAcknowledged: boolean;
  private showFullTextSearch: boolean;

  constructor(props: AddCollectionPanelProps) {
    super(props);

    this.state = {
      createNewDatabase:
        userContext.apiType !== "Tables" && configContext.platform !== Platform.Fabric && !this.props.databaseId,
      newDatabaseId: props.isQuickstart ? this.getSampleDBName() : "",
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

  componentDidUpdate(_prevProps: AddCollectionPanelProps, prevState: AddCollectionPanelState): void {
    if (this.state.errorMessage && this.state.errorMessage !== prevState.errorMessage) {
      scrollToSection("panelContainer");
    }
  }

  render(): JSX.Element {
    const isFirstResourceCreated = useDatabases.getState().isFirstResourceCreated();

    return (
      <form className="panelFormWrapper" onSubmit={this.submit.bind(this)} id="panelContainer">
        {this.state.errorMessage && (
          <PanelInfoErrorComponent
            message={this.state.errorMessage}
            messageType="error"
            showErrorDetails={this.state.showErrorDetails}
          />
        )}

        {!this.state.errorMessage && isFreeTierAccount() && (
          <PanelInfoErrorComponent
            message={getUpsellMessage(userContext.portalEnv, true, isFirstResourceCreated, true)}
            messageType="info"
            showErrorDetails={false}
            link={Constants.Urls.freeTierInformation}
            linkText={t(Keys.common.learnMore)}
          />
        )}

        {this.state.teachingBubbleStep === 1 && (
          <TeachingBubble
            headline={t(Keys.panes.addCollection.teachingBubble.step1Headline)}
            target={"#newDatabaseId"}
            calloutProps={{ gapSpace: 16 }}
            primaryButtonProps={{ text: t(Keys.common.next), onClick: () => this.setState({ teachingBubbleStep: 2 }) }}
            secondaryButtonProps={{
              text: t(Keys.common.cancel),
              onClick: () => this.setState({ teachingBubbleStep: 0 }),
            }}
            onDismiss={() => this.setState({ teachingBubbleStep: 0 })}
            footerContent={t(Keys.panes.addCollection.teachingBubble.stepOfTotal, { current: "1", total: "4" })}
          >
            <Stack>
              <Text style={{ color: "white" }}>{t(Keys.panes.addCollection.teachingBubble.step1Body)}</Text>
              <Link
                style={{ color: "white", fontWeight: 600 }}
                target="_blank"
                href="https://aka.ms/TeachingbubbleResources"
              >
                {t(Keys.panes.addCollection.teachingBubble.step1LearnMore)}
              </Link>
            </Stack>
          </TeachingBubble>
        )}

        {this.state.teachingBubbleStep === 2 && (
          <TeachingBubble
            headline={t(Keys.panes.addCollection.teachingBubble.step2Headline)}
            target={"#autoscaleRUValueField"}
            calloutProps={{ gapSpace: 16 }}
            primaryButtonProps={{ text: t(Keys.common.next), onClick: () => this.setState({ teachingBubbleStep: 3 }) }}
            secondaryButtonProps={{
              text: t(Keys.common.previous),
              onClick: () => this.setState({ teachingBubbleStep: 1 }),
            }}
            onDismiss={() => this.setState({ teachingBubbleStep: 0 })}
            footerContent={t(Keys.panes.addCollection.teachingBubble.stepOfTotal, { current: "2", total: "4" })}
          >
            <Stack>
              <Text style={{ color: "white" }}>{t(Keys.panes.addCollection.teachingBubble.step2Body)}</Text>
              <Link style={{ color: "white", fontWeight: 600 }} target="_blank" href="https://aka.ms/teachingbubbleRU">
                {t(Keys.panes.addCollection.teachingBubble.step2LearnMore)}
              </Link>
            </Stack>
          </TeachingBubble>
        )}

        {this.state.teachingBubbleStep === 3 && (
          <TeachingBubble
            headline={t(Keys.panes.addCollection.teachingBubble.step3Headline)}
            target={"#collectionId"}
            calloutProps={{ gapSpace: 16 }}
            primaryButtonProps={{ text: t(Keys.common.next), onClick: () => this.setState({ teachingBubbleStep: 4 }) }}
            secondaryButtonProps={{
              text: t(Keys.common.previous),
              onClick: () => this.setState({ teachingBubbleStep: 2 }),
            }}
            onDismiss={() => this.setState({ teachingBubbleStep: 0 })}
            footerContent={t(Keys.panes.addCollection.teachingBubble.stepOfTotal, { current: "3", total: "4" })}
          >
            {t(Keys.panes.addCollection.teachingBubble.step3Body)}
          </TeachingBubble>
        )}

        {this.state.teachingBubbleStep === 4 && (
          <TeachingBubble
            headline={t(Keys.panes.addCollection.teachingBubble.step4Headline)}
            target={"#addCollection-partitionKeyValue"}
            calloutProps={{ gapSpace: 16 }}
            primaryButtonProps={{
              text: t(Keys.panes.addCollection.teachingBubble.step4CreateContainer),
              onClick: () => {
                this.setState({ teachingBubbleStep: 5 });
                this.submit();
              },
            }}
            secondaryButtonProps={{
              text: t(Keys.common.previous),
              onClick: () => this.setState({ teachingBubbleStep: 2 }),
            }}
            onDismiss={() => this.setState({ teachingBubbleStep: 0 })}
            footerContent={t(Keys.panes.addCollection.teachingBubble.stepOfTotal, { current: "4", total: "4" })}
          >
            {t(Keys.panes.addCollection.teachingBubble.step4Body)}
          </TeachingBubble>
        )}

        <div className="panelMainContent">
          {!(isFabricNative() && this.props.databaseId !== undefined) && (
            <Stack hidden={userContext.apiType === "Tables"} style={{ marginBottom: -2 }}>
              <Stack horizontal>
                <span className="mandatoryStar">*&nbsp;</span>
                <Text className="panelTextBold" variant="small">
                  {userContext.apiType === "Mongo"
                    ? t(Keys.panes.addCollection.databaseFieldLabelName)
                    : t(Keys.panes.addCollection.databaseFieldLabelId)}
                </Text>
                <TooltipHost
                  directionalHint={DirectionalHint.bottomLeftEdge}
                  content={t(Keys.panes.addCollection.databaseTooltip, {
                    collectionName: getCollectionName(true).toLocaleLowerCase(),
                  })}
                >
                  <Icon
                    iconName="Info"
                    className="panelInfoIcon"
                    tabIndex={0}
                    ariaLabel={t(Keys.panes.addCollection.databaseTooltip, {
                      collectionName: getCollectionName(true).toLocaleLowerCase(),
                    })}
                  />
                </TooltipHost>
              </Stack>

              {configContext.platform !== Platform.Fabric && (
                <Stack horizontal verticalAlign="center">
                  <div role="radiogroup">
                    <input
                      className="panelRadioBtn"
                      checked={this.state.createNewDatabase}
                      aria-label={t(Keys.panes.addCollection.createNewDatabaseAriaLabel)}
                      aria-checked={this.state.createNewDatabase}
                      name="databaseType"
                      type="radio"
                      role="radio"
                      id="databaseCreateNew"
                      tabIndex={0}
                      onChange={this.onCreateNewDatabaseRadioBtnChange.bind(this)}
                    />
                    <span className="panelRadioBtnLabel">{t(Keys.panes.addCollection.createNew)}</span>

                    <input
                      className="panelRadioBtn"
                      checked={!this.state.createNewDatabase}
                      aria-label={t(Keys.panes.addCollection.useExistingDatabaseAriaLabel)}
                      aria-checked={!this.state.createNewDatabase}
                      name="databaseType"
                      type="radio"
                      role="radio"
                      tabIndex={0}
                      onChange={this.onUseExistingDatabaseRadioBtnChange.bind(this)}
                    />
                    <span className="panelRadioBtnLabel">{t(Keys.panes.addCollection.useExisting)}</span>
                  </div>
                </Stack>
              )}

              {this.state.createNewDatabase && (
                <Stack className="panelGroupSpacing">
                  <input
                    name="newDatabaseId"
                    id="newDatabaseId"
                    aria-required
                    required
                    type="text"
                    autoComplete="off"
                    pattern={ValidCosmosDbIdInputPattern.source}
                    title={ValidCosmosDbIdDescription}
                    placeholder={t(Keys.panes.addCollection.newDatabaseIdPlaceholder)}
                    size={40}
                    className="panelTextField"
                    aria-label={t(Keys.panes.addCollection.newDatabaseIdAriaLabel)}
                    tabIndex={0}
                    value={this.state.newDatabaseId}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      this.setState({ newDatabaseId: event.target.value })
                    }
                  />
                </Stack>
              )}
              {!this.state.createNewDatabase && (
                <Dropdown
                  ariaLabel={t(Keys.panes.addCollection.chooseExistingDatabase)}
                  styles={{ title: { height: 27, lineHeight: 27 }, dropdownItem: { fontSize: 12 } }}
                  style={{ width: 300, fontSize: 12 }}
                  placeholder={t(Keys.panes.addCollection.chooseExistingDatabase)}
                  options={this.getDatabaseOptions()}
                  onChange={(event: React.FormEvent<HTMLDivElement>, database: IDropdownOption) =>
                    this.setState({ selectedDatabaseId: database.key as string })
                  }
                  defaultSelectedKey={this.props.databaseId}
                  responsiveMode={999}
                />
              )}
              <Separator className="panelSeparator" style={{ marginTop: -4, marginBottom: -4 }} />
            </Stack>
          )}

          <Stack>
            <Stack horizontal style={{ marginTop: -5, marginBottom: 1 }}>
              <span className="mandatoryStar">*&nbsp;</span>
              <Text className="panelTextBold" variant="small">
                {`${getCollectionName()} id`}
              </Text>
              <TooltipHost
                directionalHint={DirectionalHint.bottomLeftEdge}
                content={t(Keys.panes.addCollection.collectionIdTooltip, {
                  collectionName: getCollectionName().toLocaleLowerCase(),
                })}
              >
                <Icon
                  role="button"
                  iconName="Info"
                  className="panelInfoIcon"
                  tabIndex={0}
                  ariaLabel={t(Keys.panes.addCollection.collectionIdTooltip, {
                    collectionName: getCollectionName().toLocaleLowerCase(),
                  })}
                />
              </TooltipHost>
            </Stack>

            <input
              name="collectionId"
              id="collectionId"
              type="text"
              aria-required
              required
              autoComplete="off"
              pattern={ValidCosmosDbIdInputPattern.source}
              title={ValidCosmosDbIdDescription}
              placeholder={t(Keys.panes.addCollection.collectionIdPlaceholder, { collectionName: getCollectionName() })}
              size={40}
              className="panelTextField"
              aria-label={t(Keys.panes.addCollection.collectionIdAriaLabel, { collectionName: getCollectionName() })}
              value={this.state.collectionId}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                this.setState({ collectionId: event.target.value })
              }
            />
            <Separator className="panelSeparator" style={{ marginTop: -5, marginBottom: -5 }} />
          </Stack>

          {this.shouldShowIndexingOptionsForFreeTierAccount() && (
            <Stack>
              <Stack horizontal style={{ marginTop: -4, marginBottom: -5 }}>
                <span className="mandatoryStar">*&nbsp;</span>
                <Text className="panelTextBold" variant="small">
                  {t(Keys.panes.addCollection.indexing)}
                </Text>
              </Stack>

              <Stack horizontal verticalAlign="center">
                <input
                  className="panelRadioBtn"
                  checked={this.state.enableIndexing}
                  aria-label={t(Keys.panes.addCollection.turnOnIndexing)}
                  aria-checked={this.state.enableIndexing}
                  type="radio"
                  role="radio"
                  tabIndex={0}
                  onChange={this.onTurnOnIndexing.bind(this)}
                />
                <span className="panelRadioBtnLabel">{t(Keys.panes.addCollection.automatic)}</span>

                <input
                  className="panelRadioBtn"
                  checked={!this.state.enableIndexing}
                  aria-label={t(Keys.panes.addCollection.turnOffIndexing)}
                  aria-checked={!this.state.enableIndexing}
                  type="radio"
                  role="radio"
                  tabIndex={0}
                  onChange={this.onTurnOffIndexing.bind(this)}
                />
                <span className="panelRadioBtnLabel">{t(Keys.panes.addCollection.off)}</span>
              </Stack>

              <Text variant="small">
                {this.getFreeTierIndexingText()}{" "}
                <Link target="_blank" href="https://aka.ms/cosmos-indexing-policy">
                  {t(Keys.common.learnMore)}
                </Link>
              </Text>
            </Stack>
          )}

          {userContext.apiType === "Mongo" && this.props.explorer.isFixedCollectionWithSharedThroughputSupported() && (
            <Stack>
              <Stack horizontal style={{ marginTop: -5, marginBottom: -4 }}>
                <span className="mandatoryStar">*&nbsp;</span>
                <Text className="panelTextBold" variant="small">
                  {t(Keys.panes.addCollection.sharding)}
                </Text>
                <TooltipHost
                  directionalHint={DirectionalHint.bottomLeftEdge}
                  content={t(Keys.panes.addCollection.shardingTooltip)}
                >
                  <Icon
                    iconName="Info"
                    className="panelInfoIcon"
                    tabIndex={0}
                    ariaLabel={t(Keys.panes.addCollection.shardingTooltip)}
                  />
                </TooltipHost>
              </Stack>

              <Stack horizontal verticalAlign="center">
                <input
                  className="panelRadioBtn"
                  checked={!this.state.isSharded}
                  aria-label={t(Keys.panes.addCollection.unsharded)}
                  aria-checked={!this.state.isSharded}
                  name="unsharded"
                  type="radio"
                  role="radio"
                  id="unshardedOption"
                  tabIndex={0}
                  onChange={this.onUnshardedRadioBtnChange.bind(this)}
                />
                <span className="panelRadioBtnLabel">{t(Keys.panes.addCollection.unshardedLabel)}</span>

                <input
                  className="panelRadioBtn"
                  checked={this.state.isSharded}
                  aria-label={t(Keys.panes.addCollection.sharded)}
                  aria-checked={this.state.isSharded}
                  name="sharded"
                  type="radio"
                  role="radio"
                  id="shardedOption"
                  tabIndex={0}
                  onChange={this.onShardedRadioBtnChange.bind(this)}
                />
                <span className="panelRadioBtnLabel">{t(Keys.panes.addCollection.sharded)}</span>
              </Stack>
            </Stack>
          )}

          {this.state.isSharded && (
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
                    styles={{
                      root: {
                        padding: 0,
                        width: 200,
                        height: 30,
                        backgroundColor: "var(--colorNeutralBackground2)",
                        color: "var(--colorNeutralForeground1)",
                        borderColor: "var(--colorNeutralStroke1)",
                      },
                      rootHovered: {
                        backgroundColor: "var(--colorNeutralBackground3)",
                        color: "var(--colorNeutralForeground1)",
                      },
                      rootPressed: {
                        backgroundColor: "var(--colorBrandBackgroundPressed)",
                        color: "var(--colorNeutralForegroundOnBrand)",
                      },
                      label: {
                        fontSize: 12,
                      },
                    }}
                    hidden={this.state.useHashV1}
                    disabled={this.state.subPartitionKeys.length >= Constants.BackendDefaults.maxNumMultiHashPartition}
                    onClick={() => this.setState({ subPartitionKeys: [...this.state.subPartitionKeys, ""] })}
                  >
                    {t(Keys.panes.addCollection.addPartitionKey)}
                  </DefaultButton>
                  {this.state.subPartitionKeys.length > 0 && (
                    <Text variant="small" style={{ color: "var(--colorNeutralForeground1)" }}>
                      <Icon iconName="InfoSolid" className="removeIcon" tabIndex={0} />{" "}
                      {t(Keys.panes.addCollection.hierarchicalPartitionKeyInfo)}{" "}
                      <Link href="https://aka.ms/cosmos-hierarchical-partitioning" target="_blank">
                        {t(Keys.common.learnMore)}
                      </Link>
                    </Text>
                  )}
                </Stack>
              )}
              <Separator className="panelSeparator" style={{ marginTop: 2, marginBottom: -4 }} />
            </Stack>
          )}

          {!isServerlessAccount() && !this.state.createNewDatabase && this.isSelectedDatabaseSharedThroughput() && (
            <Stack horizontal verticalAlign="center">
              <Checkbox
                label={t(Keys.panes.addCollection.provisionDedicatedThroughput, {
                  collectionName: getCollectionName().toLocaleLowerCase(),
                })}
                checked={this.state.enableDedicatedThroughput}
                styles={{
                  text: { fontSize: 12, color: "var(--colorNeutralForeground1)" },
                  checkbox: { width: 12, height: 12 },
                  label: { padding: 0, alignItems: "center" },
                  root: {
                    selectors: {
                      ":hover .ms-Checkbox-text": { color: "var(--colorNeutralForeground1)" },
                    },
                  },
                }}
                onChange={(ev: React.FormEvent<HTMLElement>, isChecked: boolean) =>
                  this.setState({ enableDedicatedThroughput: isChecked })
                }
              />
              <TooltipHost
                directionalHint={DirectionalHint.bottomLeftEdge}
                content={t(Keys.panes.addCollection.provisionDedicatedThroughputTooltip, {
                  collectionName: getCollectionName().toLocaleLowerCase(),
                  collectionNamePlural: getCollectionName(true).toLocaleLowerCase(),
                })}
              >
                <Icon
                  iconName="Info"
                  className="panelInfoIcon"
                  tabIndex={0}
                  ariaLabel={t(Keys.panes.addCollection.provisionDedicatedThroughputTooltip, {
                    collectionName: getCollectionName().toLocaleLowerCase(),
                    collectionNamePlural: getCollectionName(true).toLocaleLowerCase(),
                  })}
                />
              </TooltipHost>
            </Stack>
          )}

          {this.shouldShowCollectionThroughputInput() && !isFabricNative() && (
            <ThroughputInput
              showFreeTierExceedThroughputTooltip={isFreeTierAccount() && !isFirstResourceCreated}
              isDatabase={false}
              isSharded={this.state.isSharded}
              isFreeTier={isFreeTierAccount()}
              isQuickstart={this.props.isQuickstart}
              setThroughputValue={(throughput: number) => (this.collectionThroughput = throughput)}
              setIsAutoscale={(isAutoscale: boolean) => (this.isCollectionAutoscale = isAutoscale)}
              setIsThroughputCapExceeded={(isThroughputCapExceeded: boolean) =>
                this.setState({ isThroughputCapExceeded })
              }
              onCostAcknowledgeChange={(isAcknowledged: boolean) => {
                this.isCostAcknowledged = isAcknowledged;
              }}
            />
          )}

          {!isFabricNative() && userContext.apiType === "SQL" && (
            <Stack style={{ marginTop: -2, marginBottom: -4 }}>
              {UniqueKeysHeader()}
              {this.state.uniqueKeys.map((uniqueKey: string, i: number): JSX.Element => {
                return (
                  <Stack style={{ marginBottom: 8 }} key={`uniqueKey${i}`} horizontal>
                    <input
                      type="text"
                      autoComplete="off"
                      placeholder={
                        userContext.apiType === "Mongo"
                          ? t(Keys.panes.addCollection.uniqueKeysPlaceholderMongo)
                          : t(Keys.panes.addCollection.uniqueKeysPlaceholderSql)
                      }
                      className="panelTextField"
                      value={uniqueKey}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        const uniqueKeys = this.state.uniqueKeys.map((uniqueKey: string, j: number) => {
                          if (i === j) {
                            return event.target.value;
                          }
                          return uniqueKey;
                        });
                        this.setState({ uniqueKeys });
                      }}
                    />

                    <IconButton
                      iconProps={{ iconName: "Delete" }}
                      style={{ height: 27 }}
                      onClick={() => {
                        const uniqueKeys = this.state.uniqueKeys.filter((uniqueKey, j) => i !== j);
                        this.setState({ uniqueKeys });
                      }}
                    />
                  </Stack>
                );
              })}

              <ActionButton
                iconProps={{ iconName: "Add" }}
                styles={{ root: { padding: 0 }, label: { fontSize: 12, color: "var(--colorNeutralForeground1)" } }}
                onClick={() => this.setState({ uniqueKeys: [...this.state.uniqueKeys, ""] })}
              >
                {t(Keys.panes.addCollection.addUniqueKey)}
              </ActionButton>
            </Stack>
          )}

          {!isFabricNative() && userContext.apiType === "SQL" && (
            <Separator className="panelSeparator" style={{ marginTop: -15, marginBottom: -4 }} />
          )}

          {shouldShowAnalyticalStoreOptions() && (
            <Stack className="panelGroupSpacing" style={{ marginTop: -4 }}>
              <Text className="panelTextBold" variant="small">
                {AnalyticalStoreHeader()}
              </Text>

              <Stack horizontal verticalAlign="center">
                <div role="radiogroup">
                  <input
                    className="panelRadioBtn"
                    checked={this.state.enableAnalyticalStore}
                    disabled={!isSynapseLinkEnabled()}
                    aria-label={t(Keys.panes.addCollection.enableAnalyticalStore)}
                    aria-checked={this.state.enableAnalyticalStore}
                    name="analyticalStore"
                    type="radio"
                    role="radio"
                    id="enableAnalyticalStoreBtn"
                    tabIndex={0}
                    onChange={this.onEnableAnalyticalStoreRadioBtnChange.bind(this)}
                  />
                  <span className="panelRadioBtnLabel">{t(Keys.panes.addCollection.on)}</span>

                  <input
                    className="panelRadioBtn"
                    checked={!this.state.enableAnalyticalStore}
                    disabled={!isSynapseLinkEnabled()}
                    aria-label={t(Keys.panes.addCollection.disableAnalyticalStore)}
                    aria-checked={!this.state.enableAnalyticalStore}
                    name="analyticalStore"
                    type="radio"
                    role="radio"
                    id="disableAnalyticalStoreBtn"
                    tabIndex={0}
                    onChange={this.onDisableAnalyticalStoreRadioBtnChange.bind(this)}
                  />
                  <span className="panelRadioBtnLabel">{t(Keys.panes.addCollection.off)}</span>
                </div>
              </Stack>

              {!isSynapseLinkEnabled() && (
                <Stack className="panelGroupSpacing">
                  <Text variant="small" style={{ color: "var(--colorNeutralForeground1)" }}>
                    {t(Keys.panes.addCollection.analyticalStoreSynapseLinkRequired, {
                      collectionName: getCollectionName().toLocaleLowerCase(),
                    })}{" "}
                    <br />
                    <Link
                      href="https://aka.ms/cosmosdb-synapselink"
                      target="_blank"
                      aria-label={Constants.ariaLabelForLearnMoreLink.AzureSynapseLink}
                      className="capacitycalculator-link"
                    >
                      {t(Keys.common.learnMore)}
                    </Link>
                  </Text>
                  <DefaultButton
                    text={t(Keys.panes.addCollection.enable)}
                    onClick={() => this.props.explorer.openEnableSynapseLinkDialog()}
                    style={{ height: 27, width: 80 }}
                    styles={{ label: { fontSize: 12 } }}
                  />
                </Stack>
              )}
            </Stack>
          )}
          {this.shouldShowVectorSearchParameters() && (
            <Stack>
              <CollapsibleSectionComponent
                title={t(Keys.panes.addCollection.containerVectorPolicy)}
                isExpandedByDefault={false}
                onExpand={() => {
                  scrollToSection("collapsibleVectorPolicySectionContent");
                }}
                tooltipContent={ContainerVectorPolicyTooltipContent()}
              >
                <Stack id="collapsibleVectorPolicySectionContent" styles={{ root: { position: "relative" } }}>
                  <Stack styles={{ root: { paddingLeft: 40 } }}>
                    <VectorEmbeddingPoliciesComponent
                      vectorEmbeddingsBaseline={[]}
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
            </Stack>
          )}
          {this.shouldShowFullTextSearchParameters() && (
            <Stack>
              <CollapsibleSectionComponent
                title={t(Keys.panes.addCollection.containerFullTextSearchPolicy)}
                isExpandedByDefault={false}
                onExpand={() => {
                  scrollToSection("collapsibleFullTextPolicySectionContent");
                }}
                //TODO: uncomment when learn more text becomes available
                // tooltipContent={this.getContainerFullTextPolicyTooltipContent()}
              >
                <Stack id="collapsibleFullTextPolicySectionContent" styles={{ root: { position: "relative" } }}>
                  <Stack styles={{ root: { paddingLeft: 40 } }}>
                    <FullTextPoliciesComponent
                      fullTextPolicy={this.state.fullTextPolicy}
                      onFullTextPathChange={(
                        fullTextPolicy: DataModels.FullTextPolicy,
                        fullTextIndexes: DataModels.FullTextIndex[],
                        fullTextPolicyValidated: boolean,
                      ) => {
                        this.setState({ fullTextPolicy, fullTextIndexes, fullTextPolicyValidated });
                      }}
                      // Remove when multi language support on container create issue is fixed
                      englishOnly={true}
                    />
                  </Stack>
                </Stack>
              </CollapsibleSectionComponent>
            </Stack>
          )}
          {!isFabricNative() && userContext.apiType !== "Tables" && (
            <CollapsibleSectionComponent
              title={t(Keys.panes.addCollection.advanced)}
              isExpandedByDefault={false}
              onExpand={() => {
                TelemetryProcessor.traceOpen(Action.ExpandAddCollectionPaneAdvancedSection);
                scrollToSection("collapsibleAdvancedSectionContent");
              }}
            >
              <Stack className="panelGroupSpacing" id="collapsibleAdvancedSectionContent">
                {isCapabilityEnabled("EnableMongo") && !isCapabilityEnabled("EnableMongo16MBDocumentSupport") && (
                  <Stack className="panelGroupSpacing">
                    <Stack horizontal>
                      <span className="mandatoryStar">*&nbsp;</span>
                      <Text className="panelTextBold" variant="small">
                        {t(Keys.panes.addCollection.indexing)}
                      </Text>
                      <TooltipHost
                        directionalHint={DirectionalHint.bottomLeftEdge}
                        content={t(Keys.panes.addCollection.mongoIndexingTooltip)}
                      >
                        <Icon
                          iconName="Info"
                          className="panelInfoIcon"
                          tabIndex={0}
                          ariaLabel={t(Keys.panes.addCollection.mongoIndexingTooltip)}
                        />
                      </TooltipHost>
                    </Stack>

                    <Checkbox
                      label={t(Keys.panes.addCollection.createWildcardIndex)}
                      checked={this.state.createMongoWildCardIndex}
                      styles={{
                        text: { fontSize: 12, color: "var(--colorNeutralForeground1)" },
                        checkbox: { width: 12, height: 12 },
                        label: { padding: 0, alignItems: "center" },
                        root: {
                          selectors: {
                            ":hover .ms-Checkbox-text": { color: "var(--colorNeutralForeground1)" },
                          },
                        },
                      }}
                      onChange={(ev: React.FormEvent<HTMLElement>, isChecked: boolean) =>
                        this.setState({ createMongoWildCardIndex: isChecked })
                      }
                    />
                  </Stack>
                )}

                {userContext.apiType === "SQL" && (
                  <Stack className="panelGroupSpacing">
                    <Checkbox
                      label={t(Keys.panes.addCollection.legacySdkCheckbox)}
                      checked={this.state.useHashV1}
                      styles={{
                        text: { fontSize: 12, color: "var(--colorNeutralForeground1)" },
                        checkbox: { width: 12, height: 12 },
                        label: { padding: 0, alignItems: "center", wordWrap: "break-word", whiteSpace: "break-spaces" },
                        root: {
                          selectors: {
                            ":hover .ms-Checkbox-text": { color: "var(--colorNeutralForeground1)" },
                          },
                        },
                      }}
                      onChange={(ev: React.FormEvent<HTMLElement>, isChecked: boolean) =>
                        this.setState({ useHashV1: isChecked, subPartitionKeys: [] })
                      }
                    />
                    <Text variant="small" style={{ color: "var(--colorNeutralForeground1)" }}>
                      <Icon iconName="InfoSolid" className="removeIcon" /> {t(Keys.panes.addCollection.legacySdkInfo)}{" "}
                      <Link href="https://aka.ms/cosmos-large-pk" target="_blank">
                        {t(Keys.common.learnMore)}
                      </Link>
                    </Text>
                  </Stack>
                )}
              </Stack>
            </CollapsibleSectionComponent>
          )}
        </div>

        {!this.props.isCopyJobFlow && (
          <PanelFooterComponent buttonLabel={t(Keys.common.ok)} isButtonDisabled={this.state.isThroughputCapExceeded} />
        )}

        {this.state.isExecuting && (
          <div>
            <PanelLoadingScreen />
            {this.state.teachingBubbleStep === 5 && (
              <TeachingBubble
                headline={t(Keys.panes.addCollection.teachingBubble.step5Headline)}
                target={"#loadingScreen"}
                onDismiss={() => this.setState({ teachingBubbleStep: 0 })}
                styles={{ footer: { width: "100%" } }}
              >
                {t(Keys.panes.addCollection.teachingBubble.step5Body)}
                <br />
                <br />
                {t(Keys.panes.addCollection.teachingBubble.step5BodyFollowUp)}
                <br />
                <br />
                <ProgressIndicator
                  styles={{
                    itemName: { color: "white" },
                    progressTrack: { backgroundColor: "#A6A6A6" },
                    progressBar: { background: "white" },
                  }}
                  label={t(Keys.panes.addCollection.addingSampleDataSet)}
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
      ? t(Keys.panes.addCollection.indexingOnInfo)
      : t(Keys.panes.addCollection.indexingOffInfo);
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
      return true;
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

    return this.state.createNewDatabase ? false : this.isSelectedDatabaseSharedThroughput();
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

    const throughput = this.collectionThroughput;
    if (throughput > CollectionCreation.DefaultCollectionRUs100K && !this.isCostAcknowledged) {
      const errorMessage = this.isCollectionAutoscale
        ? t(Keys.panes.addCollection.acknowledgeSpendErrorMonthly)
        : t(Keys.panes.addCollection.acknowledgeSpendErrorDaily);
      this.setState({ errorMessage });
      return false;
    }

    if (throughput > CollectionCreation.MaxRUPerPartition && !this.state.isSharded) {
      this.setState({ errorMessage: t(Keys.panes.addCollection.unshardedMaxRuError) });
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
        this.setState({ errorMessage: t(Keys.panes.addCollection.vectorPolicyError) });
        return false;
      }

      if (!this.state.fullTextPolicyValidated) {
        this.setState({ errorMessage: t(Keys.panes.addCollection.fullTextSearchPolicyError) });
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
        shared: this.state.createNewDatabase ? false : this.isSelectedDatabaseSharedThroughput(),
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
      ? false
      : this.isSelectedDatabaseSharedThroughput() && !this.state.enableDedicatedThroughput;

    let offerThroughput: number;
    let autoPilotMaxThroughput: number;

    // Throughput
    if (isFabricNative()) {
      autoPilotMaxThroughput = DEFAULT_FABRIC_NATIVE_CONTAINER_THROUGHPUT;
      offerThroughput = undefined;
    } else if (databaseLevelThroughput) {
      // Existing shared database: no collection-level throughput needed
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

      if (this.props.isCopyJobFlow && this.props.onSubmitSuccess) {
        this.props.onSubmitSuccess({ databaseId, collectionId });
      } else {
        TelemetryProcessor.traceSuccess(Action.CreateCollection, telemetryData, startKey);
        useSidePanel.getState().closeSidePanel();
      }
    } catch (error) {
      const errorMessage: string = getErrorMessage(error);
      this.setState({ isExecuting: false, errorMessage, showErrorDetails: true });
      const failureTelemetryData = { ...telemetryData, error: errorMessage, errorStack: getErrorStack(error) };
      TelemetryProcessor.traceFailure(Action.CreateCollection, failureTelemetryData, startKey);
    }
  }
}
