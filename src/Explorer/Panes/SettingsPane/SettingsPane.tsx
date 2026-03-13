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
import { Keys, t } from "Localization";
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
    color: "var(--colorNeutralForeground1)",
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
    color: "var(--colorNeutralForeground1)",
  },
  headerIcon: {
    paddingTop: "4px",
    cursor: "pointer",
  },
  settingsSectionContainer: {
    paddingLeft: "15px",
    color: "var(--colorNeutralForeground1)",
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
  const sessionId: string = userContext.sessionId;
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
    text: t(Keys.panes.settings.globalDefault),
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
        text: `${loc.locationName} ${t(Keys.panes.settings.readWrite)}`,
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
        text: `${loc.locationName} ${t(Keys.panes.settings.read)}`,
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
            logConsoleError(t(Keys.panes.settings.popupsDisabledError));
          } else {
            logConsoleError(t(Keys.panes.settings.failedToAcquireTokenError));
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
    submitButtonText: t(Keys.common.apply),
    onSubmit: () => handlerOnSubmit(),
  };
  const pageOptionList: IChoiceGroupOption[] = [
    { key: Constants.Queries.CustomPageOption, text: t(Keys.panes.settings.custom) },
    { key: Constants.Queries.UnlimitedPageOption, text: t(Keys.panes.settings.unlimited) },
  ];

  const graphAutoOptionList: IChoiceGroupOption[] = [
    { key: "false", text: t(Keys.panes.settings.graph) },
    { key: "true", text: t(Keys.panes.settings.json) },
  ];

  const priorityLevelOptionList: IChoiceGroupOption[] = [
    { key: Constants.PriorityLevel.Low, text: t(Keys.panes.settings.low) },
    { key: Constants.PriorityLevel.High, text: t(Keys.panes.settings.high) },
  ];

  const dataPlaneRBACOptionsList: IChoiceGroupOption[] = [
    { key: Constants.RBACOptions.setAutomaticRBACOption, text: t(Keys.panes.settings.automatic) },
    { key: Constants.RBACOptions.setTrueRBACOption, text: t(Keys.panes.settings["true"]) },
    { key: Constants.RBACOptions.setFalseRBACOption, text: t(Keys.panes.settings["false"]) },
  ];

  const defaultQueryResultsViewOptionList: IChoiceGroupOption[] = [
    { key: SplitterDirection.Vertical, text: t(Keys.tabs.query.vertical) },
    { key: SplitterDirection.Horizontal, text: t(Keys.tabs.query.horizontal) },
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
            color: "inherit",
          },
          ".ms-ChoiceField": {
            marginTop: 0,
            color: "inherit",
          },
          ".ms-ChoiceField-field": {
            color: "inherit",
          },
          ".ms-ChoiceField-field:hover": {
            color: "inherit",
          },
          ".ms-ChoiceField-field:hover .ms-ChoiceField-labelWrapper": {
            color: "inherit",
          },
          ".ms-ChoiceField-field:hover span": {
            color: "inherit",
          },
          ".ms-ChoiceField-wrapper": {
            color: "inherit",
          },
          ".ms-ChoiceField-wrapper:hover": {
            color: "inherit",
          },
          ".ms-ChoiceField-labelWrapper": {
            color: "inherit",
          },
          ".ms-ChoiceField-labelWrapper:hover": {
            color: "inherit",
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
      color: "inherit",
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
      color: "var(--colorNeutralForeground1)",
    },
    root: {
      paddingBottom: 10,
    },
    labelWrapper: {
      color: "var(--colorNeutralForeground1)",
    },
    icon: {
      color: "var(--colorNeutralForeground1)",
    },
    spinButtonWrapper: {
      backgroundColor: "var(--colorNeutralBackground3)",
      borderColor: "var(--colorNeutralStroke1)",
    },
    input: {
      color: "var(--colorNeutralForeground1)",
      backgroundColor: "var(--colorNeutralBackground3)",
      selectors: {
        "::placeholder": {
          color: "var(--colorNeutralForeground2)",
        },
        "&:focus": {
          backgroundColor: "var(--colorNeutralBackground3)",
          borderColor: "var(--colorBrandStroke1)",
        },
      },
    },
    arrowButtonsContainer: {
      backgroundColor: "var(--colorNeutralBackground3)",
    },
  };

  return (
    <RightPaneForm {...genericPaneProps}>
      <div className={`paneMainContent ${styles.container}`}>
        {!isFabricNative() && (
          <Accordion className={`customAccordion ${styles.firstItem}`} collapsible>
            {shouldShowQueryPageOptions && (
              <AccordionItem value="1">
                <AccordionHeader>
                  <div className={styles.header}>{t(Keys.panes.settings.pageOptions)}</div>
                </AccordionHeader>
                <AccordionPanel>
                  <div className={styles.settingsSectionContainer}>
                    <div className={styles.settingsSectionDescription}>
                      {t(Keys.panes.settings.pageOptionsDescription)}
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
                          {t(Keys.panes.settings.queryResultsPerPage)}{" "}
                          <InfoTooltip className={styles.headerIcon}>
                            {t(Keys.panes.settings.queryResultsPerPageTooltip)}
                          </InfoTooltip>
                        </div>

                        <SpinButton
                          ariaLabel={t(Keys.panes.settings.customQueryItemsPerPage)}
                          value={"" + customItemPerPage}
                          onIncrement={(newValue) => {
                            setCustomItemPerPage(parseInt(newValue) + 1 || customItemPerPage);
                          }}
                          onDecrement={(newValue) => setCustomItemPerPage(parseInt(newValue) - 1 || customItemPerPage)}
                          onValidate={(newValue) => setCustomItemPerPage(parseInt(newValue) || customItemPerPage)}
                          min={1}
                          step={1}
                          className="textfontclr"
                          incrementButtonAriaLabel={t(Keys.common.increaseValueBy1)}
                          decrementButtonAriaLabel={t(Keys.common.decreaseValueBy1)}
                          styles={spinButtonStyles}
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
                  <div className={styles.header}>{t(Keys.panes.settings.entraIdRbac)}</div>
                </AccordionHeader>
                <AccordionPanel>
                  <div className={styles.settingsSectionContainer}>
                    <div className={styles.settingsSectionDescription}>
                      {t(Keys.panes.settings.entraIdRbacDescription)}
                      <a
                        href="https://learn.microsoft.com/en-us/azure/cosmos-db/how-to-setup-rbac#use-data-explorer"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {" "}
                        {t(Keys.common.learnMore)}{" "}
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
                  <div className={styles.header}>{t(Keys.panes.settings.regionSelection)}</div>
                </AccordionHeader>
                <AccordionPanel>
                  <div className={styles.settingsSectionContainer}>
                    <div className={styles.settingsSectionDescription}>
                      {t(Keys.panes.settings.regionSelectionDescription)}
                    </div>
                    <div>
                      <span className={styles.subHeader}>{t(Keys.panes.settings.selectRegion)}</span>
                      <InfoTooltip className={styles.headerIcon}>
                        {t(Keys.panes.settings.selectRegionTooltip)}
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
                      styles={{
                        root: { marginBottom: "10px" },
                        dropdown: {
                          backgroundColor: "var(--colorNeutralBackground3)",
                          color: "var(--colorNeutralForeground1)",
                          borderColor: "var(--colorNeutralStroke1)",
                        },
                        title: {
                          backgroundColor: "var(--colorNeutralBackground3)",
                          color: "var(--colorNeutralForeground1)",
                          borderColor: "var(--colorNeutralStroke1)",
                        },
                        dropdownItem: {
                          backgroundColor: "var(--colorNeutralBackground3)",
                          color: "var(--colorNeutralForeground1)",
                          selectors: {
                            "&:hover": {
                              backgroundColor: "var(--colorNeutralBackground4)",
                              color: "var(--colorNeutralForeground1)",
                            },
                          },
                        },
                        dropdownItemSelected: {
                          backgroundColor: "var(--colorBrandBackground)",
                          color: "var(--colorNeutralForegroundOnBrand)",
                        },
                        callout: {
                          backgroundColor: "var(--colorNeutralBackground3)",
                          borderColor: "var(--colorNeutralStroke1)",
                        },
                      }}
                    />
                  </div>
                </AccordionPanel>
              </AccordionItem>
            )}
            {userContext.apiType === "SQL" && !isEmulator && (
              <>
                <AccordionItem value="4">
                  <AccordionHeader>
                    <div className={styles.header}>{t(Keys.panes.settings.queryTimeout)}</div>
                  </AccordionHeader>
                  <AccordionPanel>
                    <div className={styles.settingsSectionContainer}>
                      <div className={styles.settingsSectionDescription}>
                        {t(Keys.panes.settings.queryTimeoutDescription)}
                      </div>
                      <Toggle
                        styles={toggleStyles}
                        label={t(Keys.panes.settings.enableQueryTimeout)}
                        onChange={handleOnQueryTimeoutToggleChange}
                        defaultChecked={queryTimeoutEnabled}
                      />
                    </div>
                    {queryTimeoutEnabled && (
                      <div className={styles.settingsSectionContainer}>
                        <SpinButton
                          label={t(Keys.panes.settings.queryTimeoutMs)}
                          labelPosition={Position.top}
                          defaultValue={(queryTimeout || 5000).toString()}
                          min={100}
                          step={1000}
                          onChange={handleOnQueryTimeoutSpinButtonChange}
                          incrementButtonAriaLabel={t(Keys.panes.settings.increaseValueBy1000)}
                          decrementButtonAriaLabel={t(Keys.panes.settings.decreaseValueBy1000)}
                          styles={spinButtonStyles}
                        />
                        <Toggle
                          label={t(Keys.panes.settings.automaticallyCancelQuery)}
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
                    <div className={styles.header}>{t(Keys.panes.settings.ruLimit)}</div>
                  </AccordionHeader>
                  <AccordionPanel>
                    <div className={styles.settingsSectionContainer}>
                      <div className={styles.settingsSectionDescription}>
                        {t(Keys.panes.settings.ruLimitDescription)}
                      </div>
                      <Toggle
                        styles={toggleStyles}
                        label={t(Keys.panes.settings.enableRuLimit)}
                        onChange={handleOnRUThresholdToggleChange}
                        defaultChecked={ruThresholdEnabled}
                      />
                    </div>
                    {ruThresholdEnabled && (
                      <div className={styles.settingsSectionContainer}>
                        <SpinButton
                          label={t(Keys.panes.settings.ruLimitLabel)}
                          labelPosition={Position.top}
                          defaultValue={(ruThreshold || DefaultRUThreshold).toString()}
                          min={1}
                          step={1000}
                          onChange={handleOnRUThresholdSpinButtonChange}
                          incrementButtonAriaLabel={t(Keys.panes.settings.increaseValueBy1000)}
                          decrementButtonAriaLabel={t(Keys.panes.settings.decreaseValueBy1000)}
                          styles={spinButtonStyles}
                        />
                      </div>
                    )}
                  </AccordionPanel>
                </AccordionItem>

                <AccordionItem value="6">
                  <AccordionHeader>
                    <div className={styles.header}>{t(Keys.panes.settings.defaultQueryResults)}</div>
                  </AccordionHeader>
                  <AccordionPanel>
                    <div className={styles.settingsSectionContainer}>
                      <div className={styles.settingsSectionDescription}>
                        {t(Keys.panes.settings.defaultQueryResultsDescription)}
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
                  <div className={styles.header}>{t(Keys.panes.settings.retrySettings)}</div>
                </AccordionHeader>
                <AccordionPanel>
                  <div className={styles.settingsSectionContainer}>
                    <div className={styles.settingsSectionDescription}>
                      {t(Keys.panes.settings.retrySettingsDescription)}
                    </div>
                    <div>
                      <span className={styles.subHeader}>{t(Keys.panes.settings.maxRetryAttempts)}</span>
                      <InfoTooltip className={styles.headerIcon}>
                        {t(Keys.panes.settings.maxRetryAttemptsTooltip)}
                      </InfoTooltip>
                    </div>
                    <SpinButton
                      labelPosition={Position.top}
                      min={1}
                      step={1}
                      value={"" + retryAttempts}
                      onChange={handleOnQueryRetryAttemptsSpinButtonChange}
                      incrementButtonAriaLabel={t(Keys.common.increaseValueBy1)}
                      decrementButtonAriaLabel={t(Keys.common.decreaseValueBy1)}
                      onIncrement={(newValue) => setRetryAttempts(parseInt(newValue) + 1 || retryAttempts)}
                      onDecrement={(newValue) => setRetryAttempts(parseInt(newValue) - 1 || retryAttempts)}
                      onValidate={(newValue) => setRetryAttempts(parseInt(newValue) || retryAttempts)}
                      styles={spinButtonStyles}
                    />
                    <div>
                      <span className={styles.subHeader}>{t(Keys.panes.settings.fixedRetryInterval)}</span>
                      <InfoTooltip className={styles.headerIcon}>
                        {t(Keys.panes.settings.fixedRetryIntervalTooltip)}
                      </InfoTooltip>
                    </div>
                    <SpinButton
                      labelPosition={Position.top}
                      min={1000}
                      step={1000}
                      value={"" + retryInterval}
                      onChange={handleOnRetryIntervalSpinButtonChange}
                      incrementButtonAriaLabel={t(Keys.panes.settings.increaseValueBy1000)}
                      decrementButtonAriaLabel={t(Keys.panes.settings.decreaseValueBy1000)}
                      onIncrement={(newValue) => setRetryInterval(parseInt(newValue) + 1000 || retryInterval)}
                      onDecrement={(newValue) => setRetryInterval(parseInt(newValue) - 1000 || retryInterval)}
                      onValidate={(newValue) => setRetryInterval(parseInt(newValue) || retryInterval)}
                      styles={spinButtonStyles}
                    />
                    <div>
                      <span className={styles.subHeader}>{t(Keys.panes.settings.maxWaitTime)}</span>
                      <InfoTooltip className={styles.headerIcon}>
                        {t(Keys.panes.settings.maxWaitTimeTooltip)}
                      </InfoTooltip>
                    </div>
                    <SpinButton
                      labelPosition={Position.top}
                      min={1}
                      step={1}
                      value={"" + MaxWaitTimeInSeconds}
                      onChange={handleOnMaxWaitTimeSpinButtonChange}
                      incrementButtonAriaLabel={t(Keys.common.increaseValueBy1)}
                      decrementButtonAriaLabel={t(Keys.common.decreaseValueBy1)}
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
                  <div className={styles.header}>{t(Keys.panes.settings.enableContainerPagination)}</div>
                </AccordionHeader>
                <AccordionPanel>
                  <div className={styles.settingsSectionContainer}>
                    <div className={styles.settingsSectionDescription}>
                      {t(Keys.panes.settings.enableContainerPaginationDescription)}
                    </div>
                    <Checkbox
                      styles={{
                        label: { padding: 0 },
                      }}
                      className="padding"
                      ariaLabel={t(Keys.panes.settings.enableContainerPagination)}
                      checked={containerPaginationEnabled}
                      onChange={() => setContainerPaginationEnabled(!containerPaginationEnabled)}
                      label={t(Keys.panes.settings.enableContainerPagination)}
                      onRenderLabel={() => (
                        <span style={{ color: "var(--colorNeutralForeground1)" }}>
                          {t(Keys.panes.settings.enableContainerPagination)}
                        </span>
                      )}
                    />
                  </div>
                </AccordionPanel>
              </AccordionItem>
            )}
            {shouldShowCrossPartitionOption && (
              <AccordionItem value="9">
                <AccordionHeader>
                  <div className={styles.header}>{t(Keys.panes.settings.enableCrossPartitionQuery)}</div>
                </AccordionHeader>
                <AccordionPanel>
                  <div className={styles.settingsSectionContainer}>
                    <div className={styles.settingsSectionDescription}>
                      {t(Keys.panes.settings.enableCrossPartitionQueryDescription)}
                    </div>
                    <Checkbox
                      styles={{
                        label: { padding: 0 },
                      }}
                      className="padding"
                      ariaLabel={t(Keys.panes.settings.enableCrossPartitionQuery)}
                      checked={crossPartitionQueryEnabled}
                      onChange={() => setCrossPartitionQueryEnabled(!crossPartitionQueryEnabled)}
                      onRenderLabel={() => (
                        <span style={{ color: "var(--colorNeutralForeground1)" }}>
                          {t(Keys.panes.settings.enableCrossPartitionQuery)}
                        </span>
                      )}
                    />
                  </div>
                </AccordionPanel>
              </AccordionItem>
            )}
            {shouldShowEnhancedQueryControl && (
              <AccordionItem value="10">
                <AccordionHeader>
                  <div className={styles.header}>{t(Keys.panes.settings.enhancedQueryControl)}</div>
                </AccordionHeader>
                <AccordionPanel>
                  <div className={styles.settingsSectionContainer}>
                    <div className={styles.settingsSectionDescription}>
                      {t(Keys.panes.settings.maxDegreeOfParallelismQuery)}
                      <a
                        href="https://learn.microsoft.com/en-us/azure/cosmos-db/nosql/performance-tips-query-sdk?tabs=v3&pivots=programming-language-nodejs#enhanced-query-control"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {" "}
                        {t(Keys.common.learnMore)}{" "}
                      </a>
                    </div>
                    <Checkbox
                      styles={{
                        label: { padding: 0 },
                      }}
                      className="padding"
                      ariaLabel={t(Keys.panes.settings.enableQueryControl)}
                      checked={queryControlEnabled}
                      onChange={() => setQueryControlEnabled(!queryControlEnabled)}
                      onRenderLabel={() => (
                        <span style={{ color: "var(--colorNeutralForeground1)" }}>
                          {t(Keys.panes.settings.enableQueryControl)}
                        </span>
                      )}
                    />
                  </div>
                </AccordionPanel>
              </AccordionItem>
            )}
            {shouldShowParallelismOption && (
              <AccordionItem value="10">
                <AccordionHeader>
                  <div className={styles.header}>{t(Keys.panes.settings.maxDegreeOfParallelism)}</div>
                </AccordionHeader>
                <AccordionPanel>
                  <div className={styles.settingsSectionContainer}>
                    <div className={styles.settingsSectionDescription}>
                      {t(Keys.panes.settings.maxDegreeOfParallelismDescription)}
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
                      ariaLabel={t(Keys.panes.settings.maxDegreeOfParallelism)}
                      label={t(Keys.panes.settings.maxDegreeOfParallelism)}
                      styles={spinButtonStyles}
                    />
                  </div>
                </AccordionPanel>
              </AccordionItem>
            )}
            {shouldShowPriorityLevelOption && (
              <AccordionItem value="11">
                <AccordionHeader>
                  <div className={styles.header}>{t(Keys.panes.settings.priorityLevel)}</div>
                </AccordionHeader>
                <AccordionPanel>
                  <div className={styles.settingsSectionContainer}>
                    <div className={styles.settingsSectionDescription}>
                      {t(Keys.panes.settings.priorityLevelDescription)}
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
                  <div className={styles.header}>{t(Keys.panes.settings.displayGremlinQueryResults)}&nbsp;</div>
                </AccordionHeader>
                <AccordionPanel>
                  <div className={styles.settingsSectionContainer}>
                    <div className={styles.settingsSectionDescription}>
                      {t(Keys.panes.settings.displayGremlinQueryResultsDescription)}
                    </div>
                    <ChoiceGroup
                      selectedKey={graphAutoVizDisabled}
                      options={graphAutoOptionList}
                      onChange={handleOnGremlinChange}
                      aria-label={t(Keys.panes.settings.graphAutoVisualization)}
                    />
                  </div>
                </AccordionPanel>
              </AccordionItem>
            )}
            {shouldShowCopilotSampleDBOption && (
              <AccordionItem value="13">
                <AccordionHeader>
                  <div className={styles.header}>{t(Keys.panes.settings.enableSampleDatabase)}</div>
                </AccordionHeader>
                <AccordionPanel>
                  <div className={styles.settingsSectionContainer}>
                    <div className={styles.settingsSectionDescription}>
                      {t(Keys.panes.settings.enableSampleDatabaseDescription)}
                    </div>
                    <Checkbox
                      styles={{
                        label: { padding: 0 },
                      }}
                      className="padding"
                      ariaLabel={t(Keys.panes.settings.enableSampleDbAriaLabel)}
                      checked={copilotSampleDBEnabled}
                      onChange={handleSampleDatabaseChange}
                      onRenderLabel={() => (
                        <span style={{ color: "var(--colorNeutralForeground1)" }}>
                          {t(Keys.panes.settings.enableSampleDatabase)}
                        </span>
                      )}
                    />
                  </div>
                </AccordionPanel>
              </AccordionItem>
            )}
            {shouldShowMongoGuidRepresentationOption && (
              <AccordionItem value="14">
                <AccordionHeader>
                  <div className={styles.header}>{t(Keys.panes.settings.guidRepresentation)}</div>
                </AccordionHeader>
                <AccordionPanel>
                  <div className={styles.settingsSectionContainer}>
                    <div className={styles.settingsSectionDescription}>
                      {t(Keys.panes.settings.guidRepresentationDescription)}
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
                <div className={styles.header}>{t(Keys.panes.settings.advancedSettings)}</div>
              </AccordionHeader>
              <AccordionPanel>
                <div className={styles.settingsSectionContainer}>
                  <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 4 }}>
                    <Checkbox
                      styles={{
                        root: {
                          selectors: {
                            ":hover .ms-Checkbox-text": {
                              color: "var(--colorNeutralForeground1)",
                            },
                            ":hover .ms-Checkbox-label": {
                              color: "var(--colorNeutralForeground1)",
                            },
                          },
                        },
                        label: {
                          padding: 0,
                          color: "var(--colorNeutralForeground1)",
                        },
                        text: {
                          color: "var(--colorNeutralForeground1)",
                        },
                        checkbox: {
                          borderColor: "var(--colorNeutralForeground3)",
                          backgroundColor: "var(--colorNeutralBackground2)",
                        },
                      }}
                      className="padding"
                      ariaLabel={t(Keys.panes.settings.ignorePartitionKey)}
                      checked={ignorePartitionKeyOnDocumentUpdate}
                      onChange={handleOnIgnorePartitionKeyOnDocumentUpdateChange}
                      label={t(Keys.panes.settings.ignorePartitionKey)}
                    />
                    <InfoTooltip className={styles.headerIcon}>
                      {t(Keys.panes.settings.ignorePartitionKeyTooltip)}
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
              styles={{
                root: {
                  backgroundColor: "var(--colorBrandBackground)",
                  color: "var(--colorNeutralForegroundOnBrand)",
                  selectors: {
                    ":hover": {
                      backgroundColor: "var(--colorBrandBackgroundHover)",
                      color: "var(--colorNeutralForegroundOnBrand)",
                    },
                    ":active": {
                      backgroundColor: "var(--colorBrandBackgroundPressed)",
                      color: "var(--colorNeutralForegroundOnBrand)",
                    },
                  },
                },
              }}
              onClick={() => {
                useDialog.getState().showOkCancelModalDialog(
                  t(Keys.panes.settings.clearHistory),
                  undefined,
                  t(Keys.panes.settings.clearHistoryConfirm),
                  () => {
                    deleteAllStates();
                    updateUserContext({
                      selectedRegionalEndpoint: undefined,
                      writeEnabledInSelectedRegion: true,
                      refreshCosmosClient: true,
                    });
                    useClientWriteEnabled.setState({ clientWriteEnabled: true });
                  },
                  t(Keys.common.cancel),
                  undefined,
                  <>
                    <span>{t(Keys.panes.settings.clearHistoryDescription)}</span>
                    <ul className={styles.bulletList}>
                      <li>{t(Keys.panes.settings.clearHistoryTabLayout)}</li>
                      <li>{t(Keys.panes.settings.clearHistoryTableColumns)}</li>
                      <li>{t(Keys.panes.settings.clearHistoryFilters)}</li>
                      <li>{t(Keys.panes.settings.clearHistoryRegion)}</li>
                    </ul>
                  </>,
                );
              }}
            >
              {t(Keys.panes.settings.clearHistory)}
            </DefaultButton>
          </div>
        </div>
        <div className="settingsSection">
          <div className={`settingsSectionPart ${styles.settingsSectionContainer}`}>
            <div className="settingsSectionLabel">{t(Keys.panes.settings.explorerVersion)}</div>
            <div>{explorerVersion}</div>
          </div>
        </div>
        <div className="settingsSection">
          <div className="settingsSectionPart">
            <div className="settingsSectionLabel">{t(Keys.panes.settings.sessionId)}</div>
            <div>{sessionId}</div>
          </div>
        </div>
      </div>
    </RightPaneForm>
  );
};
