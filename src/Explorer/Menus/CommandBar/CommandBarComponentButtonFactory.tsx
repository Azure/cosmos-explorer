import { KeyboardAction } from "KeyboardShortcuts";
import { ReactTabKind, useTabs } from "hooks/useTabs";
import * as React from "react";
import AddCollectionIcon from "../../../../images/AddCollection.svg";
import AddDatabaseIcon from "../../../../images/AddDatabase.svg";
import AddSqlQueryIcon from "../../../../images/AddSqlQuery_16x16.svg";
import AddStoredProcedureIcon from "../../../../images/AddStoredProcedure.svg";
import AddTriggerIcon from "../../../../images/AddTrigger.svg";
import AddUdfIcon from "../../../../images/AddUdf.svg";
import BrowseQueriesIcon from "../../../../images/BrowseQuery.svg";
import FeedbackIcon from "../../../../images/Feedback-Command.svg";
import HomeIcon from "../../../../images/Home_16.svg";
import HostedTerminalIcon from "../../../../images/Hosted-Terminal.svg";
import OpenQueryFromDiskIcon from "../../../../images/OpenQueryFromDisk.svg";
import OpenInTabIcon from "../../../../images/open-in-tab.svg";
import SettingsIcon from "../../../../images/settings_15x15.svg";
import SynapseIcon from "../../../../images/synapse-link.svg";
import { AuthType } from "../../../AuthType";
import * as Constants from "../../../Common/Constants";
import { Platform, configContext } from "../../../ConfigContext";
import * as ViewModels from "../../../Contracts/ViewModels";
import { userContext } from "../../../UserContext";
import { getCollectionName, getDatabaseName } from "../../../Utils/APITypeUtils";
import { isRunningOnNationalCloud } from "../../../Utils/CloudUtils";
import { useSidePanel } from "../../../hooks/useSidePanel";
import { CommandButtonComponentProps } from "../../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../../Explorer";
import { useNotebook } from "../../Notebook/useNotebook";
import { OpenFullScreen } from "../../OpenFullScreen";
import { AddDatabasePanel } from "../../Panes/AddDatabasePanel/AddDatabasePanel";
import { BrowseQueriesPane } from "../../Panes/BrowseQueriesPane/BrowseQueriesPane";
import { LoadQueryPane } from "../../Panes/LoadQueryPane/LoadQueryPane";
import { SettingsPane } from "../../Panes/SettingsPane/SettingsPane";
import { useDatabases } from "../../useDatabases";
import { SelectedNodeState, useSelectedNode } from "../../useSelectedNode";

let counter = 0;

export function createStaticCommandBarButtons(
  container: Explorer,
  selectedNodeState: SelectedNodeState,
): CommandButtonComponentProps[] {
  if (userContext.authType === AuthType.ResourceToken) {
    return createStaticCommandBarButtonsForResourceToken(container, selectedNodeState);
  }

  const buttons: CommandButtonComponentProps[] = [];

  // Avoid starting with a divider
  const addDivider = () => {
    if (buttons.length > 0) {
      buttons.push(createDivider());
    }
  };

  if (configContext.platform !== Platform.Fabric) {
    const homeBtn = createHomeButton();
    buttons.push(homeBtn);

    const newCollectionBtn = createNewCollectionGroup(container);
    newCollectionBtn.keyboardAction = KeyboardAction.NEW_COLLECTION; // Just for the root button, not the child version we create below.
    buttons.push(newCollectionBtn);
    if (userContext.apiType !== "Tables" && userContext.apiType !== "Cassandra") {
      const addSynapseLink = createOpenSynapseLinkDialogButton(container);

      if (addSynapseLink) {
        addDivider();
        buttons.push(addSynapseLink);
      }
    }

    if (userContext.apiType !== "Tables") {
      newCollectionBtn.children = [createNewCollectionGroup(container)];
      const newDatabaseBtn = createNewDatabase(container);
      newCollectionBtn.children.push(newDatabaseBtn);
    }
  }

  if (!selectedNodeState.isDatabaseNodeOrNoneSelected()) {
    const isQuerySupported = userContext.apiType === "SQL" || userContext.apiType === "Gremlin";

    if (isQuerySupported) {
      addDivider();
      const newSqlQueryBtn = createNewSQLQueryButton(selectedNodeState);
      buttons.push(newSqlQueryBtn);
    }

    if (isQuerySupported && selectedNodeState.findSelectedCollection() && configContext.platform !== Platform.Fabric) {
      const openQueryBtn = createOpenQueryButton(container);
      openQueryBtn.children = [createOpenQueryButton(container), createOpenQueryFromDiskButton()];
      buttons.push(openQueryBtn);
    }

    if (areScriptsSupported()) {
      const label = "New Stored Procedure";
      const newStoredProcedureBtn: CommandButtonComponentProps = {
        iconSrc: AddStoredProcedureIcon,
        iconAlt: label,
        keyboardAction: KeyboardAction.NEW_SPROC,
        onCommandClick: () => {
          const selectedCollection: ViewModels.Collection = selectedNodeState.findSelectedCollection();
          selectedCollection && selectedCollection.onNewStoredProcedureClick(selectedCollection);
        },
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: true,
        disabled:
          useSelectedNode.getState().isQueryCopilotCollectionSelected() ||
          selectedNodeState.isDatabaseNodeOrNoneSelected(),
      };

      newStoredProcedureBtn.children = createScriptCommandButtons(selectedNodeState);
      buttons.push(newStoredProcedureBtn);
    }
  }

  return buttons;
}

export function createContextCommandBarButtons(
  container: Explorer,
  selectedNodeState: SelectedNodeState,
): CommandButtonComponentProps[] {
  const buttons: CommandButtonComponentProps[] = [];

  if (!selectedNodeState.isDatabaseNodeOrNoneSelected() && userContext.apiType === "Mongo") {
    const label = useNotebook.getState().isShellEnabled ? "Open Mongo Shell" : "New Shell";
    const newMongoShellBtn: CommandButtonComponentProps = {
      iconSrc: HostedTerminalIcon,
      iconAlt: label,
      onCommandClick: () => {
        const selectedCollection: ViewModels.Collection = selectedNodeState.findSelectedCollection();
        if (useNotebook.getState().isShellEnabled) {
          container.openNotebookTerminal(ViewModels.TerminalKind.Mongo);
        } else {
          selectedCollection && selectedCollection.onNewMongoShellClick();
        }
      },
      commandButtonLabel: label,
      ariaLabel: label,
      hasPopup: true,
    };
    buttons.push(newMongoShellBtn);
  }

  if (
    useNotebook.getState().isShellEnabled &&
    !selectedNodeState.isDatabaseNodeOrNoneSelected() &&
    userContext.apiType === "Cassandra"
  ) {
    const label: string = "Open Cassandra Shell";
    const newCassandraShellButton: CommandButtonComponentProps = {
      iconSrc: HostedTerminalIcon,
      iconAlt: label,
      onCommandClick: () => {
        container.openNotebookTerminal(ViewModels.TerminalKind.Cassandra);
      },
      commandButtonLabel: label,
      ariaLabel: label,
      hasPopup: true,
    };
    buttons.push(newCassandraShellButton);
  }

  return buttons;
}

export function createControlCommandBarButtons(container: Explorer): CommandButtonComponentProps[] {
  const buttons: CommandButtonComponentProps[] =
    configContext.platform === Platform.Fabric && userContext.fabricContext?.isReadOnly
      ? []
      : [
          {
            iconSrc: SettingsIcon,
            iconAlt: "Settings",
            onCommandClick: () =>
              useSidePanel.getState().openSidePanel("Settings", <SettingsPane explorer={container} />),
            commandButtonLabel: undefined,
            ariaLabel: "Settings",
            tooltipText: "Settings",
            hasPopup: true,
            disabled: false,
          },
        ];

  const showOpenFullScreen =
    configContext.platform === Platform.Portal && !isRunningOnNationalCloud() && userContext.apiType !== "Gremlin";

  if (showOpenFullScreen) {
    const label = "Open Full Screen";
    const fullScreenButton: CommandButtonComponentProps = {
      id: "openFullScreenBtn",
      iconSrc: OpenInTabIcon,
      iconAlt: label,
      onCommandClick: () => {
        useSidePanel.getState().openSidePanel("Open Full Screen", <OpenFullScreen />);
      },
      commandButtonLabel: undefined,
      ariaLabel: label,
      tooltipText: label,
      hasPopup: false,
      disabled: !showOpenFullScreen,
      className: "OpenFullScreen",
    };
    buttons.push(fullScreenButton);
  }

  if (configContext.platform === Platform.Portal) {
    const label = "Feedback";
    const feedbackButtonOptions: CommandButtonComponentProps = {
      iconSrc: FeedbackIcon,
      iconAlt: label,
      onCommandClick: () => container.openCESCVAFeedbackBlade(),
      commandButtonLabel: undefined,
      ariaLabel: label,
      tooltipText: label,
      hasPopup: false,
      disabled: false,
    };
    buttons.push(feedbackButtonOptions);
  }

  return buttons;
}

export function createDivider(): CommandButtonComponentProps {
  const label = `divider${counter++}`;
  return {
    isDivider: true,
    commandButtonLabel: label,
    hasPopup: false,
    iconSrc: undefined,
    iconAlt: undefined,
    onCommandClick: undefined,
    ariaLabel: label,
  };
}

function areScriptsSupported(): boolean {
  return (
    configContext.platform !== Platform.Fabric && (userContext.apiType === "SQL" || userContext.apiType === "Gremlin")
  );
}

function createNewCollectionGroup(container: Explorer): CommandButtonComponentProps {
  const label = `New ${getCollectionName()}`;
  return {
    iconSrc: AddCollectionIcon,
    iconAlt: label,
    onCommandClick: () => container.onNewCollectionClicked(),
    commandButtonLabel: label,
    ariaLabel: label,
    hasPopup: true,
    id: "createNewContainerCommandButton",
  };
}

function createHomeButton(): CommandButtonComponentProps {
  const label = "Home";
  return {
    iconSrc: HomeIcon,
    iconAlt: label,
    onCommandClick: () => useTabs.getState().openAndActivateReactTab(ReactTabKind.Home),
    commandButtonLabel: label,
    hasPopup: false,
    ariaLabel: label,
  };
}

function createOpenSynapseLinkDialogButton(container: Explorer): CommandButtonComponentProps {
  if (configContext.platform === Platform.Emulator) {
    return undefined;
  }

  if (userContext?.databaseAccount?.properties?.enableAnalyticalStorage) {
    return undefined;
  }

  const capabilities = userContext?.databaseAccount?.properties?.capabilities || [];
  if (capabilities.some((capability) => capability.name === Constants.CapabilityNames.EnableStorageAnalytics)) {
    return undefined;
  }

  const label = "Enable Azure Synapse Link";
  return {
    iconSrc: SynapseIcon,
    iconAlt: label,
    onCommandClick: () => container.openEnableSynapseLinkDialog(),
    commandButtonLabel: label,
    hasPopup: false,
    disabled:
      useSelectedNode.getState().isQueryCopilotCollectionSelected() || useNotebook.getState().isSynapseLinkUpdating,
    ariaLabel: label,
  };
}

function createNewDatabase(container: Explorer): CommandButtonComponentProps {
  const label = "New " + getDatabaseName();
  return {
    iconSrc: AddDatabaseIcon,
    iconAlt: label,
    keyboardAction: KeyboardAction.NEW_DATABASE,
    onCommandClick: async () => {
      const throughputCap = userContext.databaseAccount?.properties.capacity?.totalThroughputLimit;
      if (throughputCap && throughputCap !== -1) {
        await useDatabases.getState().loadAllOffers();
      }
      useSidePanel.getState().openSidePanel("New " + getDatabaseName(), <AddDatabasePanel explorer={container} />);
    },
    commandButtonLabel: label,
    ariaLabel: label,
    hasPopup: true,
  };
}

function createNewSQLQueryButton(selectedNodeState: SelectedNodeState): CommandButtonComponentProps {
  if (userContext.apiType === "SQL" || userContext.apiType === "Gremlin") {
    const label = "New SQL Query";
    return {
      id: "newQueryBtn",
      iconSrc: AddSqlQueryIcon,
      iconAlt: label,
      keyboardAction: KeyboardAction.NEW_QUERY,
      onCommandClick: () => {
        const selectedCollection: ViewModels.Collection = selectedNodeState.findSelectedCollection();
        selectedCollection && selectedCollection.onNewQueryClick(selectedCollection);
      },
      commandButtonLabel: label,
      ariaLabel: label,
      hasPopup: true,
      disabled: selectedNodeState.isDatabaseNodeOrNoneSelected(),
    };
  } else if (userContext.apiType === "Mongo") {
    const label = "New Query";
    return {
      id: "newQueryBtn",
      iconSrc: AddSqlQueryIcon,
      iconAlt: label,
      keyboardAction: KeyboardAction.NEW_QUERY,
      onCommandClick: () => {
        const selectedCollection: ViewModels.Collection = selectedNodeState.findSelectedCollection();
        selectedCollection && selectedCollection.onNewMongoQueryClick(selectedCollection);
      },
      commandButtonLabel: label,
      ariaLabel: label,
      hasPopup: true,
      disabled: selectedNodeState.isDatabaseNodeOrNoneSelected(),
    };
  }

  return undefined;
}

export function createScriptCommandButtons(selectedNodeState: SelectedNodeState): CommandButtonComponentProps[] {
  const buttons: CommandButtonComponentProps[] = [];

  const shouldEnableScriptsCommands: boolean =
    !selectedNodeState.isDatabaseNodeOrNoneSelected() && areScriptsSupported();

  if (shouldEnableScriptsCommands) {
    const label = "New Stored Procedure";
    const newStoredProcedureBtn: CommandButtonComponentProps = {
      iconSrc: AddStoredProcedureIcon,
      iconAlt: label,
      keyboardAction: KeyboardAction.NEW_SPROC,
      onCommandClick: () => {
        const selectedCollection: ViewModels.Collection = selectedNodeState.findSelectedCollection();
        selectedCollection && selectedCollection.onNewStoredProcedureClick(selectedCollection);
      },
      commandButtonLabel: label,
      ariaLabel: label,
      hasPopup: true,
      disabled:
        useSelectedNode.getState().isQueryCopilotCollectionSelected() ||
        selectedNodeState.isDatabaseNodeOrNoneSelected(),
    };
    buttons.push(newStoredProcedureBtn);
  }

  if (shouldEnableScriptsCommands) {
    const label = "New UDF";
    const newUserDefinedFunctionBtn: CommandButtonComponentProps = {
      iconSrc: AddUdfIcon,
      iconAlt: label,
      keyboardAction: KeyboardAction.NEW_UDF,
      onCommandClick: () => {
        const selectedCollection: ViewModels.Collection = selectedNodeState.findSelectedCollection();
        selectedCollection && selectedCollection.onNewUserDefinedFunctionClick(selectedCollection);
      },
      commandButtonLabel: label,
      ariaLabel: label,
      hasPopup: true,
      disabled:
        useSelectedNode.getState().isQueryCopilotCollectionSelected() ||
        selectedNodeState.isDatabaseNodeOrNoneSelected(),
    };
    buttons.push(newUserDefinedFunctionBtn);
  }

  if (shouldEnableScriptsCommands) {
    const label = "New Trigger";
    const newTriggerBtn: CommandButtonComponentProps = {
      iconSrc: AddTriggerIcon,
      iconAlt: label,
      keyboardAction: KeyboardAction.NEW_TRIGGER,
      onCommandClick: () => {
        const selectedCollection: ViewModels.Collection = selectedNodeState.findSelectedCollection();
        selectedCollection && selectedCollection.onNewTriggerClick(selectedCollection);
      },
      commandButtonLabel: label,
      ariaLabel: label,
      hasPopup: true,
      disabled:
        useSelectedNode.getState().isQueryCopilotCollectionSelected() ||
        selectedNodeState.isDatabaseNodeOrNoneSelected(),
    };
    buttons.push(newTriggerBtn);
  }

  return buttons;
}

function createOpenQueryButton(container: Explorer): CommandButtonComponentProps {
  const label = "Open Query";
  return {
    iconSrc: BrowseQueriesIcon,
    iconAlt: label,
    keyboardAction: KeyboardAction.OPEN_QUERY,
    onCommandClick: () =>
      useSidePanel.getState().openSidePanel("Open Saved Queries", <BrowseQueriesPane explorer={container} />),
    commandButtonLabel: label,
    ariaLabel: label,
    hasPopup: true,
    disabled: useSelectedNode.getState().isQueryCopilotCollectionSelected(),
  };
}

function createOpenQueryFromDiskButton(): CommandButtonComponentProps {
  const label = "Open Query From Disk";
  return {
    iconSrc: OpenQueryFromDiskIcon,
    iconAlt: label,
    keyboardAction: KeyboardAction.OPEN_QUERY_FROM_DISK,
    onCommandClick: () => useSidePanel.getState().openSidePanel("Load Query", <LoadQueryPane />),
    commandButtonLabel: label,
    ariaLabel: label,
    hasPopup: true,
    disabled: useSelectedNode.getState().isQueryCopilotCollectionSelected(),
  };
}

function createOpenTerminalButtonByKind(
  container: Explorer,
  terminalKind: ViewModels.TerminalKind,
): CommandButtonComponentProps {
  const terminalFriendlyName = (): string => {
    switch (terminalKind) {
      case ViewModels.TerminalKind.Cassandra:
        return "Cassandra";
      case ViewModels.TerminalKind.Mongo:
        return "Mongo";
      case ViewModels.TerminalKind.Postgres:
        return "PSQL";
      case ViewModels.TerminalKind.VCoreMongo:
        return "MongoDB (vCore)";
      default:
        return "";
    }
  };
  const label = `Open ${terminalFriendlyName()} shell`;
  const tooltip =
    "This feature is not yet available in your account's region. View supported regions here: https://aka.ms/cosmos-enable-notebooks.";
  const disableButton =
    !useNotebook.getState().isNotebooksEnabledForAccount && !useNotebook.getState().isNotebookEnabled;
  return {
    iconSrc: HostedTerminalIcon,
    iconAlt: label,
    onCommandClick: () => {
      if (useNotebook.getState().isNotebookEnabled) {
        container.openNotebookTerminal(terminalKind);
      }
    },
    commandButtonLabel: label,
    hasPopup: false,
    disabled: disableButton,
    ariaLabel: label,
    tooltipText: !disableButton ? "" : tooltip,
  };
}

function createStaticCommandBarButtonsForResourceToken(
  container: Explorer,
  selectedNodeState: SelectedNodeState,
): CommandButtonComponentProps[] {
  const newSqlQueryBtn = createNewSQLQueryButton(selectedNodeState);
  const openQueryBtn = createOpenQueryButton(container);

  const resourceTokenCollection: ViewModels.CollectionBase = useDatabases.getState().resourceTokenCollection;
  const isResourceTokenCollectionNodeSelected: boolean =
    resourceTokenCollection?.id() === selectedNodeState.selectedNode?.id();
  newSqlQueryBtn.disabled = !isResourceTokenCollectionNodeSelected;
  newSqlQueryBtn.onCommandClick = () => {
    const resourceTokenCollection: ViewModels.CollectionBase = useDatabases.getState().resourceTokenCollection;
    resourceTokenCollection && resourceTokenCollection.onNewQueryClick(resourceTokenCollection, undefined);
  };

  openQueryBtn.disabled = !isResourceTokenCollectionNodeSelected;
  if (!openQueryBtn.disabled) {
    openQueryBtn.children = [createOpenQueryButton(container), createOpenQueryFromDiskButton()];
  }

  return [newSqlQueryBtn, openQueryBtn];
}

export function createPostgreButtons(container: Explorer): CommandButtonComponentProps[] {
  const openPostgreShellBtn = createOpenTerminalButtonByKind(container, ViewModels.TerminalKind.Postgres);

  return [openPostgreShellBtn];
}

export function createVCoreMongoButtons(container: Explorer): CommandButtonComponentProps[] {
  const openVCoreMongoTerminalButton = createOpenTerminalButtonByKind(container, ViewModels.TerminalKind.VCoreMongo);

  return [openVCoreMongoTerminalButton];
}
