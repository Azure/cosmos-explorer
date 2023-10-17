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
import { SubscriptionType } from "Contracts/SubscriptionType";
import { useSidePanel } from "hooks/useSidePanel";
import { useTeachingBubble } from "hooks/useTeachingBubble";
import React from "react";
import { CollectionCreation } from "Shared/Constants";
import { Action } from "Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "Shared/Telemetry/TelemetryProcessor";
import { userContext } from "UserContext";
import { getCollectionName } from "Utils/APITypeUtils";
import { isCapabilityEnabled, isServerlessAccount } from "Utils/CapabilityUtils";
import { getUpsellMessage } from "Utils/PricingUtils";
import { CollapsibleSectionComponent } from "../Controls/CollapsiblePanel/CollapsibleSectionComponent";
import { ThroughputInput } from "../Controls/ThroughputInput/ThroughputInput";
import "../Controls/ThroughputInput/ThroughputInput.less";
import { ContainerSampleGenerator } from "../DataSamples/ContainerSampleGenerator";
import Explorer from "../Explorer";
import { useDatabases } from "../useDatabases";
import { PanelFooterComponent } from "./PanelFooterComponent";
import { PanelInfoErrorComponent } from "./PanelInfoErrorComponent";
import { PanelLoadingScreen } from "./PanelLoadingScreen";

export interface AddCollectionPanelProps {
  explorer: Explorer;
  databaseId?: string;
  isQuickstart?: boolean;
}

const SharedDatabaseDefault: DataModels.IndexingPolicy = {
  indexingMode: "consistent",
  automatic: true,
  includedPaths: [],
  excludedPaths: [
    {
      path: "/*",
    },
  ],
};

export const AllPropertiesIndexed: DataModels.IndexingPolicy = {
  indexingMode: "consistent",
  automatic: true,
  includedPaths: [
    {
      path: "/*",
      indexes: [
        {
          kind: "Range",
          dataType: "Number",
          precision: -1,
        },
        {
          kind: "Range",
          dataType: "String",
          precision: -1,
        },
      ],
    },
  ],
  excludedPaths: [],
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
}

export class AddCollectionPanel extends React.Component<AddCollectionPanelProps, AddCollectionPanelState> {
  private newDatabaseThroughput: number;
  private isNewDatabaseAutoscale: boolean;
  private collectionThroughput: number;
  private isCollectionAutoscale: boolean;
  private isCostAcknowledged: boolean;

  constructor(props: AddCollectionPanelProps) {
    super(props);

    this.state = {
      createNewDatabase: userContext.apiType !== "Tables" && configContext.platform !== Platform.Fabric && !this.props.databaseId,
      newDatabaseId: props.isQuickstart ? this.getSampleDBName() : "",
      isSharedThroughputChecked: this.getSharedThroughputDefault(),
      selectedDatabaseId:
        userContext.apiType === "Tables" ? CollectionCreation.TablesAPIDefaultDatabase : this.props.databaseId,
      collectionId: props.isQuickstart ? `Sample${getCollectionName()}` : "",
      enableIndexing: true,
      isSharded: userContext.apiType !== "Tables",
      partitionKey: this.getPartitionKey(),
      subPartitionKeys: [],
      enableDedicatedThroughput: false,
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
    };
  }

  componentDidMount(): void {
    if (this.state.teachingBubbleStep === 0 && this.props.isQuickstart) {
      this.setState({ teachingBubbleStep: 1 });
    }
  }

  render(): JSX.Element {
    const isFirstResourceCreated = useDatabases.getState().isFirstResourceCreated();

    return (
      <form className="panelFormWrapper" onSubmit={this.submit.bind(this)}>
        {this.state.errorMessage && (
          <PanelInfoErrorComponent
            message={this.state.errorMessage}
            messageType="error"
            showErrorDetails={this.state.showErrorDetails}
          />
        )}

        {!this.state.errorMessage && this.isFreeTierAccount() && (
          <PanelInfoErrorComponent
            message={getUpsellMessage(userContext.portalEnv, true, isFirstResourceCreated, true)}
            messageType="info"
            showErrorDetails={false}
            link={Constants.Urls.freeTierInformation}
            linkText="Learn more"
          />
        )}

        {this.state.teachingBubbleStep === 1 && (
          <TeachingBubble
            headline="Create sample database"
            target={"#newDatabaseId"}
            calloutProps={{ gapSpace: 16 }}
            primaryButtonProps={{ text: "Next", onClick: () => this.setState({ teachingBubbleStep: 2 }) }}
            secondaryButtonProps={{ text: "Cancel", onClick: () => this.setState({ teachingBubbleStep: 0 }) }}
            onDismiss={() => this.setState({ teachingBubbleStep: 0 })}
            footerContent="Step 1 of 4"
          >
            <Stack>
              <Text style={{ color: "white" }}>
                Database is the parent of a container. You can create a new database or use an existing one. In this
                tutorial we are creating a new database named SampleDB.
              </Text>
              <Link
                style={{ color: "white", fontWeight: 600 }}
                target="_blank"
                href="https://aka.ms/TeachingbubbleResources"
              >
                Learn more about resources.
              </Link>
            </Stack>
          </TeachingBubble>
        )}

        {this.state.teachingBubbleStep === 2 && (
          <TeachingBubble
            headline="Setting throughput"
            target={"#autoscaleRUValueField"}
            calloutProps={{ gapSpace: 16 }}
            primaryButtonProps={{ text: "Next", onClick: () => this.setState({ teachingBubbleStep: 3 }) }}
            secondaryButtonProps={{ text: "Previous", onClick: () => this.setState({ teachingBubbleStep: 1 }) }}
            onDismiss={() => this.setState({ teachingBubbleStep: 0 })}
            footerContent="Step 2 of 4"
          >
            <Stack>
              <Text style={{ color: "white" }}>
                Cosmos DB recommends sharing throughput across database. Autoscale will give you a flexible amount of
                throughput based on the max RU/s set (Request Units).
              </Text>
              <Link style={{ color: "white", fontWeight: 600 }} target="_blank" href="https://aka.ms/teachingbubbleRU">
                Learn more about RU/s.
              </Link>
            </Stack>
          </TeachingBubble>
        )}

        {this.state.teachingBubbleStep === 3 && (
          <TeachingBubble
            headline="Naming container"
            target={"#collectionId"}
            calloutProps={{ gapSpace: 16 }}
            primaryButtonProps={{ text: "Next", onClick: () => this.setState({ teachingBubbleStep: 4 }) }}
            secondaryButtonProps={{ text: "Previous", onClick: () => this.setState({ teachingBubbleStep: 2 }) }}
            onDismiss={() => this.setState({ teachingBubbleStep: 0 })}
            footerContent="Step 3 of 4"
          >
            Name your container
          </TeachingBubble>
        )}

        {this.state.teachingBubbleStep === 4 && (
          <TeachingBubble
            headline="Setting partition key"
            target={"#addCollection-partitionKeyValue"}
            calloutProps={{ gapSpace: 16 }}
            primaryButtonProps={{
              text: "Create container",
              onClick: () => {
                this.setState({ teachingBubbleStep: 5 });
                this.submit();
              },
            }}
            secondaryButtonProps={{ text: "Previous", onClick: () => this.setState({ teachingBubbleStep: 2 }) }}
            onDismiss={() => this.setState({ teachingBubbleStep: 0 })}
            footerContent="Step 4 of 4"
          >
            Last step - you will need to define a partition key for your collection. /address was chosen for this
            particular example. A good partition key should have a wide range of possible value
          </TeachingBubble>
        )}

        <div className="panelMainContent">
          <Stack hidden={userContext.apiType === "Tables"}>
            <Stack horizontal>
              <span className="mandatoryStar">*&nbsp;</span>
              <Text className="panelTextBold" variant="small">
                Database {userContext.apiType === "Mongo" ? "name" : "id"}
              </Text>
              <TooltipHost
                directionalHint={DirectionalHint.bottomLeftEdge}
                content={`A database is analogous to a namespace. It is the unit of management for a set of ${getCollectionName(
                  true,
                ).toLocaleLowerCase()}.`}
              >
                <Icon
                  iconName="Info"
                  className="panelInfoIcon"
                  tabIndex={0}
                  ariaLabel={`A database is analogous to a namespace. It is the unit of management for a set of ${getCollectionName(
                    true,
                  ).toLocaleLowerCase()}.`}
                />
              </TooltipHost>
            </Stack>

            {configContext.platform !== Platform.Fabric && (
              <Stack horizontal verticalAlign="center">
                <div role="radiogroup">
                  <input
                    className="panelRadioBtn"
                    checked={this.state.createNewDatabase}
                    aria-label="Create new database"
                    aria-checked={this.state.createNewDatabase}
                    name="databaseType"
                    type="radio"
                    role="radio"
                    id="databaseCreateNew"
                    tabIndex={0}
                    onChange={this.onCreateNewDatabaseRadioBtnChange.bind(this)}
                  />
                  <span className="panelRadioBtnLabel">Create new</span>

                  <input
                    className="panelRadioBtn"
                    checked={!this.state.createNewDatabase}
                    aria-label="Use existing database"
                    aria-checked={!this.state.createNewDatabase}
                    name="databaseType"
                    type="radio"
                    role="radio"
                    tabIndex={0}
                    onChange={this.onUseExistingDatabaseRadioBtnChange.bind(this)}
                  />
                  <span className="panelRadioBtnLabel">Use existing</span>
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
                  pattern="[^/?#\\]*[^/?# \\]"
                  title="May not end with space nor contain characters '\' '/' '#' '?'"
                  placeholder="Type a new database id"
                  size={40}
                  className="panelTextField"
                  aria-label="New database id, Type a new database id"
                  autoFocus
                  tabIndex={0}
                  value={this.state.newDatabaseId}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    this.setState({ newDatabaseId: event.target.value })
                  }
                />

                {!isServerlessAccount() && (
                  <Stack horizontal>
                    <Checkbox
                      label={`Share throughput across ${getCollectionName(true).toLocaleLowerCase()}`}
                      checked={this.state.isSharedThroughputChecked}
                      styles={{
                        text: { fontSize: 12 },
                        checkbox: { width: 12, height: 12 },
                        label: { padding: 0, alignItems: "center" },
                      }}
                      onChange={(ev: React.FormEvent<HTMLElement>, isChecked: boolean) =>
                        this.setState({ isSharedThroughputChecked: isChecked })
                      }
                    />
                    <TooltipHost
                      directionalHint={DirectionalHint.bottomLeftEdge}
                      content={`Throughput configured at the database level will be shared across all ${getCollectionName(
                        true,
                      ).toLocaleLowerCase()} within the database.`}
                    >
                      <Icon
                        iconName="Info"
                        className="panelInfoIcon"
                        tabIndex={0}
                        ariaLabel={`Throughput configured at the database level will be shared across all ${getCollectionName(
                          true,
                        ).toLocaleLowerCase()} within the database.`}
                      />
                    </TooltipHost>
                  </Stack>
                )}

                {!isServerlessAccount() && this.state.isSharedThroughputChecked && (
                  <ThroughputInput
                    showFreeTierExceedThroughputTooltip={this.isFreeTierAccount() && !isFirstResourceCreated}
                    isDatabase={true}
                    isSharded={this.state.isSharded}
                    isFreeTier={this.isFreeTierAccount()}
                    isQuickstart={this.props.isQuickstart}
                    setThroughputValue={(throughput: number) => (this.newDatabaseThroughput = throughput)}
                    setIsAutoscale={(isAutoscale: boolean) => (this.isNewDatabaseAutoscale = isAutoscale)}
                    setIsThroughputCapExceeded={(isThroughputCapExceeded: boolean) =>
                      this.setState({ isThroughputCapExceeded })
                    }
                    onCostAcknowledgeChange={(isAcknowledge: boolean) => (this.isCostAcknowledged = isAcknowledge)}
                  />
                )}
              </Stack>
            )}
            {!this.state.createNewDatabase && (
              <Dropdown
                styles={{ title: { height: 27, lineHeight: 27 }, dropdownItem: { fontSize: 12 } }}
                style={{ width: 300, fontSize: 12 }}
                placeholder="Choose an existing database"
                options={this.getDatabaseOptions()}
                onChange={(event: React.FormEvent<HTMLDivElement>, database: IDropdownOption) =>
                  this.setState({ selectedDatabaseId: database.key as string })
                }
                defaultSelectedKey={this.props.databaseId}
                responsiveMode={999}
              />
            )}
            <Separator className="panelSeparator" />
          </Stack>

          <Stack>
            <Stack horizontal>
              <span className="mandatoryStar">*&nbsp;</span>
              <Text className="panelTextBold" variant="small">
                {`${getCollectionName()} id`}
              </Text>
              <TooltipHost
                directionalHint={DirectionalHint.bottomLeftEdge}
                content={`Unique identifier for the ${getCollectionName().toLocaleLowerCase()} and used for id-based routing through REST and all SDKs.`}
              >
                <Icon
                  role="button"
                  iconName="Info"
                  className="panelInfoIcon"
                  tabIndex={0}
                  ariaLabel={`Unique identifier for the ${getCollectionName().toLocaleLowerCase()} and used for id-based routing through REST and all SDKs.`}
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
              pattern="[^/?#\\]*[^/?# \\]"
              title="May not end with space nor contain characters '\' '/' '#' '?'"
              placeholder={`e.g., ${getCollectionName()}1`}
              size={40}
              className="panelTextField"
              aria-label={`${getCollectionName()} id, Example ${getCollectionName()}1`}
              value={this.state.collectionId}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                this.setState({ collectionId: event.target.value })
              }
            />
          </Stack>

          {this.shouldShowIndexingOptionsForFreeTierAccount() && (
            <Stack>
              <Stack horizontal>
                <span className="mandatoryStar">*&nbsp;</span>
                <Text className="panelTextBold" variant="small">
                  Indexing
                </Text>
              </Stack>

              <Stack horizontal verticalAlign="center">
                <input
                  className="panelRadioBtn"
                  checked={this.state.enableIndexing}
                  aria-label="Turn on indexing"
                  aria-checked={this.state.enableIndexing}
                  type="radio"
                  role="radio"
                  tabIndex={0}
                  onChange={this.onTurnOnIndexing.bind(this)}
                />
                <span className="panelRadioBtnLabel">Automatic</span>

                <input
                  className="panelRadioBtn"
                  checked={!this.state.enableIndexing}
                  aria-label="Turn off indexing"
                  aria-checked={!this.state.enableIndexing}
                  type="radio"
                  role="radio"
                  tabIndex={0}
                  onChange={this.onTurnOffIndexing.bind(this)}
                />
                <span className="panelRadioBtnLabel">Off</span>
              </Stack>

              <Text variant="small">
                {this.getFreeTierIndexingText()}{" "}
                <Link target="_blank" href="https://aka.ms/cosmos-indexing-policy">
                  Learn more
                </Link>
              </Text>
            </Stack>
          )}

          {userContext.apiType === "Mongo" &&
            (!this.state.isSharedThroughputChecked ||
              this.props.explorer.isFixedCollectionWithSharedThroughputSupported()) && (
              <Stack>
                <Stack horizontal>
                  <span className="mandatoryStar">*&nbsp;</span>
                  <Text className="panelTextBold" variant="small">
                    Sharding
                  </Text>
                  <TooltipHost
                    directionalHint={DirectionalHint.bottomLeftEdge}
                    content={
                      "Sharded collections split your data across many replica sets (shards) to achieve unlimited scalability. Sharded collections require choosing a shard key (field) to evenly distribute your data."
                    }
                  >
                    <Icon
                      iconName="Info"
                      className="panelInfoIcon"
                      tabIndex={0}
                      ariaLabel={
                        "Sharded collections split your data across many replica sets (shards) to achieve unlimited scalability. Sharded collections require choosing a shard key (field) to evenly distribute your data."
                      }
                    />
                  </TooltipHost>
                </Stack>

                <Stack horizontal verticalAlign="center">
                  <input
                    className="panelRadioBtn"
                    checked={!this.state.isSharded}
                    aria-label="Unsharded"
                    aria-checked={!this.state.isSharded}
                    name="unsharded"
                    type="radio"
                    role="radio"
                    id="unshardedOption"
                    tabIndex={0}
                    onChange={this.onUnshardedRadioBtnChange.bind(this)}
                  />
                  <span className="panelRadioBtnLabel">Unsharded (20GB limit)</span>

                  <input
                    className="panelRadioBtn"
                    checked={this.state.isSharded}
                    aria-label="Sharded"
                    aria-checked={this.state.isSharded}
                    name="sharded"
                    type="radio"
                    role="radio"
                    id="shardedOption"
                    tabIndex={0}
                    onChange={this.onShardedRadioBtnChange.bind(this)}
                  />
                  <span className="panelRadioBtnLabel">Sharded</span>
                </Stack>
              </Stack>
            )}

          {this.state.isSharded && (
            <Stack>
              <Stack horizontal>
                <span className="mandatoryStar">*&nbsp;</span>
                <Text className="panelTextBold" variant="small">
                  {this.getPartitionKeyName()}
                </Text>
                <TooltipHost
                  directionalHint={DirectionalHint.bottomLeftEdge}
                  content={this.getPartitionKeyTooltipText()}
                >
                  <Icon
                    iconName="Info"
                    className="panelInfoIcon"
                    tabIndex={0}
                    ariaLabel={this.getPartitionKeyTooltipText()}
                  />
                </TooltipHost>
              </Stack>

              <Text variant="small" aria-label="pkDescription">
                {this.getPartitionKeySubtext()}
              </Text>

              <input
                type="text"
                id="addCollection-partitionKeyValue"
                aria-required
                required
                size={40}
                className="panelTextField"
                placeholder={this.getPartitionKeyPlaceHolder()}
                aria-label={this.getPartitionKeyName()}
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
                    <Stack style={{ marginBottom: 8 }} key={`uniqueKey${index}`} horizontal>
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
                        placeholder={this.getPartitionKeyPlaceHolder(index)}
                        aria-label={this.getPartitionKeyName()}
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
            </Stack>
          )}

          {!isServerlessAccount() && !this.state.createNewDatabase && this.isSelectedDatabaseSharedThroughput() && (
            <Stack horizontal verticalAlign="center">
              <Checkbox
                label={`Provision dedicated throughput for this ${getCollectionName().toLocaleLowerCase()}`}
                checked={this.state.enableDedicatedThroughput}
                styles={{
                  text: { fontSize: 12 },
                  checkbox: { width: 12, height: 12 },
                  label: { padding: 0, alignItems: "center" },
                }}
                onChange={(ev: React.FormEvent<HTMLElement>, isChecked: boolean) =>
                  this.setState({ enableDedicatedThroughput: isChecked })
                }
              />
              <TooltipHost
                directionalHint={DirectionalHint.bottomLeftEdge}
                content={`You can optionally provision dedicated throughput for a ${getCollectionName().toLocaleLowerCase()} within a database that has throughput
                  provisioned. This dedicated throughput amount will not be shared with other ${getCollectionName(
                  true,
                ).toLocaleLowerCase()} in the database and
                  does not count towards the throughput you provisioned for the database. This throughput amount will be
                  billed in addition to the throughput amount you provisioned at the database level.`}
              >
                <Icon
                  iconName="Info"
                  className="panelInfoIcon"
                  tabIndex={0}
                  ariaLabel={`You can optionally provision dedicated throughput for a ${getCollectionName().toLocaleLowerCase()} within a database that has throughput
                provisioned. This dedicated throughput amount will not be shared with other ${getCollectionName(
                    true,
                  ).toLocaleLowerCase()} in the database and
                does not count towards the throughput you provisioned for the database. This throughput amount will be
                billed in addition to the throughput amount you provisioned at the database level.`}
                />
              </TooltipHost>
            </Stack>
          )}

          {this.shouldShowCollectionThroughputInput() && (
            <ThroughputInput
              showFreeTierExceedThroughputTooltip={this.isFreeTierAccount() && !isFirstResourceCreated}
              isDatabase={false}
              isSharded={this.state.isSharded}
              isFreeTier={this.isFreeTierAccount()}
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

          {userContext.apiType === "SQL" && (
            <Stack>
              <Stack horizontal>
                <Text className="panelTextBold" variant="small">
                  Unique keys
                </Text>
                <TooltipHost
                  directionalHint={DirectionalHint.bottomLeftEdge}
                  content={
                    "Unique keys provide developers with the ability to add a layer of data integrity to their database. By creating a unique key policy when a container is created, you ensure the uniqueness of one or more values per partition key."
                  }
                >
                  <Icon
                    iconName="Info"
                    className="panelInfoIcon"
                    tabIndex={0}
                    ariaLabel={
                      "Unique keys provide developers with the ability to add a layer of data integrity to their database. By creating a unique key policy when a container is created, you ensure the uniqueness of one or more values per partition key."
                    }
                  />
                </TooltipHost>
              </Stack>

              {this.state.uniqueKeys.map((uniqueKey: string, i: number): JSX.Element => {
                return (
                  <Stack style={{ marginBottom: 8 }} key={`uniqueKey${i}`} horizontal>
                    <input
                      type="text"
                      autoComplete="off"
                      placeholder={
                        userContext.apiType === "Mongo"
                          ? "Comma separated paths e.g. firstName,address.zipCode"
                          : "Comma separated paths e.g. /firstName,/address/zipCode"
                      }
                      className="panelTextField"
                      autoFocus
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
                styles={{ root: { padding: 0 }, label: { fontSize: 12 } }}
                onClick={() => this.setState({ uniqueKeys: [...this.state.uniqueKeys, ""] })}
              >
                Add unique key
              </ActionButton>
            </Stack>
          )}

          {this.shouldShowAnalyticalStoreOptions() && (
            <Stack className="panelGroupSpacing">
              <Stack horizontal>
                <Text className="panelTextBold" variant="small">
                  Analytical store
                </Text>
                <TooltipHost
                  directionalHint={DirectionalHint.bottomLeftEdge}
                  content={this.getAnalyticalStorageTooltipContent()}
                >
                  <Icon
                    iconName="Info"
                    className="panelInfoIcon"
                    tabIndex={0}
                    ariaLabel="Enable analytical store capability to perform near real-time analytics on your operational data, without
        impacting the performance of transactional workloads."
                  />
                </TooltipHost>
              </Stack>

              <Stack horizontal verticalAlign="center">
                <div role="radiogroup">
                  <input
                    className="panelRadioBtn"
                    checked={this.state.enableAnalyticalStore}
                    disabled={!this.isSynapseLinkEnabled()}
                    aria-label="Enable analytical store"
                    aria-checked={this.state.enableAnalyticalStore}
                    name="analyticalStore"
                    type="radio"
                    role="radio"
                    id="enableAnalyticalStoreBtn"
                    tabIndex={0}
                    onChange={this.onEnableAnalyticalStoreRadioBtnChange.bind(this)}
                  />
                  <span className="panelRadioBtnLabel">On</span>

                  <input
                    className="panelRadioBtn"
                    checked={!this.state.enableAnalyticalStore}
                    disabled={!this.isSynapseLinkEnabled()}
                    aria-label="Disable analytical store"
                    aria-checked={!this.state.enableAnalyticalStore}
                    name="analyticalStore"
                    type="radio"
                    role="radio"
                    id="disableAnalyticalStoreBtn"
                    tabIndex={0}
                    onChange={this.onDisableAnalyticalStoreRadioBtnChange.bind(this)}
                  />
                  <span className="panelRadioBtnLabel">Off</span>
                </div>
              </Stack>

              {!this.isSynapseLinkEnabled() && (
                <Stack className="panelGroupSpacing">
                  <Text variant="small">
                    Azure Synapse Link is required for creating an analytical store{" "}
                    {getCollectionName().toLocaleLowerCase()}. Enable Synapse Link for this Cosmos DB account.{" "}
                    <Link
                      href="https://aka.ms/cosmosdb-synapselink"
                      target="_blank"
                      className="capacitycalculator-link"
                    >
                      Learn more
                    </Link>
                  </Text>
                  <DefaultButton
                    text="Enable"
                    onClick={() => this.props.explorer.openEnableSynapseLinkDialog()}
                    style={{ height: 27, width: 80 }}
                    styles={{ label: { fontSize: 12 } }}
                  />
                </Stack>
              )}
            </Stack>
          )}

          {userContext.apiType !== "Tables" && (
            <CollapsibleSectionComponent
              title="Advanced"
              isExpandedByDefault={false}
              onExpand={() => {
                TelemetryProcessor.traceOpen(Action.ExpandAddCollectionPaneAdvancedSection);
                this.scrollToAdvancedSection();
              }}
            >
              <Stack className="panelGroupSpacing" id="collapsibleSectionContent">
                {isCapabilityEnabled("EnableMongo") && !isCapabilityEnabled("EnableMongo16MBDocumentSupport") && (
                  <Stack className="panelGroupSpacing">
                    <Stack horizontal>
                      <span className="mandatoryStar">*&nbsp;</span>
                      <Text className="panelTextBold" variant="small">
                        Indexing
                      </Text>
                      <TooltipHost
                        directionalHint={DirectionalHint.bottomLeftEdge}
                        content="The _id field is indexed by default. Creating a wildcard index for all fields will optimize queries and is recommended for development."
                      >
                        <Icon
                          iconName="Info"
                          className="panelInfoIcon"
                          tabIndex={0}
                          ariaLabel="The _id field is indexed by default. Creating a wildcard index for all fields will optimize queries and is recommended for development."
                        />
                      </TooltipHost>
                    </Stack>

                    <Checkbox
                      label="Create a Wildcard Index on all fields"
                      checked={this.state.createMongoWildCardIndex}
                      styles={{
                        text: { fontSize: 12 },
                        checkbox: { width: 12, height: 12 },
                        label: { padding: 0, alignItems: "center" },
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
                      label="My application uses an older Cosmos .NET or Java SDK version (.NET V1 or Java V2)"
                      checked={this.state.useHashV1}
                      styles={{
                        text: { fontSize: 12 },
                        checkbox: { width: 12, height: 12 },
                        label: { padding: 0, alignItems: "center", wordWrap: "break-word", whiteSpace: "break-spaces" },
                      }}
                      onChange={(ev: React.FormEvent<HTMLElement>, isChecked: boolean) =>
                        this.setState({ useHashV1: isChecked, subPartitionKeys: [] })
                      }
                    />
                    <Text variant="small">
                      <Icon iconName="InfoSolid" className="removeIcon" tabIndex={0} /> To ensure compatibility with
                      older SDKs, the created container will use a legacy partitioning scheme that supports partition
                      key values of size only up to 101 bytes. If this is enabled, you will not be able to use
                      hierarchical partition keys.{" "}
                      <Link href="https://aka.ms/cosmos-large-pk" target="_blank">
                        Learn more
                      </Link>
                    </Text>
                  </Stack>
                )}
              </Stack>
            </CollapsibleSectionComponent>
          )}
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

  private getPartitionKeyName(isLowerCase?: boolean): string {
    const partitionKeyName = userContext.apiType === "Mongo" ? "Shard key" : "Partition key";

    return isLowerCase ? partitionKeyName.toLocaleLowerCase() : partitionKeyName;
  }

  private getPartitionKeyPlaceHolder(index?: number): string {
    switch (userContext.apiType) {
      case "Mongo":
        return "e.g., categoryId";
      case "Gremlin":
        return "e.g., /address";
      case "SQL":
        return `${index === undefined
          ? "Required - first partition key e.g., /TenantId"
          : index === 0
            ? "second partition key e.g., /UserId"
            : "third partition key e.g., /SessionId"
          }`;
      default:
        return "e.g., /address/zipCode";
    }
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

  private isSelectedDatabaseSharedThroughput(): boolean {
    if (!this.state.selectedDatabaseId) {
      return false;
    }

    const selectedDatabase = useDatabases
      .getState()
      .databases?.find((database) => database.id() === this.state.selectedDatabaseId);
    return !!selectedDatabase?.offer();
  }

  private isFreeTierAccount(): boolean {
    return userContext.databaseAccount?.properties?.enableFreeTier;
  }

  private getSharedThroughputDefault(): boolean {
    return userContext.subscriptionType !== SubscriptionType.EA && !isServerlessAccount();
  }

  private getFreeTierIndexingText(): string {
    return this.state.enableIndexing
      ? "All properties in your documents will be indexed by default for flexible and efficient queries."
      : "Indexing will be turned off. Recommended if you don't need to run queries or only have key value operations.";
  }

  private getPartitionKeyTooltipText(): string {
    if (userContext.apiType === "Mongo") {
      return "The shard key (field) is used to split your data across many replica sets (shards) to achieve unlimited scalability. It’s critical to choose a field that will evenly distribute your data.";
    }

    let tooltipText = `The ${this.getPartitionKeyName(
      true,
    )} is used to automatically distribute data across partitions for scalability. Choose a property in your JSON document that has a wide range of values and evenly distributes request volume.`;

    if (userContext.apiType === "SQL") {
      tooltipText += " For small read-heavy workloads or write-heavy workloads of any size, id is often a good choice.";
    }

    return tooltipText;
  }

  private getPartitionKey(): string {
    if (userContext.apiType !== "SQL" && userContext.apiType !== "Mongo") {
      return "";
    }
    if (userContext.features.partitionKeyDefault) {
      return userContext.apiType === "SQL" ? "/id" : "_id";
    }
    if (userContext.features.partitionKeyDefault2) {
      return userContext.apiType === "SQL" ? "/pk" : "pk";
    }
    if (this.props.isQuickstart) {
      return userContext.apiType === "SQL" ? "/categoryId" : "categoryId";
    }
    return "";
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

  private getAnalyticalStorageTooltipContent(): JSX.Element {
    return (
      <Text variant="small">
        Enable analytical store capability to perform near real-time analytics on your operational data, without
        impacting the performance of transactional workloads.{" "}
        <Link target="_blank" href="https://aka.ms/analytical-store-overview">
          Learn more
        </Link>
      </Text>
    );
  }

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
    if (!this.isFreeTierAccount()) {
      return false;
    }

    return this.state.createNewDatabase
      ? this.state.isSharedThroughputChecked
      : this.isSelectedDatabaseSharedThroughput();
  }

  private shouldShowAnalyticalStoreOptions(): boolean {
    if (configContext.platform === Platform.Emulator) {
      return false;
    }

    switch (userContext.apiType) {
      case "SQL":
      case "Mongo":
        return true;
      default:
        return false;
    }
  }

  private isSynapseLinkEnabled(): boolean {
    if (!userContext.databaseAccount) {
      return false;
    }

    const { properties } = userContext.databaseAccount;
    if (!properties) {
      return false;
    }

    if (properties.enableAnalyticalStorage) {
      return true;
    }

    return properties.capabilities?.some(
      (capability) => capability.name === Constants.CapabilityNames.EnableStorageAnalytics,
    );
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

    return true;
  }

  private getAnalyticalStorageTtl(): number {
    if (!this.isSynapseLinkEnabled()) {
      return undefined;
    }

    if (!this.shouldShowAnalyticalStoreOptions()) {
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

  private scrollToAdvancedSection(): void {
    document.getElementById("collapsibleSectionContent")?.scrollIntoView();
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

    const uniqueKeyPolicy: DataModels.UniqueKeyPolicy = this.parseUniqueKeys();
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

    if (databaseLevelThroughput) {
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
      // open NPS Survey Dialog once the collection is created
      this.props.explorer.openNPSSurveyDialog();
    } catch (error) {
      const errorMessage: string = getErrorMessage(error);
      this.setState({ isExecuting: false, errorMessage, showErrorDetails: true });
      const failureTelemetryData = { ...telemetryData, error: errorMessage, errorStack: getErrorStack(error) };
      TelemetryProcessor.traceFailure(Action.CreateCollection, failureTelemetryData, startKey);
    }
  }
}
