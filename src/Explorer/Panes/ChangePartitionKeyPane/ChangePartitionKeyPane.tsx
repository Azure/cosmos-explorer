import {
  DefaultButton,
  DirectionalHint,
  Dropdown,
  IDropdownOption,
  Icon,
  IconButton,
  Link,
  MessageBar,
  Stack,
  Text,
  TooltipHost,
} from "@fluentui/react";
import * as Constants from "Common/Constants";
import { handleError } from "Common/ErrorHandlingUtils";
import { createCollection } from "Common/dataAccess/createCollection";
import { DataTransferParams, initiateDataTransfer } from "Common/dataAccess/dataTransfers";
import * as DataModels from "Contracts/DataModels";
import * as ViewModels from "Contracts/ViewModels";
import {
  getPartitionKeyName,
  getPartitionKeyPlaceHolder,
  getPartitionKeySubtext,
  getPartitionKeyTooltipText,
} from "Explorer/Controls/Settings/SettingsUtils";
import Explorer from "Explorer/Explorer";
import { RightPaneForm } from "Explorer/Panes/RightPaneForm/RightPaneForm";
import { useDatabases } from "Explorer/useDatabases";
import { userContext } from "UserContext";
import { getCollectionName } from "Utils/APITypeUtils";
import { ValidCosmosDbIdDescription, ValidCosmosDbIdInputPattern } from "Utils/ValidationUtils";
import { useSidePanel } from "hooks/useSidePanel";
import * as React from "react";

export interface ChangePartitionKeyPaneProps {
  sourceDatabase: ViewModels.Database;
  sourceCollection: ViewModels.Collection;
  explorer: Explorer;
  onClose: () => Promise<void>;
}

export const ChangePartitionKeyPane: React.FC<ChangePartitionKeyPaneProps> = ({
  sourceDatabase,
  sourceCollection,
  explorer,
  onClose,
}) => {
  const [targetCollectionId, setTargetCollectionId] = React.useState<string>();
  const [createNewContainer, setCreateNewContainer] = React.useState<boolean>(true);
  const [formError, setFormError] = React.useState<string>();
  const [isExecuting, setIsExecuting] = React.useState<boolean>(false);
  const [subPartitionKeys, setSubPartitionKeys] = React.useState<string[]>([]);
  const [partitionKey, setPartitionKey] = React.useState<string>();

  const getCollectionOptions = (): IDropdownOption[] => {
    return sourceDatabase
      .collections()
      .filter((collection) => collection.id !== sourceCollection.id)
      .map((collection) => ({
        key: collection.id(),
        text: collection.id(),
      }));
  };

  const submit = async () => {
    if (!validateInputs()) {
      return;
    }
    setIsExecuting(true);
    try {
      createNewContainer && (await createContainer());
      await createDataTransferJob();
      await onClose();
    } catch (error) {
      handleError(error, "ChangePartitionKey", "Failed to start data transfer job");
    }
    setIsExecuting(false);
    useSidePanel.getState().closeSidePanel();
  };

  const validateInputs = (): boolean => {
    if (!createNewContainer && !targetCollectionId) {
      setFormError("Choose an existing container");
      return false;
    }
    return true;
  };

  const createDataTransferJob = async () => {
    const jobName = `Portal_${targetCollectionId}_${Math.floor(Date.now() / 1000)}`;
    const dataTransferParams: DataTransferParams = {
      jobName,
      apiType: userContext.apiType,
      subscriptionId: userContext.subscriptionId,
      resourceGroupName: userContext.resourceGroup,
      accountName: userContext.databaseAccount.name,
      sourceDatabaseName: sourceDatabase.id(),
      sourceCollectionName: sourceCollection.id(),
      targetDatabaseName: sourceDatabase.id(),
      targetCollectionName: targetCollectionId,
    };
    await initiateDataTransfer(dataTransferParams);
  };

  const createContainer = async () => {
    const partitionKeyString = partitionKey.trim();
    const partitionKeyData: DataModels.PartitionKey = partitionKeyString
      ? {
          paths: [partitionKeyString, ...(subPartitionKeys.length > 0 ? subPartitionKeys : [])],
          kind: subPartitionKeys.length > 0 ? "MultiHash" : "Hash",
          version: 2,
        }
      : undefined;

    const createCollectionParams: DataModels.CreateCollectionParams = {
      createNewDatabase: false,
      collectionId: targetCollectionId,
      databaseId: sourceDatabase.id(),
      databaseLevelThroughput: isSelectedDatabaseSharedThroughput(),
      offerThroughput: sourceCollection.offer()?.manualThroughput,
      autoPilotMaxThroughput: sourceCollection.offer()?.autoscaleMaxThroughput,
      partitionKey: partitionKeyData,
    };
    await createCollection(createCollectionParams);
    await explorer.refreshAllDatabases();
  };

  const isSelectedDatabaseSharedThroughput = (): boolean => {
    const selectedDatabase = useDatabases
      .getState()
      .databases?.find((database) => database.id() === sourceDatabase.id());
    return !!selectedDatabase?.offer();
  };

  return (
    <RightPaneForm formError={formError} isExecuting={isExecuting} onSubmit={submit} submitButtonText="OK">
      <Stack tokens={{ childrenGap: 10 }} className="panelMainContent">
        <Text variant="small" style={{ color: "var(--colorNeutralForeground1)" }}>
          When changing a container’s partition key, you will need to create a destination container with the correct
          partition key. You may also select an existing destination container.&nbsp;
          <Link
            href="https://learn.microsoft.com/en-us/azure/cosmos-db/container-copy#container-copy-within-an-azure-cosmos-db-account"
            target="_blank"
            underline
          >
            Learn more
          </Link>
        </Text>
        <Stack>
          <Stack horizontal>
            <span className="mandatoryStar">*&nbsp;</span>
            <Text className="panelTextBold" variant="small">
              Database id
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
                aria-label={`A database is analogous to a namespace. It is the unit of management for a set of ${getCollectionName(
                  true,
                ).toLocaleLowerCase()}.`}
              />
            </TooltipHost>
          </Stack>
          <Dropdown
            styles={{ title: { height: 27, lineHeight: 27 }, dropdownItem: { fontSize: 12 } }}
            style={{ width: 300, fontSize: 12 }}
            options={[]}
            placeholder={sourceDatabase.id()}
            responsiveMode={999}
            disabled={true}
          />
        </Stack>
        <Stack className="panelGroupSpacing" horizontal verticalAlign="center">
          <div role="radiogroup">
            <input
              className="panelRadioBtn"
              checked={createNewContainer}
              aria-label="Create new container"
              aria-checked={createNewContainer}
              name="containerType"
              type="radio"
              role="radio"
              id="containerCreateNew"
              tabIndex={0}
              onChange={() => setCreateNewContainer(true)}
            />
            <span className="panelRadioBtnLabel">New container</span>

            <input
              className="panelRadioBtn"
              checked={!createNewContainer}
              aria-label="Use existing container"
              aria-checked={!createNewContainer}
              name="containerType"
              type="radio"
              role="radio"
              tabIndex={0}
              onChange={() => setCreateNewContainer(false)}
            />
            <span className="panelRadioBtnLabel">Existing container</span>
          </div>
        </Stack>
        {createNewContainer ? (
          <Stack data-test="create-new-container-form">
            <MessageBar>All configurations except for unique keys will be copied from the source container</MessageBar>
            <Stack className="panelGroupSpacing">
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
                data-test="new-container-id-input"
                name="collectionId"
                id="collectionId"
                type="text"
                aria-required
                required
                autoComplete="off"
                pattern={ValidCosmosDbIdInputPattern.source}
                title={ValidCosmosDbIdDescription}
                placeholder={`e.g., ${getCollectionName()}1`}
                size={40}
                className="panelTextField"
                aria-label={`${getCollectionName()} id, Example ${getCollectionName()}1`}
                value={targetCollectionId}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setTargetCollectionId(event.target.value)}
              />
            </Stack>
            <Stack tokens={{ childrenGap: 10 }}>
              <Stack horizontal>
                <span className="mandatoryStar">*&nbsp;</span>
                <Text className="panelTextBold" variant="small">
                  {getPartitionKeyName(userContext.apiType)}
                </Text>
                <TooltipHost
                  directionalHint={DirectionalHint.bottomLeftEdge}
                  content={getPartitionKeyTooltipText(userContext.apiType)}
                >
                  <Icon
                    iconName="Info"
                    className="panelInfoIcon"
                    tabIndex={0}
                    aria-label={getPartitionKeyTooltipText(userContext.apiType)}
                  />
                </TooltipHost>
              </Stack>

              <Text variant="small">
                {getPartitionKeySubtext(userContext.features.partitionKeyDefault, userContext.apiType)}
              </Text>

              <input
                type="text"
                data-test="new-container-partition-key-input"
                id="addCollection-partitionKeyValue"
                aria-required
                required
                size={40}
                className="panelTextField"
                placeholder={getPartitionKeyPlaceHolder(userContext.apiType)}
                aria-label={getPartitionKeyName(userContext.apiType)}
                pattern={".*"}
                title={""}
                value={partitionKey}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  if (!partitionKey && !event.target.value.startsWith("/")) {
                    setPartitionKey("/" + event.target.value);
                  } else {
                    setPartitionKey(event.target.value);
                  }
                }}
              />
              {subPartitionKeys.map((subPartitionKey: string, index: number) => {
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
                      data-test={`new-container-sub-partition-key-input-${index}`}
                      aria-required
                      required
                      size={40}
                      tabIndex={index > 0 ? 1 : 0}
                      className="panelTextField"
                      autoComplete="off"
                      placeholder={getPartitionKeyPlaceHolder(userContext.apiType, index)}
                      aria-label={getPartitionKeyName(userContext.apiType)}
                      pattern={".*"}
                      title={""}
                      value={subPartitionKey}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        const keys = [...subPartitionKeys];
                        if (!keys[index] && !event.target.value.startsWith("/")) {
                          keys[index] = "/" + event.target.value.trim();
                          setSubPartitionKeys(keys);
                        } else {
                          keys[index] = event.target.value.trim();
                          setSubPartitionKeys(keys);
                        }
                      }}
                    />
                    <IconButton
                      data-test={`remove-sub-partition-key-button-${index}`}
                      ariaLabel="Remove hierarchical partition key"
                      iconProps={{ iconName: "Delete" }}
                      style={{ height: 27 }}
                      onClick={() => {
                        const keys = subPartitionKeys.filter((uniqueKey, j) => index !== j);
                        setSubPartitionKeys(keys);
                      }}
                    />
                  </Stack>
                );
              })}
              <Stack className="panelGroupSpacing">
                <DefaultButton
                  data-test="add-sub-partition-key-button"
                  styles={{ root: { padding: 0, width: 200, height: 30 }, label: { fontSize: 12 } }}
                  disabled={subPartitionKeys.length >= Constants.BackendDefaults.maxNumMultiHashPartition}
                  onClick={() => setSubPartitionKeys([...subPartitionKeys, ""])}
                >
                  Add hierarchical partition key
                </DefaultButton>
                {subPartitionKeys.length > 0 && (
                  <Text
                    data-test="hierarchical-partitioning-info-text"
                    variant="small"
                    style={{ color: "var(--colorNeutralForeground1)" }}
                  >
                    <Icon iconName="InfoSolid" className="removeIcon" tabIndex={0} /> This feature allows you to
                    partition your data with up to three levels of keys for better data distribution. Requires .NET V3,
                    Java V4 SDK, or preview JavaScript V3 SDK.{" "}
                    <Link href="https://aka.ms/cosmos-hierarchical-partitioning" target="_blank">
                      Learn more
                    </Link>
                  </Text>
                )}
              </Stack>
            </Stack>
          </Stack>
        ) : (
          <Stack data-test="use-existing-container-form">
            <Stack horizontal>
              <span className="mandatoryStar">*&nbsp;</span>
              <Text className="panelTextBold" variant="small">
                {`${getCollectionName()}`}
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

            <Dropdown
              styles={{ title: { height: 27, lineHeight: 27 }, dropdownItem: { fontSize: 12 } }}
              style={{ width: 300, fontSize: 12 }}
              placeholder="Choose an existing container"
              options={getCollectionOptions()}
              onChange={(event: React.FormEvent<HTMLDivElement>, collection: IDropdownOption) => {
                setTargetCollectionId(collection.key as string);
                setFormError("");
              }}
              defaultSelectedKey={targetCollectionId}
              responsiveMode={999}
              ariaLabel="Existing Containers"
            />
          </Stack>
        )}
      </Stack>
    </RightPaneForm>
  );
};
