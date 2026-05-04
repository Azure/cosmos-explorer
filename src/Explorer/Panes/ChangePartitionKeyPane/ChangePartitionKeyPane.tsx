import {
  ChoiceGroup,
  DefaultButton,
  DirectionalHint,
  Dropdown,
  IChoiceGroupOption,
  IDropdownOption,
  Icon,
  IconButton,
  Link,
  MessageBar,
  MessageBarType,
  PrimaryButton,
  Stack,
  Text,
  TooltipHost,
} from "@fluentui/react";
import { CapabilityNames } from "Common/Constants";
import * as Constants from "Common/Constants";
import { handleError } from "Common/ErrorHandlingUtils";
import LoadingOverlay from "Common/LoadingOverlay";
import { logError } from "Common/Logger";
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
import { BackupPolicyType, CopyJobMigrationType } from "Explorer/ContainerCopy/Enums/CopyJobEnums";
import Explorer from "Explorer/Explorer";
import { RightPaneForm } from "Explorer/Panes/RightPaneForm/RightPaneForm";
import { useDatabases } from "Explorer/useDatabases";
import { Keys, t } from "Localization";
import { userContext } from "UserContext";
import { getCollectionName } from "Utils/APITypeUtils";
import { ValidCosmosDbIdDescription, ValidCosmosDbIdInputPattern } from "Utils/ValidationUtils";
import { fetchDatabaseAccount } from "Utils/arm/databaseAccountUtils";
import { update as updateDatabaseAccount } from "Utils/arm/generatedClients/cosmos/databaseAccounts";
import { useSidePanel } from "hooks/useSidePanel";
import * as React from "react";

export interface ChangePartitionKeyPaneProps {
  sourceDatabase: ViewModels.Database;
  sourceCollection: ViewModels.Collection;
  explorer: Explorer;
  onClose: () => Promise<void>;
}

const migrationTypeOptions: IChoiceGroupOption[] = [
  {
    key: CopyJobMigrationType.Offline,
    text: t(Keys.containerCopy.migrationType.offline.title),
    styles: { root: { width: "33%" } },
  },
  {
    key: CopyJobMigrationType.Online,
    text: t(Keys.containerCopy.migrationType.online.title),
    styles: { root: { width: "33%" } },
  },
];

const choiceGroupStyles = {
  flexContainer: { display: "flex" as const },
  root: {
    selectors: {
      ".ms-ChoiceField": {
        color: "var(--colorNeutralForeground1)",
      },
      ".ms-ChoiceField-field:hover .ms-ChoiceFieldLabel": {
        color: "var(--colorNeutralForeground1)",
      },
    },
  },
};

const checkPitrEnabled = (account: DataModels.DatabaseAccount): boolean => {
  return account?.properties?.backupPolicy?.type === BackupPolicyType.Continuous;
};

const checkOnlineCopyEnabled = (account: DataModels.DatabaseAccount): boolean => {
  const capabilities = account?.properties?.capabilities ?? [];
  return capabilities.some((cap) => cap.name === CapabilityNames.EnableOnlineCopyFeature);
};

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
  const [migrationType, setMigrationType] = React.useState<CopyJobMigrationType>(CopyJobMigrationType.Offline);

  // Pane-local account state for tracking prerequisite enablement
  const [localAccount, setLocalAccount] = React.useState<DataModels.DatabaseAccount>(userContext.databaseAccount);
  const [isEnablingPrerequisite, setIsEnablingPrerequisite] = React.useState<boolean>(false);
  const [prerequisiteLoaderMessage, setPrerequisiteLoaderMessage] = React.useState<string>("");

  const pitrEnabled = checkPitrEnabled(localAccount);
  const onlineCopyFeatureEnabled = checkOnlineCopyEnabled(localAccount);
  const onlinePrerequisitesMet = pitrEnabled && onlineCopyFeatureEnabled;
  const isOnlineMode = migrationType === CopyJobMigrationType.Online;

  const accountName = localAccount?.name ?? "";
  const subscriptionId = userContext.subscriptionId;
  const resourceGroup = userContext.resourceGroup;

  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const refreshAccount = async (): Promise<DataModels.DatabaseAccount | null> => {
    try {
      const account = await fetchDatabaseAccount(subscriptionId, resourceGroup, accountName);
      if (account) {
        setLocalAccount(account);
      }
      return account;
    } catch (error) {
      logError(
        error.message || "Error fetching account after enabling prerequisite.",
        "ChangePartitionKey/refreshAccount",
      );
      return null;
    }
  };

  const clearPollingTimers = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const startPollingForAccountUpdate = () => {
    intervalRef.current = setInterval(() => {
      refreshAccount();
    }, 30 * 1000);

    timeoutRef.current = setTimeout(
      () => {
        clearPollingTimers();
        setIsEnablingPrerequisite(false);
      },
      10 * 60 * 1000,
    );
  };

  const handleEnablePitr = () => {
    const featureUrl = `https://portal.azure.com/#@/resource/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/backupRestore`;
    setIsEnablingPrerequisite(true);
    setPrerequisiteLoaderMessage(t(Keys.containerCopy.popoverOverlaySpinnerLabel));
    window.open(featureUrl, "_blank");
    startPollingForAccountUpdate();
  };

  const handleEnableOnlineCopy = async () => {
    setIsEnablingPrerequisite(true);
    try {
      setPrerequisiteLoaderMessage(
        t(Keys.containerCopy.onlineCopyEnabled.validateAllVersionsAndDeletesChangeFeedSpinnerLabel),
      );
      const currentAccount = await fetchDatabaseAccount(subscriptionId, resourceGroup, accountName);
      if (!currentAccount?.properties?.enableAllVersionsAndDeletesChangeFeed) {
        setPrerequisiteLoaderMessage(
          t(Keys.containerCopy.onlineCopyEnabled.enablingAllVersionsAndDeletesChangeFeedSpinnerLabel),
        );
        await updateDatabaseAccount(subscriptionId, resourceGroup, accountName, {
          properties: {
            enableAllVersionsAndDeletesChangeFeed: true,
          },
        });
      }
      const capabilities = currentAccount?.properties?.capabilities ?? [];
      setPrerequisiteLoaderMessage(
        t(Keys.containerCopy.onlineCopyEnabled.enablingOnlineCopySpinnerLabel, { accountName }),
      );
      await updateDatabaseAccount(subscriptionId, resourceGroup, accountName, {
        properties: {
          capabilities: [...capabilities, { name: CapabilityNames.EnableOnlineCopyFeature }],
        },
      });
      startPollingForAccountUpdate();
    } catch (error) {
      logError(error.message || "Failed to enable online copy feature.", "ChangePartitionKey/handleEnableOnlineCopy");
      setFormError("Failed to enable online copy feature. Please try again.");
      setIsEnablingPrerequisite(false);
    }
  };

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
      handleError(error, "ChangePartitionKey", t(Keys.panes.changePartitionKey.failedToStartError));
    }
    setIsExecuting(false);
    useSidePanel.getState().closeSidePanel();
  };

  const validateInputs = (): boolean => {
    if (!createNewContainer && !targetCollectionId) {
      setFormError("Choose an existing container");
      return false;
    }
    if (isOnlineMode && !onlinePrerequisitesMet) {
      setFormError("Online migration prerequisites must be enabled before proceeding.");
      return false;
    }
    return true;
  };

  const getModeForApi = (): "Offline" | "Online" => {
    return migrationType === CopyJobMigrationType.Online ? "Online" : "Offline";
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
      mode: getModeForApi(),
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

  const isSubmitDisabled = isOnlineMode && !onlinePrerequisitesMet;

  return (
    <RightPaneForm
      formError={formError}
      isExecuting={isExecuting}
      onSubmit={submit}
      submitButtonText={t(Keys.common.ok)}
      isSubmitButtonDisabled={isSubmitDisabled}
    >
      <Stack tokens={{ childrenGap: 10 }} className="panelMainContent">
        <Text variant="small" style={{ color: "var(--colorNeutralForeground1)" }}>
          {t(Keys.panes.changePartitionKey.description)}&nbsp;
          <Link
            href="https://learn.microsoft.com/en-us/azure/cosmos-db/container-copy#container-copy-within-an-azure-cosmos-db-account"
            target="_blank"
            underline
          >
            {t(Keys.common.learnMore)}
          </Link>
        </Text>

        {/* Migration Type */}
        <Stack data-test="migration-type-section">
          <Text className="panelTextBold" variant="small" style={{ marginBottom: 4 }}>
            Migration type
          </Text>
          <ChoiceGroup
            data-test="migration-type-choice"
            selectedKey={migrationType}
            options={migrationTypeOptions}
            onChange={(_ev, option) => {
              if (option) {
                setMigrationType(option.key as CopyJobMigrationType);
              }
            }}
            ariaLabelledBy="migrationTypeChoiceGroup"
            styles={choiceGroupStyles}
          />
          {migrationType && (
            <Text
              variant="small"
              style={{ color: "var(--colorNeutralForeground1)", marginTop: 4 }}
              data-test={`migration-type-description-${migrationType}`}
            >
              {migrationType === CopyJobMigrationType.Offline
                ? t(Keys.containerCopy.migrationType.offline.description)
                : t(Keys.containerCopy.migrationType.online.description)}
            </Text>
          )}
        </Stack>

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
                  content={t(Keys.panes.changePartitionKey.collectionIdTooltip, {
                    collectionName: getCollectionName().toLocaleLowerCase(),
                  })}
                >
                  <Icon
                    role="button"
                    iconName="Info"
                    className="panelInfoIcon"
                    tabIndex={0}
                    ariaLabel={t(Keys.panes.changePartitionKey.collectionIdTooltip, {
                      collectionName: getCollectionName().toLocaleLowerCase(),
                    })}
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
                placeholder={t(Keys.panes.changePartitionKey.collectionIdPlaceholder, {
                  collectionName: getCollectionName(),
                })}
                size={40}
                className="panelTextField"
                aria-label={t(Keys.panes.changePartitionKey.collectionIdAriaLabel, {
                  collectionName: getCollectionName(),
                })}
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
                  {t(Keys.panes.addCollection.addPartitionKey)}
                </DefaultButton>
                {subPartitionKeys.length > 0 && (
                  <Text
                    data-test="hierarchical-partitioning-info-text"
                    variant="small"
                    style={{ color: "var(--colorNeutralForeground1)" }}
                  >
                    <Icon iconName="InfoSolid" className="removeIcon" tabIndex={0} />{" "}
                    {t(Keys.panes.addCollection.hierarchicalPartitionKeyInfo)}{" "}
                    <Link href="https://aka.ms/cosmos-hierarchical-partitioning" target="_blank">
                      {t(Keys.common.learnMore)}
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
                content={t(Keys.panes.changePartitionKey.collectionIdTooltip, {
                  collectionName: getCollectionName().toLocaleLowerCase(),
                })}
              >
                <Icon
                  role="button"
                  iconName="Info"
                  className="panelInfoIcon"
                  tabIndex={0}
                  ariaLabel={t(Keys.panes.changePartitionKey.collectionIdTooltip, {
                    collectionName: getCollectionName().toLocaleLowerCase(),
                  })}
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
              ariaLabel={t(Keys.panes.changePartitionKey.existingContainers)}
            />
          </Stack>
        )}

        {/* Online prerequisites section */}
        {isOnlineMode && (
          <Stack data-test="online-prerequisites-section" tokens={{ childrenGap: 10 }}>
            <LoadingOverlay isLoading={isEnablingPrerequisite} label={prerequisiteLoaderMessage} />
            <Text className="panelTextBold" variant="small">
              {t(Keys.containerCopy.assignPermissions.onlineConfiguration.title)}
            </Text>
            <Text variant="small" style={{ color: "var(--colorNeutralForeground1)" }}>
              {t(Keys.containerCopy.assignPermissions.onlineConfiguration.description, { accountName })}
            </Text>

            {/* Point In Time Restore */}
            <Stack tokens={{ childrenGap: 5 }}>
              <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 5 }}>
                <Icon
                  iconName={pitrEnabled ? "SkypeCircleCheck" : "StatusCircleRing"}
                  styles={{
                    root: { color: pitrEnabled ? "green" : "var(--colorNeutralForeground1)", fontSize: 16 },
                  }}
                />
                <Text variant="small" style={{ fontWeight: 600, color: "var(--colorNeutralForeground1)" }}>
                  {t(Keys.containerCopy.pointInTimeRestore.title)}
                </Text>
              </Stack>
              {!pitrEnabled && (
                <Stack tokens={{ childrenGap: 10, padding: "0 0 0 20px" }}>
                  <Text variant="small" style={{ color: "var(--colorNeutralForeground1)" }}>
                    {t(Keys.containerCopy.pointInTimeRestore.description, { accessName: accountName })}
                  </Text>
                  <PrimaryButton
                    data-test="enable-pitr-button"
                    text={t(Keys.containerCopy.pointInTimeRestore.buttonText)}
                    disabled={isEnablingPrerequisite}
                    onClick={handleEnablePitr}
                    styles={{ root: { width: "fit-content" } }}
                  />
                </Stack>
              )}
            </Stack>

            {/* Online Copy Enabled */}
            <Stack tokens={{ childrenGap: 5 }}>
              <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 5 }}>
                <Icon
                  iconName={onlineCopyFeatureEnabled ? "SkypeCircleCheck" : "StatusCircleRing"}
                  styles={{
                    root: {
                      color: onlineCopyFeatureEnabled ? "green" : "var(--colorNeutralForeground1)",
                      fontSize: 16,
                    },
                  }}
                />
                <Text variant="small" style={{ fontWeight: 600, color: "var(--colorNeutralForeground1)" }}>
                  {t(Keys.containerCopy.onlineCopyEnabled.title)}
                </Text>
              </Stack>
              {!onlineCopyFeatureEnabled && (
                <Stack tokens={{ childrenGap: 10, padding: "0 0 0 20px" }}>
                  <Text variant="small" style={{ color: "var(--colorNeutralForeground1)" }}>
                    {t(Keys.containerCopy.onlineCopyEnabled.description, { accountName })}&ensp;
                    <Link href={t(Keys.containerCopy.onlineCopyEnabled.href)} target="_blank" rel="noopener noreferrer">
                      {t(Keys.containerCopy.onlineCopyEnabled.hrefText)}
                    </Link>
                  </Text>
                  <PrimaryButton
                    data-test="enable-online-copy-button"
                    text={t(Keys.containerCopy.onlineCopyEnabled.buttonText)}
                    disabled={isEnablingPrerequisite || !pitrEnabled}
                    onClick={handleEnableOnlineCopy}
                    styles={{ root: { width: "fit-content" } }}
                  />
                </Stack>
              )}
            </Stack>

            {!onlinePrerequisitesMet && (
              <MessageBar messageBarType={MessageBarType.warning} data-test="online-prerequisites-warning">
                Online migration prerequisites must be enabled before proceeding.
              </MessageBar>
            )}
          </Stack>
        )}
      </Stack>
    </RightPaneForm>
  );
};
