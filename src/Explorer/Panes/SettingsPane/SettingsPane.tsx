import {
  AuthError as msalAuthError,
  BrowserAuthErrorMessage as msalBrowserAuthErrorMessage,
} from "@azure/msal-browser";
import {
  Checkbox,
  ChoiceGroup,
  DefaultButton,
  Dropdown,
  IChoiceGroupOption,
  IDropdownOption,
  ISpinButtonStyles,
  IToggleStyles,
  Position,
  SpinButton,
  Stack,
  Toggle,
} from "@fluentui/react";
import { Accordion, AccordionHeader, AccordionItem, AccordionPanel, makeStyles } from "@fluentui/react-components";
import { AuthType } from "AuthType";
import * as Constants from "Common/Constants";
import { SplitterDirection } from "Common/Splitter";
import { InfoTooltip } from "Common/Tooltip/InfoTooltip";
import { Platform, configContext } from "ConfigContext";
import { useDialog } from "Explorer/Controls/Dialog";
import { useDatabases } from "Explorer/useDatabases";
import { isFabric, isFabricNative } from "Platform/Fabric/FabricUtil";
import {
  AppStateComponentNames,
  deleteAllStates,
  deleteState,
  hasState,
  loadState,
  saveState,
} from "Shared/AppStatePersistenceUtility";
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
import { isDataplaneRbacSupported } from "Utils/APITypeUtils";
import { acquireMsalTokenForAccount } from "Utils/AuthorizationUtils";
import { logConsoleError, logConsoleInfo } from "Utils/NotificationConsoleUtils";
import * as PriorityBasedExecutionUtils from "Utils/PriorityBasedExecutionUtils";
import { getReadOnlyKeys, listKeys } from "Utils/arm/generatedClients/cosmos/databaseAccounts";
import { useClientWriteEnabled } from "hooks/useClientWriteEnabled";
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
  settingsSectionContainer: {
    paddingLeft: "15px",
  },
  settingsSectionDescription: {
    paddingBottom: "10px",
    fontSize: "12px",
  },
  subHeader: {
    marginRight: "5px",
    fontSize: "12px",
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
  const [selectedRegionalEndpoint, setSelectedRegionalEndpoint] = useState<string>(
    hasState({
      componentName: AppStateComponentNames.SelectedRegionalEndpoint,
      globalAccountName: userContext.databaseAccount?.name,
    })
      ? (loadState({
          componentName: AppStateComponentNames.SelectedRegionalEndpoint,
          globalAccountName: userContext.databaseAccount?.name,
        }) as string)
      : undefined,
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
  const [queryControlEnabled, setQueryControlEnabled] = useState<boolean>(
    LocalStorageUtility.hasItem(StorageKey.QueryControlEnabled)
      ? LocalStorageUtility.getEntryString(StorageKey.QueryControlEnabled) === "true"
      : false,
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

  const [mongoGuidRepresentation, setMongoGuidRepresentation] = useState<Constants.MongoGuidRepresentation>(
    LocalStorageUtility.hasItem(StorageKey.MongoGuidRepresentation)
      ? (LocalStorageUtility.getEntryString(StorageKey.MongoGuidRepresentation) as Constants.MongoGuidRepresentation)
      : Constants.MongoGuidRepresentation.CSharpLegacy,
  );
  const [ignorePartitionKeyOnDocumentUpdate, setIgnorePartitionKeyOnDocumentUpdate] = useState<boolean>(
    LocalStorageUtility.getEntryBoolean(StorageKey.IgnorePartitionKeyOnDocumentUpdate),
  );

  const styles = useStyles();

  const explorerVersion = configContext.gitSha;
  const isEmulator = configContext.platform === Platform.Emulator;
  const shouldShowQueryPageOptions = userContext.apiType === "SQL";
  const showRetrySettings =
    (userContext.apiType === "SQL" || userContext.apiType === "Tables" || userContext.apiType === "Gremlin") &&
    !isEmulator;
  const shouldShowGraphAutoVizOption = userContext.apiType === "Gremlin" && !isEmulator;
  const shouldShowCrossPartitionOption = userContext.apiType !== "Gremlin" && !isEmulator;
  const shouldShowEnhancedQueryControl = userContext.apiType === "SQL";
  const shouldShowParallelismOption = userContext.apiType !== "Gremlin" && !isEmulator;
  const showEnableEntraIdRbac =
    isDataplaneRbacSupported(userContext.apiType) &&
    userContext.authType === AuthType.AAD &&
    configContext.platform !== Platform.Fabric &&
    !isEmulator;
  const shouldShowPriorityLevelOption = PriorityBasedExecutionUtils.isFeatureEnabled() && !isEmulator;

  const uniqueAccountRegions = new Set<string>();
  const regionOptions: IDropdownOption[] = [];
  regionOptions.push({
    key: userContext?.databaseAccount?.properties?.documentEndpoint,
    text: `Global (Default)`,
    data: {
      isGlobal: true,
      writeEnabled: true,
    },
  });
  userContext?.databaseAccount?.properties?.writeLocations?.forEach((loc) => {
    if (!uniqueAccountRegions.has(loc.locationName)) {
      uniqueAccountRegions.add(loc.locationName);
      regionOptions.push({
        key: loc.documentEndpoint,
        text: `${loc.locationName} (Read/Write)`,
        data: {
          isGlobal: false,
          writeEnabled: true,
        },
      });
    }
  });
  userContext?.databaseAccount?.properties?.readLocations?.forEach((loc) => {
    if (!uniqueAccountRegions.has(loc.locationName)) {
      uniqueAccountRegions.add(loc.locationName);
      regionOptions.push({
        key: loc.documentEndpoint,
        text: `${loc.locationName} (Read)`,
        data: {
          isGlobal: false,
          writeEnabled: false,
        },
      });
    }
  });

  const shouldShowCopilotSampleDBOption =
    userContext.apiType === "SQL" &&
    useQueryCopilot.getState().copilotEnabled &&
    useDatabases.getState().sampleDataResourceTokenCollection &&
    !isEmulator;

  const shouldShowMongoGuidRepresentationOption = userContext.apiType === "Mongo";

  const handlerOnSubmit = async () => {
    setIsExecuting(true);

    LocalStorageUtility.setEntryNumber(
      StorageKey.ActualItemPerPage,
      isCustomPageOptionSelected() ? customItemPerPage : Constants.Queries.unlimitedItemsPerPage,
    );

    LocalStorageUtility.setEntryNumber(StorageKey.CustomItemPerPage, customItemPerPage);

    if (
      enableDataPlaneRBACOption !== LocalStorageUtility.getEntryString(StorageKey.DataPlaneRbacEnabled) ||
      retryAttempts !== LocalStorageUtility.getEntryNumber(StorageKey.RetryAttempts) ||
      retryInterval !== LocalStorageUtility.getEntryNumber(StorageKey.RetryInterval) ||
      MaxWaitTimeInSeconds !== LocalStorageUtility.getEntryNumber(StorageKey.MaxWaitTimeInSeconds)
    ) {
      updateUserContext({
        refreshCosmosClient: true,
      });
    }

    if (configContext.platform !== Platform.Fabric) {
      LocalStorageUtility.setEntryString(StorageKey.DataPlaneRbacEnabled, enableDataPlaneRBACOption);
      if (
        enableDataPlaneRBACOption === Constants.RBACOptions.setTrueRBACOption ||
        (enableDataPlaneRBACOption === Constants.RBACOptions.setAutomaticRBACOption &&
          userContext.databaseAccount.properties.disableLocalAuth)
      ) {
        updateUserContext({
          dataPlaneRbacEnabled: true,
        });
        useDataPlaneRbac.setState({ dataPlaneRbacEnabled: true });
        try {
          const aadToken = await acquireMsalTokenForAccount(userContext.databaseAccount, true);
          updateUserContext({ aadToken: aadToken });
          useDataPlaneRbac.setState({ aadTokenUpdated: true });
        } catch (authError) {
          if (
            authError instanceof msalAuthError &&
            authError.errorCode === msalBrowserAuthErrorMessage.popUpWindowError.code
          ) {
            logConsoleError(
              `We were unable to establish authorization for this account, due to pop-ups being disabled in the browser.\nPlease enable pop-ups for this site and click on "Login for Entra ID" button`,
            );
          } else {
            logConsoleError(
              `"Failed to acquire authorization token automatically. Please click on "Login for Entra ID" button to enable Entra ID RBAC operations`,
            );
          }
        }
      } else {
        updateUserContext({
          dataPlaneRbacEnabled: false,
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

    const storedRegionalEndpoint = loadState({
      componentName: AppStateComponentNames.SelectedRegionalEndpoint,
      globalAccountName: userContext.databaseAccount?.name,
    }) as string;
    const selectedRegionIsGlobal =
      selectedRegionalEndpoint === userContext?.databaseAccount?.properties?.documentEndpoint;
    if (selectedRegionIsGlobal && storedRegionalEndpoint) {
      deleteState({
        componentName: AppStateComponentNames.SelectedRegionalEndpoint,
        globalAccountName: userContext.databaseAccount?.name,
      });
      updateUserContext({
        selectedRegionalEndpoint: undefined,
        writeEnabledInSelectedRegion: true,
        refreshCosmosClient: true,
      });
      useClientWriteEnabled.setState({ clientWriteEnabled: true });
    } else if (
      selectedRegionalEndpoint &&
      !selectedRegionIsGlobal &&
      selectedRegionalEndpoint !== storedRegionalEndpoint
    ) {
      saveState(
        {
          componentName: AppStateComponentNames.SelectedRegionalEndpoint,
          globalAccountName: userContext.databaseAccount?.name,
        },
        selectedRegionalEndpoint,
      );
      const validWriteEndpoint = userContext.databaseAccount?.properties?.writeLocations?.find(
        (loc) => loc.documentEndpoint === selectedRegionalEndpoint,
      );
      updateUserContext({
        selectedRegionalEndpoint: selectedRegionalEndpoint,
        writeEnabledInSelectedRegion: !!validWriteEndpoint,
        refreshCosmosClient: true,
      });
      useClientWriteEnabled.setState({ clientWriteEnabled: !!validWriteEndpoint });
    }

    LocalStorageUtility.setEntryBoolean(StorageKey.RUThresholdEnabled, ruThresholdEnabled);
    LocalStorageUtility.setEntryBoolean(StorageKey.QueryTimeoutEnabled, queryTimeoutEnabled);
    LocalStorageUtility.setEntryNumber(StorageKey.RetryAttempts, retryAttempts);
    LocalStorageUtility.setEntryNumber(StorageKey.RetryInterval, retryInterval);
    LocalStorageUtility.setEntryNumber(StorageKey.MaxWaitTimeInSeconds, MaxWaitTimeInSeconds);
    LocalStorageUtility.setEntryString(StorageKey.ContainerPaginationEnabled, containerPaginationEnabled.toString());
    LocalStorageUtility.setEntryString(StorageKey.IsCrossPartitionQueryEnabled, crossPartitionQueryEnabled.toString());
    LocalStorageUtility.setEntryString(StorageKey.QueryControlEnabled, queryControlEnabled.toString());
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

    if (shouldShowMongoGuidRepresentationOption) {
      LocalStorageUtility.setEntryString(StorageKey.MongoGuidRepresentation, mongoGuidRepresentation);
    }

    // Advanced settings
    LocalStorageUtility.setEntryBoolean(
      StorageKey.IgnorePartitionKeyOnDocumentUpdate,
      ignorePartitionKeyOnDocumentUpdate,
    );

    setIsExecuting(false);
    logConsoleInfo(
      `Updated items per page setting to ${LocalStorageUtility.getEntryNumber(StorageKey.ActualItemPerPage)}`,
    );
    logConsoleInfo(`${crossPartitionQueryEnabled ? "Enabled" : "Disabled"} cross-partition query feed option`);
    logConsoleInfo(`${queryControlEnabled ? "Enabled" : "Disabled"} query control option`);
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

    if (shouldShowMongoGuidRepresentationOption) {
      logConsoleInfo(
        `Updated Mongo Guid Representation to ${LocalStorageUtility.getEntryString(
          StorageKey.MongoGuidRepresentation,
        )}`,
      );
    }

    logConsoleInfo(
      `${ignorePartitionKeyOnDocumentUpdate ? "Enabled" : "Disabled"} ignoring partition key on document update`,
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

  const mongoGuidRepresentationDropdownOptions: IDropdownOption[] = [
    { key: Constants.MongoGuidRepresentation.CSharpLegacy, text: Constants.MongoGuidRepresentation.CSharpLegacy },
    { key: Constants.MongoGuidRepresentation.JavaLegacy, text: Constants.MongoGuidRepresentation.JavaLegacy },
    { key: Constants.MongoGuidRepresentation.PythonLegacy, text: Constants.MongoGuidRepresentation.PythonLegacy },
    { key: Constants.MongoGuidRepresentation.Standard, text: Constants.MongoGuidRepresentation.Standard },
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

  const handleOnSelectedRegionOptionChange = (ev: React.FormEvent<HTMLInputElement>, option: IDropdownOption): void => {
    setSelectedRegionalEndpoint(option.key as string);
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

  const handleOnMongoGuidRepresentationOptionChange = (
    ev: React.FormEvent<HTMLInputElement>,
    option: IDropdownOption,
  ): void => {
    setMongoGuidRepresentation(option.key as Constants.MongoGuidRepresentation);
  };

  const handleOnIgnorePartitionKeyOnDocumentUpdateChange = (
    ev: React.MouseEvent<HTMLElement>,
    checked?: boolean,
  ): void => {
    setIgnorePartitionKeyOnDocumentUpdate(!!checked);
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
        {!isFabricNative() && (
          <Accordion className={`customAccordion ${styles.firstItem}`} collapsible>
            {shouldShowQueryPageOptions && (
              <AccordionItem value="1">
                <AccordionHeader>
                  <div className={styles.header}>Page Options</div>
                </AccordionHeader>
                <AccordionPanel>
                  <div className={styles.settingsSectionContainer}>
                    <div className={styles.settingsSectionDescription}>
                      Choose Custom to specify a fixed amount of query results to show, or choose Unlimited to show as
                      many query results per page.
                    </div>
                    <ChoiceGroup
                      ariaLabelledBy="pageOptions"
                      selectedKey={pageOption}
                      options={pageOptionList}
                      styles={choiceButtonStyles}
                      onChange={handleOnPageOptionChange}
                    />
                  </div>
                  <div className={`tabs ${styles.settingsSectionContainer}`}>
                    {isCustomPageOptionSelected() && (
                      <div className="tabcontent">
                        <div className={styles.settingsSectionDescription}>
                          Query results per page{" "}
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
            {showEnableEntraIdRbac && (
              <AccordionItem value="2">
                <AccordionHeader>
                  <div className={styles.header}>Enable Entra ID RBAC</div>
                </AccordionHeader>
                <AccordionPanel>
                  <div className={styles.settingsSectionContainer}>
                    <div className={styles.settingsSectionDescription}>
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
                    </div>
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
            {userContext.apiType === "SQL" && userContext.authType === AuthType.AAD && !isFabric() && (
              <AccordionItem value="3">
                <AccordionHeader>
                  <div className={styles.header}>Region Selection</div>
                </AccordionHeader>
                <AccordionPanel>
                  <div className={styles.settingsSectionContainer}>
                    <div className={styles.settingsSectionDescription}>
                      Changes region the Cosmos Client uses to access account.
                    </div>
                    <div>
                      <span className={styles.subHeader}>Select Region</span>
                      <InfoTooltip className={styles.headerIcon}>
                        Changes the account endpoint used to perform client operations.
                      </InfoTooltip>
                    </div>
                    <Dropdown
                      placeholder={
                        selectedRegionalEndpoint
                          ? regionOptions.find((option) => option.key === selectedRegionalEndpoint)?.text
                          : regionOptions[0]?.text
                      }
                      onChange={handleOnSelectedRegionOptionChange}
                      options={regionOptions}
                      styles={{ root: { marginBottom: "10px" } }}
                    />
                  </div>
                </AccordionPanel>
              </AccordionItem>
            )}
            {userContext.apiType === "SQL" && !isEmulator && (
              <>
                <AccordionItem value="4">
                  <AccordionHeader>
                    <div className={styles.header}>Query Timeout</div>
                  </AccordionHeader>
                  <AccordionPanel>
                    <div className={styles.settingsSectionContainer}>
                      <div className={styles.settingsSectionDescription}>
                        When a query reaches a specified time limit, a popup with an option to cancel the query will
                        show unless automatic cancellation has been enabled.
                      </div>
                      <Toggle
                        styles={toggleStyles}
                        label="Enable query timeout"
                        onChange={handleOnQueryTimeoutToggleChange}
                        defaultChecked={queryTimeoutEnabled}
                      />
                    </div>
                    {queryTimeoutEnabled && (
                      <div className={styles.settingsSectionContainer}>
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
                <AccordionItem value="5">
                  <AccordionHeader>
                    <div className={styles.header}>RU Limit</div>
                  </AccordionHeader>
                  <AccordionPanel>
                    <div className={styles.settingsSectionContainer}>
                      <div className={styles.settingsSectionDescription}>
                        If a query exceeds a configured RU limit, the query will be aborted.
                      </div>
                      <Toggle
                        styles={toggleStyles}
                        label="Enable RU limit"
                        onChange={handleOnRUThresholdToggleChange}
                        defaultChecked={ruThresholdEnabled}
                      />
                    </div>
                    {ruThresholdEnabled && (
                      <div className={styles.settingsSectionContainer}>
                        <SpinButton
                          label="RU Limit (RU)"
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

                <AccordionItem value="6">
                  <AccordionHeader>
                    <div className={styles.header}>Default Query Results View</div>
                  </AccordionHeader>
                  <AccordionPanel>
                    <div className={styles.settingsSectionContainer}>
                      <div className={styles.settingsSectionDescription}>
                        Select the default view to use when displaying query results.
                      </div>
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

            {showRetrySettings && (
              <AccordionItem value="7">
                <AccordionHeader>
                  <div className={styles.header}>Retry Settings</div>
                </AccordionHeader>
                <AccordionPanel>
                  <div className={styles.settingsSectionContainer}>
                    <div className={styles.settingsSectionDescription}>
                      Retry policy associated with throttled requests during CosmosDB queries.
                    </div>
                    <div>
                      <span className={styles.subHeader}>Max retry attempts</span>
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
                      <span className={styles.subHeader}>Fixed retry interval (ms)</span>
                      <InfoTooltip className={styles.headerIcon}>
                        Fixed retry interval in milliseconds to wait between each retry ignoring the retryAfter returned
                        as part of the response. Default value is 0 milliseconds.
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
                      <span className={styles.subHeader}>Max wait time (s)</span>
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
                      onIncrement={(newValue) =>
                        setMaxWaitTimeInSeconds(parseInt(newValue) + 1 || MaxWaitTimeInSeconds)
                      }
                      onDecrement={(newValue) =>
                        setMaxWaitTimeInSeconds(parseInt(newValue) - 1 || MaxWaitTimeInSeconds)
                      }
                      onValidate={(newValue) => setMaxWaitTimeInSeconds(parseInt(newValue) || MaxWaitTimeInSeconds)}
                      styles={spinButtonStyles}
                    />
                  </div>
                </AccordionPanel>
              </AccordionItem>
            )}
            {!isEmulator && (
              <AccordionItem value="8">
                <AccordionHeader>
                  <div className={styles.header}>Enable container pagination</div>
                </AccordionHeader>
                <AccordionPanel>
                  <div className={styles.settingsSectionContainer}>
                    <div className={styles.settingsSectionDescription}>
                      Load 50 containers at a time. Currently, containers are not pulled in alphanumeric order.
                    </div>
                    <Checkbox
                      styles={{
                        label: { padding: 0 },
                      }}
                      className="padding"
                      ariaLabel="Enable container pagination"
                      checked={containerPaginationEnabled}
                      onChange={() => setContainerPaginationEnabled(!containerPaginationEnabled)}
                      label="Enable container pagination"
                    />
                  </div>
                </AccordionPanel>
              </AccordionItem>
            )}
            {shouldShowCrossPartitionOption && (
              <AccordionItem value="9">
                <AccordionHeader>
                  <div className={styles.header}>Enable cross-partition query</div>
                </AccordionHeader>
                <AccordionPanel>
                  <div className={styles.settingsSectionContainer}>
                    <div className={styles.settingsSectionDescription}>
                      Send more than one request while executing a query. More than one request is necessary if the
                      query is not scoped to single partition key value.
                    </div>
                    <Checkbox
                      styles={{
                        label: { padding: 0 },
                      }}
                      className="padding"
                      ariaLabel="Enable cross partition query"
                      checked={crossPartitionQueryEnabled}
                      onChange={() => setCrossPartitionQueryEnabled(!crossPartitionQueryEnabled)}
                      label="Enable cross-partition query"
                    />
                  </div>
                </AccordionPanel>
              </AccordionItem>
            )}
            {shouldShowEnhancedQueryControl && (
              <AccordionItem value="10">
                <AccordionHeader>
                  <div className={styles.header}>Enhanced query control</div>
                </AccordionHeader>
                <AccordionPanel>
                  <div className={styles.settingsSectionContainer}>
                    <div className={styles.settingsSectionDescription}>
                      Query up to the max degree of parallelism.
                      <a
                        href="https://learn.microsoft.com/en-us/azure/cosmos-db/nosql/performance-tips-query-sdk?tabs=v3&pivots=programming-language-nodejs#enhanced-query-control"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {" "}
                        Learn more{" "}
                      </a>
                    </div>
                    <Checkbox
                      styles={{
                        label: { padding: 0 },
                      }}
                      className="padding"
                      ariaLabel="EnableQueryControl"
                      checked={queryControlEnabled}
                      onChange={() => setQueryControlEnabled(!queryControlEnabled)}
                      label="Enable query control"
                    />
                  </div>
                </AccordionPanel>
              </AccordionItem>
            )}
            {shouldShowParallelismOption && (
              <AccordionItem value="10">
                <AccordionHeader>
                  <div className={styles.header}>Max degree of parallelism</div>
                </AccordionHeader>
                <AccordionPanel>
                  <div className={styles.settingsSectionContainer}>
                    <div className={styles.settingsSectionDescription}>
                      Gets or sets the number of concurrent operations run client side during parallel query execution.
                      A positive property value limits the number of concurrent operations to the set value. If it is
                      set to less than 0, the system automatically decides the number of concurrent operations to run.
                    </div>
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
                      label="Max degree of parallelism"
                    />
                  </div>
                </AccordionPanel>
              </AccordionItem>
            )}
            {shouldShowPriorityLevelOption && (
              <AccordionItem value="11">
                <AccordionHeader>
                  <div className={styles.header}>Priority Level</div>
                </AccordionHeader>
                <AccordionPanel>
                  <div className={styles.settingsSectionContainer}>
                    <div className={styles.settingsSectionDescription}>
                      Sets the priority level for data-plane requests from Data Explorer when using Priority-Based
                      Execution. If &quot;None&quot; is selected, Data Explorer will not specify priority level, and the
                      server-side default priority level will be used.
                    </div>
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
              <AccordionItem value="12">
                <AccordionHeader>
                  <div className={styles.header}>Display Gremlin query results as:&nbsp;</div>
                </AccordionHeader>
                <AccordionPanel>
                  <div className={styles.settingsSectionContainer}>
                    <div className={styles.settingsSectionDescription}>
                      Select Graph to automatically visualize the query results as a Graph or JSON to display the
                      results as JSON.
                    </div>
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
              <AccordionItem value="13">
                <AccordionHeader>
                  <div className={styles.header}>Enable sample database</div>
                </AccordionHeader>
                <AccordionPanel>
                  <div className={styles.settingsSectionContainer}>
                    <div className={styles.settingsSectionDescription}>
                      This is a sample database and collection with synthetic product data you can use to explore using
                      NoSQL queries. This will appear as another database in the Data Explorer UI, and is created by,
                      and maintained by Microsoft at no cost to you.
                    </div>
                    <Checkbox
                      styles={{
                        label: { padding: 0 },
                      }}
                      className="padding"
                      ariaLabel="Enable sample db for query exploration"
                      checked={copilotSampleDBEnabled}
                      onChange={handleSampleDatabaseChange}
                      label="Enable sample database"
                    />
                  </div>
                </AccordionPanel>
              </AccordionItem>
            )}
            {shouldShowMongoGuidRepresentationOption && (
              <AccordionItem value="14">
                <AccordionHeader>
                  <div className={styles.header}>Guid Representation</div>
                </AccordionHeader>
                <AccordionPanel>
                  <div className={styles.settingsSectionContainer}>
                    <div className={styles.settingsSectionDescription}>
                      GuidRepresentation in MongoDB refers to how Globally Unique Identifiers (GUIDs) are serialized and
                      deserialized when stored in BSON documents. This will apply to all document operations.
                    </div>
                    <Dropdown
                      aria-labelledby="mongoGuidRepresentation"
                      selectedKey={mongoGuidRepresentation}
                      options={mongoGuidRepresentationDropdownOptions}
                      onChange={handleOnMongoGuidRepresentationOptionChange}
                    />
                  </div>
                </AccordionPanel>
              </AccordionItem>
            )}
            <AccordionItem value="15">
              <AccordionHeader>
                <div className={styles.header}>Advanced Settings</div>
              </AccordionHeader>
              <AccordionPanel>
                <div className={styles.settingsSectionContainer}>
                  <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 4 }}>
                    <Checkbox
                      styles={{ label: { padding: 0 } }}
                      className="padding"
                      ariaLabel="Ignore partition key on document update"
                      checked={ignorePartitionKeyOnDocumentUpdate}
                      onChange={handleOnIgnorePartitionKeyOnDocumentUpdateChange}
                      label="Ignore partition key on document update"
                    />
                    <InfoTooltip className={styles.headerIcon}>
                      If checked, the partition key value will not be used to locate the document during update
                      operations. Only use this if document updates are failing due to an abnormal partition key.
                    </InfoTooltip>
                  </Stack>
                </div>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        )}

        <div className="settingsSection">
          <div className="settingsSectionPart">
            <DefaultButton
              onClick={() => {
                useDialog.getState().showOkCancelModalDialog(
                  "Clear History",
                  undefined,
                  "Are you sure you want to proceed?",
                  () => {
                    deleteAllStates();
                    updateUserContext({
                      selectedRegionalEndpoint: undefined,
                      writeEnabledInSelectedRegion: true,
                      refreshCosmosClient: true,
                    });
                    useClientWriteEnabled.setState({ clientWriteEnabled: true });
                  },
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
                      <li>Reset region selection to global</li>
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
