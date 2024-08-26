import {
  Checkbox,
  ChoiceGroup,
  DefaultButton,
  IChoiceGroupOption,
  ISpinButtonStyles,
  IToggleStyles,
  Icon,
  MessageBar,
  MessageBarType,
  Position,
  SpinButton,
  Toggle,
  TooltipHost,
} from "@fluentui/react";
import { Accordion, AccordionHeader, AccordionItem, AccordionPanel, makeStyles } from "@fluentui/react-components";
import { AuthType } from "AuthType";
import * as Constants from "Common/Constants";
import { SplitterDirection } from "Common/Splitter";
import { InfoTooltip } from "Common/Tooltip/InfoTooltip";
import { Platform, configContext } from "ConfigContext";
import { useDialog } from "Explorer/Controls/Dialog";
import { useDatabases } from "Explorer/useDatabases";
import { deleteAllStates } from "Shared/AppStatePersistenceUtility";
import {
  DefaultRUThreshold,
  LocalStorageUtility,
  StorageKey,
  getDefaultQueryResultsView,
  getRUThreshold,
  ruThresholdEnabled as isRUThresholdEnabled,
} from "Shared/StorageUtility";
import * as StringUtility from "Shared/StringUtility";
import { updateUserContext, userContext } from "UserContext";
import { logConsoleError, logConsoleInfo } from "Utils/NotificationConsoleUtils";
import * as PriorityBasedExecutionUtils from "Utils/PriorityBasedExecutionUtils";
import { getReadOnlyKeys, listKeys } from "Utils/arm/generatedClients/cosmos/databaseAccounts";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import { useSidePanel } from "hooks/useSidePanel";
import React, { FunctionComponent, useState } from "react";
import create, { UseStore } from "zustand";
import Explorer from "../../Explorer";
import { RightPaneForm, RightPaneFormProps } from "../RightPaneForm/RightPaneForm";

export interface DataPlaneRbacState {
  dataPlaneRbacEnabled: boolean;
  aadTokenUpdated: boolean;

  getState?: () => DataPlaneRbacState;

  setDataPlaneRbacEnabled: (dataPlaneRbacEnabled: boolean) => void;
  setAadDataPlaneUpdated: (aadTokenUpdated: boolean) => void;
}

type DataPlaneRbacStore = UseStore<Partial<DataPlaneRbacState>>;

const useStyles = makeStyles({
  bulletList: {
    listStyleType: "disc",
    paddingLeft: "20px",
  },
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  firstItem: {
    flex: "1",
  },
  header: {
    marginRight: "5px",
  },
  headerIcon: {
    paddingTop: "4px",
    cursor: "pointer",
  },
  settingsSectionPart: {
    paddingLeft: "15px",
  },
});

export const useDataPlaneRbac: DataPlaneRbacStore = create(() => ({
  dataPlaneRbacEnabled: false,
}));

export const SettingsPane: FunctionComponent<{ explorer: Explorer }> = ({
  explorer,
}: {
  explorer: Explorer;
}): JSX.Element => {
  const closeSidePanel = useSidePanel((state) => state.closeSidePanel);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [refreshExplorer, setRefreshExplorer] = useState<boolean>(false);
  const [pageOption, setPageOption] = useState<string>(
    LocalStorageUtility.getEntryNumber(StorageKey.ActualItemPerPage) === Constants.Queries.unlimitedItemsPerPage
      ? Constants.Queries.UnlimitedPageOption
      : Constants.Queries.CustomPageOption,
  );

  const [enableDataPlaneRBACOption, setEnableDataPlaneRBACOption] = useState<string>(
    LocalStorageUtility.hasItem(StorageKey.DataPlaneRbacEnabled)
      ? LocalStorageUtility.getEntryString(StorageKey.DataPlaneRbacEnabled)
      : Constants.RBACOptions.setAutomaticRBACOption,
  );
  const [showDataPlaneRBACWarning, setShowDataPlaneRBACWarning] = useState<boolean>(false);

  const [ruThresholdEnabled, setRUThresholdEnabled] = useState<boolean>(isRUThresholdEnabled());
  const [ruThreshold, setRUThreshold] = useState<number>(getRUThreshold());
  const [queryTimeoutEnabled, setQueryTimeoutEnabled] = useState<boolean>(
    LocalStorageUtility.getEntryBoolean(StorageKey.QueryTimeoutEnabled),
  );
  const [queryTimeout, setQueryTimeout] = useState<number>(LocalStorageUtility.getEntryNumber(StorageKey.QueryTimeout));
  const [defaultQueryResultsView, setDefaultQueryResultsView] = useState<SplitterDirection>(
    getDefaultQueryResultsView(),
  );
  const [automaticallyCancelQueryAfterTimeout, setAutomaticallyCancelQueryAfterTimeout] = useState<boolean>(
    LocalStorageUtility.getEntryBoolean(StorageKey.AutomaticallyCancelQueryAfterTimeout),
  );
  const [customItemPerPage, setCustomItemPerPage] = useState<number>(
    LocalStorageUtility.getEntryNumber(StorageKey.CustomItemPerPage) || 0,
  );
  const [containerPaginationEnabled, setContainerPaginationEnabled] = useState<boolean>(
    LocalStorageUtility.hasItem(StorageKey.ContainerPaginationEnabled)
      ? LocalStorageUtility.getEntryString(StorageKey.ContainerPaginationEnabled) === "true"
      : false,
  );
  const [crossPartitionQueryEnabled, setCrossPartitionQueryEnabled] = useState<boolean>(
    LocalStorageUtility.hasItem(StorageKey.IsCrossPartitionQueryEnabled)
      ? LocalStorageUtility.getEntryString(StorageKey.IsCrossPartitionQueryEnabled) === "true"
      : false,
  );
  const [graphAutoVizDisabled, setGraphAutoVizDisabled] = useState<string>(
    LocalStorageUtility.hasItem(StorageKey.IsGraphAutoVizDisabled)
      ? LocalStorageUtility.getEntryString(StorageKey.IsGraphAutoVizDisabled)
      : "false",
  );
  const [retryAttempts, setRetryAttempts] = useState<number>(
    LocalStorageUtility.hasItem(StorageKey.RetryAttempts)
      ? LocalStorageUtility.getEntryNumber(StorageKey.RetryAttempts)
      : Constants.Queries.DefaultRetryAttempts,
  );
  const [retryInterval, setRetryInterval] = useState<number>(
    LocalStorageUtility.hasItem(StorageKey.RetryInterval)
      ? LocalStorageUtility.getEntryNumber(StorageKey.RetryInterval)
      : Constants.Queries.DefaultRetryIntervalInMs,
  );
  const [MaxWaitTimeInSeconds, setMaxWaitTimeInSeconds] = useState<number>(
    LocalStorageUtility.hasItem(StorageKey.MaxWaitTimeInSeconds)
      ? LocalStorageUtility.getEntryNumber(StorageKey.MaxWaitTimeInSeconds)
      : Constants.Queries.DefaultMaxWaitTimeInSeconds,
  );
  const [maxDegreeOfParallelism, setMaxDegreeOfParallelism] = useState<number>(
    LocalStorageUtility.hasItem(StorageKey.MaxDegreeOfParellism)
      ? LocalStorageUtility.getEntryNumber(StorageKey.MaxDegreeOfParellism)
      : Constants.Queries.DefaultMaxDegreeOfParallelism,
  );
  const [priorityLevel, setPriorityLevel] = useState<string>(
    LocalStorageUtility.hasItem(StorageKey.PriorityLevel)
      ? LocalStorageUtility.getEntryString(StorageKey.PriorityLevel)
      : Constants.PriorityLevel.Default,
  );
  const [copilotSampleDBEnabled, setCopilotSampleDBEnabled] = useState<boolean>(
    LocalStorageUtility.getEntryString(StorageKey.CopilotSampleDBEnabled) === "true",
  );

  const styles = useStyles();

  const explorerVersion = configContext.gitSha;
  const shouldShowQueryPageOptions = userContext.apiType === "SQL";
  const shouldShowGraphAutoVizOption = userContext.apiType === "Gremlin";
  const shouldShowCrossPartitionOption = userContext.apiType !== "Gremlin";
  const shouldShowParallelismOption = userContext.apiType !== "Gremlin";
  const shouldShowPriorityLevelOption = PriorityBasedExecutionUtils.isFeatureEnabled();
  const shouldShowCopilotSampleDBOption =
    userContext.apiType === "SQL" &&
    useQueryCopilot.getState().copilotEnabled &&
    useDatabases.getState().sampleDataResourceTokenCollection;
  const handlerOnSubmit = async () => {
    setIsExecuting(true);

    LocalStorageUtility.setEntryNumber(
      StorageKey.ActualItemPerPage,
      isCustomPageOptionSelected() ? customItemPerPage : Constants.Queries.unlimitedItemsPerPage,
    );

    LocalStorageUtility.setEntryNumber(StorageKey.CustomItemPerPage, customItemPerPage);

    if (configContext.platform !== Platform.Fabric) {
      LocalStorageUtility.setEntryString(StorageKey.DataPlaneRbacEnabled, enableDataPlaneRBACOption);
      if (
        enableDataPlaneRBACOption === Constants.RBACOptions.setTrueRBACOption ||
        (enableDataPlaneRBACOption === Constants.RBACOptions.setAutomaticRBACOption &&
          userContext.databaseAccount.properties.disableLocalAuth)
      ) {
        updateUserContext({
          dataPlaneRbacEnabled: true,
          hasDataPlaneRbacSettingChanged: true,
        });
        useDataPlaneRbac.setState({ dataPlaneRbacEnabled: true });
      } else {
        updateUserContext({
          dataPlaneRbacEnabled: false,
          hasDataPlaneRbacSettingChanged: true,
        });
        const { databaseAccount: account, subscriptionId, resourceGroup } = userContext;
        if (!userContext.features.enableAadDataPlane && !userContext.masterKey) {
          let keys;
          try {
            keys = await listKeys(subscriptionId, resourceGroup, account.name);
            updateUserContext({
              masterKey: keys.primaryMasterKey,
            });
          } catch (error) {
            // if listKeys fail because of permissions issue, then make call to get ReadOnlyKeys
            if (error.code === "AuthorizationFailed") {
              keys = await getReadOnlyKeys(subscriptionId, resourceGroup, account.name);
              updateUserContext({
                masterKey: keys.primaryReadonlyMasterKey,
              });
            } else {
              logConsoleError(`Error occurred fetching keys for the account." ${error.message}`);
              throw error;
            }
          }
          useDataPlaneRbac.setState({ dataPlaneRbacEnabled: false });
        }
      }
    }

    LocalStorageUtility.setEntryBoolean(StorageKey.RUThresholdEnabled, ruThresholdEnabled);
    LocalStorageUtility.setEntryBoolean(StorageKey.QueryTimeoutEnabled, queryTimeoutEnabled);
    LocalStorageUtility.setEntryNumber(StorageKey.RetryAttempts, retryAttempts);
    LocalStorageUtility.setEntryNumber(StorageKey.RetryInterval, retryInterval);
    LocalStorageUtility.setEntryNumber(StorageKey.MaxWaitTimeInSeconds, MaxWaitTimeInSeconds);
    LocalStorageUtility.setEntryString(StorageKey.ContainerPaginationEnabled, containerPaginationEnabled.toString());
    LocalStorageUtility.setEntryString(StorageKey.IsCrossPartitionQueryEnabled, crossPartitionQueryEnabled.toString());
    LocalStorageUtility.setEntryNumber(StorageKey.MaxDegreeOfParellism, maxDegreeOfParallelism);
    LocalStorageUtility.setEntryString(StorageKey.PriorityLevel, priorityLevel.toString());
    LocalStorageUtility.setEntryString(StorageKey.CopilotSampleDBEnabled, copilotSampleDBEnabled.toString());
    LocalStorageUtility.setEntryString(StorageKey.DefaultQueryResultsView, defaultQueryResultsView);

    if (shouldShowGraphAutoVizOption) {
      LocalStorageUtility.setEntryBoolean(
        StorageKey.IsGraphAutoVizDisabled,
        StringUtility.toBoolean(graphAutoVizDisabled),
      );
    }

    if (ruThresholdEnabled) {
      LocalStorageUtility.setEntryNumber(StorageKey.RUThreshold, ruThreshold);
    }

    if (queryTimeoutEnabled) {
      LocalStorageUtility.setEntryNumber(StorageKey.QueryTimeout, queryTimeout);
      LocalStorageUtility.setEntryBoolean(
        StorageKey.AutomaticallyCancelQueryAfterTimeout,
        automaticallyCancelQueryAfterTimeout,
      );
    }

    setIsExecuting(false);
    logConsoleInfo(
      `Updated items per page setting to ${LocalStorageUtility.getEntryNumber(StorageKey.ActualItemPerPage)}`,
    );
    logConsoleInfo(`${crossPartitionQueryEnabled ? "Enabled" : "Disabled"} cross-partition query feed option`);
    logConsoleInfo(
      `Updated the max degree of parallelism query feed option to ${LocalStorageUtility.getEntryNumber(
        StorageKey.MaxDegreeOfParellism,
      )}`,
    );
    logConsoleInfo(`Updated priority level setting to ${LocalStorageUtility.getEntryString(StorageKey.PriorityLevel)}`);

    if (shouldShowGraphAutoVizOption) {
      logConsoleInfo(
        `Graph result will be displayed as ${
          LocalStorageUtility.getEntryBoolean(StorageKey.IsGraphAutoVizDisabled) ? "JSON" : "Graph"
        }`,
      );
    }

    logConsoleInfo(
      `Updated query setting to ${LocalStorageUtility.getEntryString(StorageKey.SetPartitionKeyUndefined)}`,
    );
    refreshExplorer && (await explorer.refreshExplorer());
    closeSidePanel();
  };

  const isCustomPageOptionSelected = () => {
    return pageOption === Constants.Queries.CustomPageOption;
  };

  const handleOnGremlinChange = (ev: React.FormEvent<HTMLInputElement>, option: IChoiceGroupOption): void => {
    setGraphAutoVizDisabled(option.key);
  };

  const genericPaneProps: RightPaneFormProps = {
    formError: "",
    isExecuting,
    submitButtonText: "Apply",
    onSubmit: () => handlerOnSubmit(),
  };
  const pageOptionList: IChoiceGroupOption[] = [
    { key: Constants.Queries.CustomPageOption, text: "Custom" },
    { key: Constants.Queries.UnlimitedPageOption, text: "Unlimited" },
  ];

  const graphAutoOptionList: IChoiceGroupOption[] = [
    { key: "false", text: "Graph" },
    { key: "true", text: "JSON" },
  ];

  const priorityLevelOptionList: IChoiceGroupOption[] = [
    { key: Constants.PriorityLevel.Low, text: "Low" },
    { key: Constants.PriorityLevel.High, text: "High" },
  ];

  const dataPlaneRBACOptionsList: IChoiceGroupOption[] = [
    { key: Constants.RBACOptions.setAutomaticRBACOption, text: "Automatic" },
    { key: Constants.RBACOptions.setTrueRBACOption, text: "True" },
    { key: Constants.RBACOptions.setFalseRBACOption, text: "False" },
  ];

  const defaultQueryResultsViewOptionList: IChoiceGroupOption[] = [
    { key: SplitterDirection.Vertical, text: "Vertical" },
    { key: SplitterDirection.Horizontal, text: "Horizontal" },
  ];

  const handleOnPriorityLevelOptionChange = (
    ev: React.FormEvent<HTMLInputElement>,
    option: IChoiceGroupOption,
  ): void => {
    setPriorityLevel(option.key);
  };

  const handleOnPageOptionChange = (ev: React.FormEvent<HTMLInputElement>, option: IChoiceGroupOption): void => {
    setPageOption(option.key);
  };

  const handleOnDataPlaneRBACOptionChange = (
    ev: React.FormEvent<HTMLInputElement>,
    option: IChoiceGroupOption,
  ): void => {
    setEnableDataPlaneRBACOption(option.key);

    const shouldShowWarning =
      (option.key === Constants.RBACOptions.setTrueRBACOption ||
        (option.key === Constants.RBACOptions.setAutomaticRBACOption &&
          userContext.databaseAccount.properties.disableLocalAuth === true)) &&
      !useDataPlaneRbac.getState().aadTokenUpdated;
    setShowDataPlaneRBACWarning(shouldShowWarning);
  };

  const handleOnRUThresholdToggleChange = (ev: React.MouseEvent<HTMLElement>, checked?: boolean): void => {
    setRUThresholdEnabled(checked);
  };

  const handleOnRUThresholdSpinButtonChange = (ev: React.MouseEvent<HTMLElement>, newValue?: string): void => {
    const ruThreshold = Number(newValue);
    if (!isNaN(ruThreshold)) {
      setRUThreshold(ruThreshold);
    }
  };

  const handleOnQueryTimeoutToggleChange = (ev: React.MouseEvent<HTMLElement>, checked?: boolean): void => {
    setQueryTimeoutEnabled(checked);
  };

  const handleOnAutomaticallyCancelQueryToggleChange = (ev: React.MouseEvent<HTMLElement>, checked?: boolean): void => {
    setAutomaticallyCancelQueryAfterTimeout(checked);
  };

  const handleOnQueryTimeoutSpinButtonChange = (ev: React.MouseEvent<HTMLElement>, newValue?: string): void => {
    const queryTimeout = Number(newValue);
    if (!isNaN(queryTimeout)) {
      setQueryTimeout(queryTimeout);
    }
  };

  const handleOnDefaultQueryResultsViewChange = (
    ev: React.MouseEvent<HTMLElement>,
    option: IChoiceGroupOption,
  ): void => {
    setDefaultQueryResultsView(option.key as SplitterDirection);
  };

  const handleOnQueryRetryAttemptsSpinButtonChange = (ev: React.MouseEvent<HTMLElement>, newValue?: string): void => {
    const retryAttempts = Number(newValue);
    if (!isNaN(retryAttempts)) {
      setRetryAttempts(retryAttempts);
    }
  };

  const handleOnRetryIntervalSpinButtonChange = (ev: React.MouseEvent<HTMLElement>, newValue?: string): void => {
    const retryInterval = Number(newValue);
    if (!isNaN(retryInterval)) {
      setRetryInterval(retryInterval);
    }
  };

  const handleOnMaxWaitTimeSpinButtonChange = (ev: React.MouseEvent<HTMLElement>, newValue?: string): void => {
    const MaxWaitTimeInSeconds = Number(newValue);
    if (!isNaN(MaxWaitTimeInSeconds)) {
      setMaxWaitTimeInSeconds(MaxWaitTimeInSeconds);
    }
  };

  const handleSampleDatabaseChange = async (ev: React.MouseEvent<HTMLElement>, checked?: boolean): Promise<void> => {
    setCopilotSampleDBEnabled(checked);
    useQueryCopilot.getState().setCopilotSampleDBEnabled(checked);
    setRefreshExplorer(false);
  };

  const choiceButtonStyles = {
    root: {
      clear: "both",
    },
    flexContainer: [
      {
        selectors: {
          ".ms-ChoiceFieldGroup root-133": {
            clear: "both",
          },
          ".ms-ChoiceField-wrapper label": {
            fontSize: 12,
            paddingTop: 0,
          },
          ".ms-ChoiceField": {
            marginTop: 0,
          },
        },
      },
    ],
  };

  const toggleStyles: IToggleStyles = {
    label: {
      fontSize: 12,
      fontWeight: 400,
      display: "block",
    },
    root: {},
    container: {},
    pill: {},
    thumb: {},
    text: {},
  };

  const spinButtonStyles: ISpinButtonStyles = {
    label: {
      fontSize: 12,
      fontWeight: 400,
    },
    root: {
      paddingBottom: 10,
    },
    labelWrapper: {},
    icon: {},
    spinButtonWrapper: {},
    input: {},
    arrowButtonsContainer: {},
  };

  return (
    <RightPaneForm {...genericPaneProps}>
      <div className={`paneMainContent ${styles.container}`}>
        <Accordion className={styles.firstItem}>
          {shouldShowQueryPageOptions && (
            <AccordionItem value="1">
              <AccordionHeader>
                <div className={styles.header}>Page Options</div>
                <InfoTooltip className={styles.headerIcon}>
                  Choose Custom to specify a fixed amount of query results to show, or choose Unlimited to show as many
                  query results per page.
                </InfoTooltip>
              </AccordionHeader>
              <AccordionPanel>
                <div className={styles.settingsSectionPart}>
                  <ChoiceGroup
                    ariaLabelledBy="pageOptions"
                    selectedKey={pageOption}
                    options={pageOptionList}
                    styles={choiceButtonStyles}
                    onChange={handleOnPageOptionChange}
                  />
                </div>
                <div className={`tabs ${styles.settingsSectionPart}`}>
                  {isCustomPageOptionSelected() && (
                    <div className="tabcontent">
                      <div className="settingsSectionLabel">
                        Query results per page
                        <InfoTooltip className={styles.headerIcon}>
                          Enter the number of query results that should be shown per page.
                        </InfoTooltip>
                      </div>

                      <SpinButton
                        ariaLabel="Custom query items per page"
                        value={"" + customItemPerPage}
                        onIncrement={(newValue) => {
                          setCustomItemPerPage(parseInt(newValue) + 1 || customItemPerPage);
                        }}
                        onDecrement={(newValue) => setCustomItemPerPage(parseInt(newValue) - 1 || customItemPerPage)}
                        onValidate={(newValue) => setCustomItemPerPage(parseInt(newValue) || customItemPerPage)}
                        min={1}
                        step={1}
                        className="textfontclr"
                        incrementButtonAriaLabel="Increase value by 1"
                        decrementButtonAriaLabel="Decrease value by 1"
                      />
                    </div>
                  )}
                </div>
              </AccordionPanel>
            </AccordionItem>
          )}
          {userContext.apiType === "SQL" &&
            userContext.authType === AuthType.AAD &&
            configContext.platform !== Platform.Fabric && (
              <AccordionItem value="2">
                <AccordionHeader>
                  <div className={styles.header}>Enable Entra ID RBAC</div>
                  <TooltipHost
                    content={
                      <>
                        Choose Automatic to enable Entra ID RBAC automatically. True/False to force enable/disable Entra
                        ID RBAC.
                        <a
                          href="https://learn.microsoft.com/en-us/azure/cosmos-db/how-to-setup-rbac#use-data-explorer"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {" "}
                          Learn more{" "}
                        </a>
                      </>
                    }
                  >
                    <Icon
                      iconName="Info"
                      ariaLabel="Info tooltip"
                      className={`panelInfoIcon ${styles.headerIcon}`}
                      tabIndex={0}
                    />
                  </TooltipHost>
                </AccordionHeader>
                <AccordionPanel>
                  <div className={styles.settingsSectionPart}>
                    {showDataPlaneRBACWarning && configContext.platform === Platform.Portal && (
                      <MessageBar
                        messageBarType={MessageBarType.warning}
                        isMultiline={true}
                        onDismiss={() => setShowDataPlaneRBACWarning(false)}
                        dismissButtonAriaLabel="Close"
                      >
                        Please click on &quot;Login for Entra ID RBAC&quot; button prior to performing Entra ID RBAC
                        operations
                      </MessageBar>
                    )}
                    <ChoiceGroup
                      ariaLabelledBy="enableDataPlaneRBACOptions"
                      options={dataPlaneRBACOptionsList}
                      styles={choiceButtonStyles}
                      selectedKey={enableDataPlaneRBACOption}
                      onChange={handleOnDataPlaneRBACOptionChange}
                    />
                  </div>
                </AccordionPanel>
              </AccordionItem>
            )}

          {userContext.apiType === "SQL" && (
            <>
              <AccordionItem value="3">
                <AccordionHeader>
                  <div className={styles.header}>Query Timeout</div>
                  <InfoTooltip className={styles.headerIcon}>
                    When a query reaches a specified time limit, a popup with an option to cancel the query will show
                    unless automatic cancellation has been enabled
                  </InfoTooltip>
                </AccordionHeader>
                <AccordionPanel>
                  <div className={styles.settingsSectionPart}>
                    <Toggle
                      styles={toggleStyles}
                      label="Enable query timeout"
                      onChange={handleOnQueryTimeoutToggleChange}
                      defaultChecked={queryTimeoutEnabled}
                    />
                  </div>
                  {queryTimeoutEnabled && (
                    <div className={styles.settingsSectionPart}>
                      <SpinButton
                        label="Query timeout (ms)"
                        labelPosition={Position.top}
                        defaultValue={(queryTimeout || 5000).toString()}
                        min={100}
                        step={1000}
                        onChange={handleOnQueryTimeoutSpinButtonChange}
                        incrementButtonAriaLabel="Increase value by 1000"
                        decrementButtonAriaLabel="Decrease value by 1000"
                        styles={spinButtonStyles}
                      />
                      <Toggle
                        label="Automatically cancel query after timeout"
                        styles={toggleStyles}
                        onChange={handleOnAutomaticallyCancelQueryToggleChange}
                        defaultChecked={automaticallyCancelQueryAfterTimeout}
                      />
                    </div>
                  )}
                </AccordionPanel>
              </AccordionItem>

              <AccordionItem value="4">
                <AccordionHeader>
                  <div className={styles.header}>RU Threshold</div>
                  <InfoTooltip className={styles.headerIcon}>
                    If a query exceeds a configured RU threshold, the query will be aborted.
                  </InfoTooltip>
                </AccordionHeader>
                <AccordionPanel>
                  <div className={styles.settingsSectionPart}>
                    <Toggle
                      styles={toggleStyles}
                      label="Enable RU threshold"
                      onChange={handleOnRUThresholdToggleChange}
                      defaultChecked={ruThresholdEnabled}
                    />
                  </div>
                  {ruThresholdEnabled && (
                    <div className={styles.settingsSectionPart}>
                      <SpinButton
                        label="RU Threshold (RU)"
                        labelPosition={Position.top}
                        defaultValue={(ruThreshold || DefaultRUThreshold).toString()}
                        min={1}
                        step={1000}
                        onChange={handleOnRUThresholdSpinButtonChange}
                        incrementButtonAriaLabel="Increase value by 1000"
                        decrementButtonAriaLabel="Decrease value by 1000"
                        styles={spinButtonStyles}
                      />
                    </div>
                  )}
                </AccordionPanel>
              </AccordionItem>

              <AccordionItem value="5">
                <AccordionHeader>
                  <div className={styles.header}>Default Query Results View</div>
                  <InfoTooltip className={styles.headerIcon}>
                    Select the default view to use when displaying query results.
                  </InfoTooltip>
                </AccordionHeader>
                <AccordionPanel>
                  <div className={styles.settingsSectionPart}>
                    <ChoiceGroup
                      ariaLabelledBy="defaultQueryResultsView"
                      selectedKey={defaultQueryResultsView}
                      options={defaultQueryResultsViewOptionList}
                      styles={choiceButtonStyles}
                      onChange={handleOnDefaultQueryResultsViewChange}
                    />
                  </div>
                </AccordionPanel>
              </AccordionItem>
            </>
          )}

          <AccordionItem value="6">
            <AccordionHeader>
              <div className={styles.header}> Retry Settings</div>
              <InfoTooltip className={styles.headerIcon}>
                Retry policy associated with throttled requests during CosmosDB queries.
              </InfoTooltip>
            </AccordionHeader>
            <AccordionPanel>
              <div className={styles.settingsSectionPart}>
                <div>
                  <span className={styles.header}>Max retry attempts</span>
                  <InfoTooltip className={styles.headerIcon}>
                    Max number of retries to be performed for a request. Default value 9.
                  </InfoTooltip>
                </div>
                <SpinButton
                  labelPosition={Position.top}
                  min={1}
                  step={1}
                  value={"" + retryAttempts}
                  onChange={handleOnQueryRetryAttemptsSpinButtonChange}
                  incrementButtonAriaLabel="Increase value by 1"
                  decrementButtonAriaLabel="Decrease value by 1"
                  onIncrement={(newValue) => setRetryAttempts(parseInt(newValue) + 1 || retryAttempts)}
                  onDecrement={(newValue) => setRetryAttempts(parseInt(newValue) - 1 || retryAttempts)}
                  onValidate={(newValue) => setRetryAttempts(parseInt(newValue) || retryAttempts)}
                  styles={spinButtonStyles}
                />
                <div>
                  <span className={styles.header}>Fixed retry interval (ms)</span>
                  <InfoTooltip className={styles.headerIcon}>
                    Fixed retry interval in milliseconds to wait between each retry ignoring the retryAfter returned as
                    part of the response. Default value is 0 milliseconds.
                  </InfoTooltip>
                </div>
                <SpinButton
                  labelPosition={Position.top}
                  min={1000}
                  step={1000}
                  value={"" + retryInterval}
                  onChange={handleOnRetryIntervalSpinButtonChange}
                  incrementButtonAriaLabel="Increase value by 1000"
                  decrementButtonAriaLabel="Decrease value by 1000"
                  onIncrement={(newValue) => setRetryInterval(parseInt(newValue) + 1000 || retryInterval)}
                  onDecrement={(newValue) => setRetryInterval(parseInt(newValue) - 1000 || retryInterval)}
                  onValidate={(newValue) => setRetryInterval(parseInt(newValue) || retryInterval)}
                  styles={spinButtonStyles}
                />
                <div>
                  <span className={styles.header}>Max wait time (s)</span>
                  <InfoTooltip className={styles.headerIcon}>
                    Max wait time in seconds to wait for a request while the retries are happening. Default value 30
                    seconds.
                  </InfoTooltip>
                </div>
                <SpinButton
                  labelPosition={Position.top}
                  min={1}
                  step={1}
                  value={"" + MaxWaitTimeInSeconds}
                  onChange={handleOnMaxWaitTimeSpinButtonChange}
                  incrementButtonAriaLabel="Increase value by 1"
                  decrementButtonAriaLabel="Decrease value by 1"
                  onIncrement={(newValue) => setMaxWaitTimeInSeconds(parseInt(newValue) + 1 || MaxWaitTimeInSeconds)}
                  onDecrement={(newValue) => setMaxWaitTimeInSeconds(parseInt(newValue) - 1 || MaxWaitTimeInSeconds)}
                  onValidate={(newValue) => setMaxWaitTimeInSeconds(parseInt(newValue) || MaxWaitTimeInSeconds)}
                  styles={spinButtonStyles}
                />
              </div>
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem value="7">
            <AccordionHeader>
              <div className={styles.header}>Enable container pagination</div>
              <InfoTooltip className={styles.headerIcon}>
                Load 50 containers at a time. Currently, containers are not pulled in alphanumeric order.
              </InfoTooltip>
            </AccordionHeader>
            <AccordionPanel>
              <div className={styles.settingsSectionPart}>
                <Checkbox
                  styles={{
                    label: { padding: 0 },
                  }}
                  className="padding"
                  ariaLabel="Enable container pagination"
                  checked={containerPaginationEnabled}
                  onChange={() => setContainerPaginationEnabled(!containerPaginationEnabled)}
                />
              </div>
            </AccordionPanel>
          </AccordionItem>

          {shouldShowCrossPartitionOption && (
            <AccordionItem value="8">
              <AccordionHeader>
                <div className={styles.header}>Enable cross-partition query</div>
                <InfoTooltip className={styles.headerIcon}>
                  Send more than one request while executing a query. More than one request is necessary if the query is
                  not scoped to single partition key value.
                </InfoTooltip>
              </AccordionHeader>
              <AccordionPanel>
                <div className={styles.settingsSectionPart}>
                  <Checkbox
                    styles={{
                      label: { padding: 0 },
                    }}
                    className="padding"
                    ariaLabel="Enable cross partition query"
                    checked={crossPartitionQueryEnabled}
                    onChange={() => setCrossPartitionQueryEnabled(!crossPartitionQueryEnabled)}
                  />
                </div>
              </AccordionPanel>
            </AccordionItem>
          )}

          {shouldShowParallelismOption && (
            <AccordionItem value="9">
              <AccordionHeader>
                <div className={styles.header}>Max degree of parallelism</div>
                <InfoTooltip className={styles.headerIcon}>
                  Gets or sets the number of concurrent operations run client side during parallel query execution. A
                  positive property value limits the number of concurrent operations to the set value. If it is set to
                  less than 0, the system automatically decides the number of concurrent operations to run.
                </InfoTooltip>
              </AccordionHeader>
              <AccordionPanel>
                <div className={styles.settingsSectionPart}>
                  <SpinButton
                    min={-1}
                    step={1}
                    className="textfontclr"
                    role="textbox"
                    id="max-degree"
                    value={"" + maxDegreeOfParallelism}
                    onIncrement={(newValue) =>
                      setMaxDegreeOfParallelism(parseInt(newValue) + 1 || maxDegreeOfParallelism)
                    }
                    onDecrement={(newValue) =>
                      setMaxDegreeOfParallelism(parseInt(newValue) - 1 || maxDegreeOfParallelism)
                    }
                    onValidate={(newValue) => setMaxDegreeOfParallelism(parseInt(newValue) || maxDegreeOfParallelism)}
                    ariaLabel="Max degree of parallelism"
                  />
                </div>
              </AccordionPanel>
            </AccordionItem>
          )}

          {shouldShowPriorityLevelOption && (
            <AccordionItem value="10">
              <AccordionHeader>
                <div className={styles.header}>Priority Level</div>
                <InfoTooltip className={styles.headerIcon}>
                  Sets the priority level for data-plane requests from Data Explorer when using Priority-Based
                  Execution. If &quot;None&quot; is selected, Data Explorer will not specify priority level, and the
                  server-side default priority level will be used.
                </InfoTooltip>
              </AccordionHeader>
              <AccordionPanel>
                <div className={styles.settingsSectionPart}>
                  <ChoiceGroup
                    ariaLabelledBy="priorityLevel"
                    selectedKey={priorityLevel}
                    options={priorityLevelOptionList}
                    styles={choiceButtonStyles}
                    onChange={handleOnPriorityLevelOptionChange}
                  />
                </div>
              </AccordionPanel>
            </AccordionItem>
          )}

          {shouldShowGraphAutoVizOption && (
            <AccordionItem value="11">
              <AccordionHeader>
                <div className={styles.header}>Display Gremlin query results as:&nbsp;</div>
                <InfoTooltip className={styles.headerIcon}>
                  Select Graph to automatically visualize the query results as a Graph or JSON to display the results as
                  JSON.
                </InfoTooltip>
              </AccordionHeader>
              <AccordionPanel>
                <div className={styles.settingsSectionPart}>
                  <ChoiceGroup
                    selectedKey={graphAutoVizDisabled}
                    options={graphAutoOptionList}
                    onChange={handleOnGremlinChange}
                    aria-label="Graph Auto-visualization"
                  />
                </div>
              </AccordionPanel>
            </AccordionItem>
          )}

          {shouldShowCopilotSampleDBOption && (
            <AccordionItem value="12">
              <AccordionHeader>
                <div className={styles.header}>Enable sample database</div>
                <InfoTooltip className={styles.headerIcon}>
                  This is a sample database and collection with synthetic product data you can use to explore using
                  NoSQL queries and Query Advisor. This will appear as another database in the Data Explorer UI, and is
                  created by, and maintained by Microsoft at no cost to you.
                </InfoTooltip>
              </AccordionHeader>
              <AccordionPanel>
                <div className={styles.settingsSectionPart}>
                  <Checkbox
                    styles={{
                      label: { padding: 0 },
                    }}
                    className="padding"
                    ariaLabel="Enable sample db for Query Advisor"
                    checked={copilotSampleDBEnabled}
                    onChange={handleSampleDatabaseChange}
                  />
                </div>
              </AccordionPanel>
            </AccordionItem>
          )}
        </Accordion>

        <div className="settingsSection">
          <div className="settingsSectionPart">
            <DefaultButton
              onClick={() => {
                useDialog.getState().showOkCancelModalDialog(
                  "Clear History",
                  undefined,
                  "Are you sure you want to proceed?",
                  () => deleteAllStates(),
                  "Cancel",
                  undefined,
                  <>
                    <span>
                      This action will clear the all customizations for this account in this browser, including:
                    </span>
                    <ul className={styles.bulletList}>
                      <li>Reset your customized tab layout, including the splitter positions</li>
                      <li>Erase your table column preferences, including any custom columns</li>
                      <li>Clear your filter history</li>
                    </ul>
                  </>,
                );
              }}
            >
              Clear History
            </DefaultButton>
          </div>
        </div>
        <div className="settingsSection">
          <div className="settingsSectionPart">
            <div className="settingsSectionLabel">Explorer Version</div>
            <div>{explorerVersion}</div>
          </div>
        </div>
      </div>
    </RightPaneForm>
  );
};
