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
  Stack,
  Text,
  TooltipHost,
} from "office-ui-fabric-react";
import React from "react";
import * as Constants from "../../Common/Constants";
import { createCollection } from "../../Common/dataAccess/createCollection";
import { getErrorMessage, getErrorStack } from "../../Common/ErrorHandlingUtils";
import { configContext, Platform } from "../../ConfigContext";
import * as DataModels from "../../Contracts/DataModels";
import { SubscriptionType } from "../../Contracts/SubscriptionType";
import { CollectionCreation, IndexingPolicies } from "../../Shared/Constants";
import { Action } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../UserContext";
import { getUpsellMessage } from "../../Utils/PricingUtils";
import { CollapsibleSectionComponent } from "../Controls/CollapsiblePanel/CollapsibleSectionComponent";
import { ThroughputInput } from "../Controls/ThroughputInput/ThroughputInput";
import Explorer from "../Explorer";
import { PanelFooterComponent } from "./PanelFooterComponent";
import { PanelInfoErrorComponent } from "./PanelInfoErrorComponent";
import { PanelLoadingScreen } from "./PanelLoadingScreen";

export interface AddCollectionPanelProps {
  explorer: Explorer;
  closePanel: () => void;
  openNotificationConsole: () => void;
}

export interface AddCollectionPanelState {
  createNewDatabase: boolean;
  newDatabaseId: string;
  isSharedThroughputChecked: boolean;
  selectedDatabaseId: string;
  collectionId: string;
  enableIndexing: boolean;
  isSharded: boolean;
  partitionKey: string;
  enableDedicatedThroughput: boolean;
  createMongoWildCardIndex: boolean;
  useHashV1: boolean;
  enableAnalyticalStore: boolean;
  uniqueKeys: string[];
  errorMessage: string;
  showErrorDetails: boolean;
  isExecuting: boolean;
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
      createNewDatabase: userContext.apiType !== "Tables",
      newDatabaseId: "",
      isSharedThroughputChecked: this.getSharedThroughputDefault(),
      selectedDatabaseId: userContext.apiType === "Tables" ? CollectionCreation.TablesAPIDefaultDatabase : undefined,
      collectionId: "",
      enableIndexing: true,
      isSharded: userContext.apiType !== "Tables",
      partitionKey: "",
      enableDedicatedThroughput: false,
      createMongoWildCardIndex: true,
      useHashV1: false,
      enableAnalyticalStore: false,
      uniqueKeys: [],
      errorMessage: "",
      showErrorDetails: false,
      isExecuting: false,
    };
  }

  render(): JSX.Element {
    return (
      <form className="panelFormWrapper" onSubmit={this.submit.bind(this)}>
        {this.state.errorMessage && (
          <PanelInfoErrorComponent
            message={this.state.errorMessage}
            messageType="error"
            showErrorDetails={this.state.showErrorDetails}
            openNotificationConsole={this.props.openNotificationConsole}
          />
        )}

        {!this.state.errorMessage && this.isFreeTierAccount() && (
          <PanelInfoErrorComponent
            message={getUpsellMessage(
              userContext.portalEnv,
              true,
              this.props.explorer.isFirstResourceCreated(),
              userContext.apiType,
              true
            )}
            messageType="info"
            showErrorDetails={false}
            openNotificationConsole={this.props.openNotificationConsole}
            link={Constants.Urls.freeTierInformation}
            linkText="Learn more"
          />
        )}

        <div className="panelMainContent">
          <Stack hidden={userContext.apiType === "Tables"}>
            <Stack horizontal>
              <span className="mandatoryStar">*&nbsp;</span>
              <Text className="panelTextBold" variant="small">
                Database id
              </Text>
              <TooltipHost
                directionalHint={DirectionalHint.bottomLeftEdge}
                content="A database is analogous to a namespace. It is the unit of management for a set of containers."
              >
                <Icon iconName="InfoSolid" className="panelInfoIcon" />
              </TooltipHost>
            </Stack>

            <Stack horizontal verticalAlign="center">
              <input
                className="panelRadioBtn"
                checked={this.state.createNewDatabase}
                aria-label="Create new database"
                aria-checked={this.state.createNewDatabase}
                name="databaseType"
                type="radio"
                role="radio"
                id="databaseCreateNew"
                data-test="addCollection-createNewDatabase"
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
                id="databaseUseExisting"
                data-test="addCollection-existingDatabase"
                tabIndex={0}
                onChange={this.onUseExistingDatabaseRadioBtnChange.bind(this)}
              />
              <span className="panelRadioBtnLabel">Use existing</span>
            </Stack>

            {this.state.createNewDatabase && (
              <Stack className="panelGroupSpacing">
                <input
                  name="newDatabaseId"
                  id="databaseId"
                  data-test="addCollection-newDatabaseId"
                  aria-required
                  required
                  type="text"
                  autoComplete="off"
                  pattern="[^/?#\\]*[^/?# \\]"
                  title="May not end with space nor contain characters '\' '/' '#' '?'"
                  placeholder="Type a new database id"
                  size={40}
                  className="panelTextField"
                  aria-label="Database id"
                  autoFocus
                  value={this.state.newDatabaseId}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    this.setState({ newDatabaseId: event.target.value })
                  }
                />

                {!this.isServerlessAccount() && (
                  <Stack horizontal>
                    <Checkbox
                      label="Provision database throughput"
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
                      content="Provisioned throughput at the database level will be shared across all containers within the database."
                    >
                      <Icon iconName="InfoSolid" className="panelInfoIcon" />
                    </TooltipHost>
                  </Stack>
                )}

                {!this.isServerlessAccount() && this.state.isSharedThroughputChecked && (
                  <ThroughputInput
                    showFreeTierExceedThroughputTooltip={
                      this.isFreeTierAccount() && !this.props.explorer.isFirstResourceCreated()
                    }
                    isDatabase={true}
                    setThroughputValue={(throughput: number) => (this.newDatabaseThroughput = throughput)}
                    setIsAutoscale={(isAutoscale: boolean) => (this.isNewDatabaseAutoscale = isAutoscale)}
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
              />
            )}
          </Stack>

          <Stack>
            <Stack horizontal>
              <span className="mandatoryStar">*&nbsp;</span>
              <Text className="panelTextBold" variant="small">
                {`${this.getCollectionName()} id`}
              </Text>
              <TooltipHost
                directionalHint={DirectionalHint.bottomLeftEdge}
                content="Unique identifier for the container and used for id-based routing through REST and all SDKs."
              >
                <Icon iconName="InfoSolid" className="panelInfoIcon" />
              </TooltipHost>
            </Stack>

            <input
              name="collectionId"
              id="containerId"
              data-test="addCollection-collectionId"
              type="text"
              aria-required
              required
              autoComplete="off"
              pattern="[^/?#\\]*[^/?# \\]"
              title="May not end with space nor contain characters '\' '/' '#' '?'"
              placeholder={`e.g., ${this.getCollectionName()}1`}
              size={40}
              className="panelTextField"
              aria-label={`${this.getCollectionName()} id`}
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
                    Sharding options
                  </Text>
                  <TooltipHost
                    directionalHint={DirectionalHint.bottomLeftEdge}
                    content="Unique identifier for the container and used for id-based routing through REST and all SDKs."
                  >
                    <Icon iconName="InfoSolid" className="panelInfoIcon" />
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
                  content={`The ${this.getPartitionKeyName()} is used to automatically partition data among
              multiple servers for scalability. Choose a JSON property name that has a wide range of values and is
              likely to have evenly distributed access patterns.`}
                >
                  <Icon iconName="InfoSolid" className="panelInfoIcon" />
                </TooltipHost>
              </Stack>

              <input
                type="text"
                id="addCollection-partitionKeyValue"
                data-test="addCollection-partitionKeyValue"
                aria-required
                required
                size={40}
                className="panelTextField"
                placeholder={this.getPartitionKeyPlaceHolder()}
                aria-label={this.getPartitionKeyName()}
                pattern={userContext.apiType === "Gremlin" ? "^/[^/]*" : ".*"}
                title={userContext.apiType === "Gremlin" ? "May not use composite partition key" : ""}
                value={this.state.partitionKey}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  this.setState({ partitionKey: event.target.value })
                }
              />
            </Stack>
          )}

          {!this.isServerlessAccount() && !this.state.createNewDatabase && this.isSelectedDatabaseSharedThroughput() && (
            <Stack horizontal verticalAlign="center">
              <Checkbox
                label={`Provision dedicated throughput for this ${this.getCollectionName()}`}
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
                content="You can optionally provision dedicated throughput for a container within a database that has throughput
                  provisioned. This dedicated throughput amount will not be shared with other containers in the database and
                  does not count towards the throughput you provisioned for the database. This throughput amount will be
                  billed in addition to the throughput amount you provisioned at the database level."
              >
                <Icon iconName="InfoSolid" className="panelInfoIcon" />
              </TooltipHost>
            </Stack>
          )}

          {this.shouldShowCollectionThroughputInput() && (
            <ThroughputInput
              showFreeTierExceedThroughputTooltip={
                this.isFreeTierAccount() && !this.props.explorer.isFirstResourceCreated()
              }
              isDatabase={false}
              setThroughputValue={(throughput: number) => (this.collectionThroughput = throughput)}
              setIsAutoscale={(isAutoscale: boolean) => (this.isCollectionAutoscale = isAutoscale)}
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
                  content="Unique keys provide developers with the ability to add a layer of data integrity to their database. By
                      creating a unique key policy when a container is created, you ensure the uniqueness of one or more values
                      per partition key."
                >
                  <Icon iconName="InfoSolid" className="panelInfoIcon" />
                </TooltipHost>
              </Stack>

              {this.state.uniqueKeys.map(
                (uniqueKey: string, i: number): JSX.Element => {
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
                }
              )}

              <ActionButton
                iconProps={{ iconName: "Add" }}
                styles={{ root: { padding: 0 }, label: { fontSize: 12 } }}
                onClick={() => this.setState({ uniqueKeys: [...this.state.uniqueKeys, ""] })}
              >
                Add unique key
              </ActionButton>
            </Stack>
          )}

          <CollapsibleSectionComponent title="Advanced" isExpandedByDefault={false}>
            <Stack className="panelGroupSpacing">
              {userContext.apiType === "Mongo" && (
                <Stack>
                  <Stack horizontal>
                    <span className="mandatoryStar">*&nbsp;</span>
                    <Text className="panelTextBold" variant="small">
                      Indexing
                    </Text>
                    <TooltipHost
                      directionalHint={DirectionalHint.bottomLeftEdge}
                      content="By default, only the field _id is indexed. Creating a wildcard index on all fields will quickly optimize
              query performance and is recommended during development."
                    >
                      <Icon iconName="InfoSolid" className="panelInfoIcon" />
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
                  <Stack horizontal verticalAlign="start">
                    <Checkbox
                      checked={this.state.useHashV1}
                      styles={{
                        checkbox: { width: 12, height: 12 },
                        label: { padding: 0, margin: "4px 4px 0 0" },
                      }}
                      onChange={(ev: React.FormEvent<HTMLElement>, isChecked: boolean) =>
                        this.setState({ useHashV1: isChecked })
                      }
                    />
                    <Text variant="small" style={{ lineHeight: "20px" }}>
                      My application uses an older Cosmos .NET or Java SDK version (.NET V1 or Java V2)
                    </Text>
                  </Stack>

                  <Text variant="small">
                    To ensure compatibility with older SDKs, the created container will use a legacy partitioning scheme
                    that supports partition key values of size up to 100 bytes.{" "}
                    <Link target="_blank" href="https://aka.ms/cosmosdb/pkv2">
                      Learn more
                    </Link>
                  </Text>
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
                      content="Enable analytical store capability to perform near real-time analytics on your operational data, without impacting the performance of transactional workloads. Learn more"
                    >
                      <Icon iconName="InfoSolid" className="panelInfoIcon" />
                    </TooltipHost>
                  </Stack>

                  <Stack horizontal verticalAlign="center">
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
                  </Stack>

                  {!this.isSynapseLinkEnabled() && (
                    <Stack className="panelGroupSpacing">
                      <Text variant="small">
                        Azure Synapse Link is required for creating an analytical store container. Enable Synapse Link
                        for this Cosmos DB account.{" "}
                        <Link href="https://aka.ms/cosmosdb-synapselink" target="_blank">
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
            </Stack>
          </CollapsibleSectionComponent>
        </div>

        <PanelFooterComponent buttonLabel="OK" />

        {this.state.isExecuting && <PanelLoadingScreen />}
      </form>
    );
  }

  private getDatabaseOptions(): IDropdownOption[] {
    return this.props.explorer?.databases()?.map((database) => ({
      key: database.id(),
      text: database.id(),
    }));
  }

  private getCollectionName(): string {
    switch (userContext.apiType) {
      case "SQL":
        return "Container";
      case "Mongo":
        return "Collection";
      case "Cassandra":
      case "Tables":
        return "Table";
      case "Gremlin":
        return "Graph";
      default:
        throw new Error(`Unsupported default experience type: ${userContext.apiType}`);
    }
  }

  private getPartitionKeyName(): string {
    return userContext.apiType === "Mongo" ? "Shard key" : "Partition key";
  }

  private getPartitionKeyPlaceHolder(): string {
    switch (userContext.apiType) {
      case "Mongo":
        return "e.g., address.zipCode";
      case "Gremlin":
        return "e.g., /address";
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

    const selectedDatabase = this.props.explorer
      .databases()
      ?.find((database) => database.id() === this.state.selectedDatabaseId);
    return !!selectedDatabase?.offer();
  }

  private isFreeTierAccount(): boolean {
    return userContext.databaseAccount?.properties?.enableFreeTier;
  }

  private isServerlessAccount(): boolean {
    return userContext.databaseAccount.properties?.capabilities?.some(
      (capability) => capability.name === Constants.CapabilityNames.EnableServerless
    );
  }

  private getSharedThroughputDefault(): boolean {
    return userContext.subscriptionType !== SubscriptionType.EA && !this.isServerlessAccount();
  }

  private getFreeTierIndexingText(): string {
    return this.state.enableIndexing
      ? "All properties in your documents will be indexed by default for flexible and efficient queries."
      : "Indexing will be turned off. Recommended if you don't need to run queries or only have key value operations.";
  }

  private shouldShowCollectionThroughputInput(): boolean {
    if (this.isServerlessAccount()) {
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

    if (this.isServerlessAccount()) {
      return false;
    }

    switch (userContext.apiType) {
      case "SQL":
      case "Mongo":
        return true;
      case "Cassandra":
        return this.props.explorer.hasStorageAnalyticsAfecFeature();
      default:
        return false;
    }
  }

  private isSynapseLinkEnabled(): boolean {
    const { properties } = userContext.databaseAccount;

    if (!properties) {
      return false;
    }

    if (properties.enableAnalyticalStorage) {
      return true;
    }

    return properties.capabilities.some(
      (capability) => capability.name === Constants.CapabilityNames.EnableStorageAnalytics
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

  private async submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!this.validateInputs()) {
      return;
    }

    const collectionId: string = this.state.collectionId.trim();
    let databaseId = this.state.createNewDatabase ? this.state.newDatabaseId.trim() : this.state.selectedDatabaseId;
    let partitionKeyString = this.state.partitionKey.trim();

    if (userContext.apiType === "Tables") {
      // Table require fixed Database: TablesDB, and fixed Partition Key: /'$pk'
      databaseId = CollectionCreation.TablesAPIDefaultDatabase;
      partitionKeyString = "/'$pk'";
    }

    const uniqueKeyPolicy: DataModels.UniqueKeyPolicy = this.parseUniqueKeys();
    const partitionKeyVersion = this.state.useHashV1 ? undefined : 2;
    const partitionKey: DataModels.PartitionKey = partitionKeyString
      ? {
          paths: [partitionKeyString],
          kind: Constants.BackendDefaults.partitionKeyKind,
          version: partitionKeyVersion,
        }
      : undefined;

    const indexingPolicy: DataModels.IndexingPolicy = this.state.enableIndexing
      ? IndexingPolicies.AllPropertiesIndexed
      : IndexingPolicies.SharedDatabaseDefault;

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
    };
    const startKey: number = TelemetryProcessor.traceStart(Action.CreateCollection, telemetryData);

    const databaseLevelThroughput: boolean = this.state.createNewDatabase
      ? this.state.isSharedThroughputChecked
      : this.isSelectedDatabaseSharedThroughput() && !this.state.enableDedicatedThroughput;

    let offerThroughput: number;
    let autoPilotMaxThroughput: number;
    if (this.state.createNewDatabase) {
      if (this.isNewDatabaseAutoscale) {
        autoPilotMaxThroughput = this.newDatabaseThroughput;
      } else {
        offerThroughput = this.newDatabaseThroughput;
      }
    } else if (!databaseLevelThroughput) {
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
      this.setState({ isExecuting: false });
      this.props.explorer.refreshAllDatabases();
      TelemetryProcessor.traceSuccess(Action.CreateCollection, telemetryData, startKey);
      this.props.closePanel();
    } catch (error) {
      const errorMessage: string = getErrorMessage(error);
      this.setState({ isExecuting: false, errorMessage, showErrorDetails: true });
      const failureTelemetryData = { ...telemetryData, error: errorMessage, errorStack: getErrorStack(error) };
      TelemetryProcessor.traceFailure(Action.CreateCollection, failureTelemetryData, startKey);
    }
  }
}
