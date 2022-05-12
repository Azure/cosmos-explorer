import * as React from "react";
import AddCollectionIcon from "../../../../images/AddCollection.svg";
import AddDatabaseIcon from "../../../../images/AddDatabase.svg";
import AddSqlQueryIcon from "../../../../images/AddSqlQuery_16x16.svg";
import AddStoredProcedureIcon from "../../../../images/AddStoredProcedure.svg";
import AddTriggerIcon from "../../../../images/AddTrigger.svg";
import AddUdfIcon from "../../../../images/AddUdf.svg";
import BrowseQueriesIcon from "../../../../images/BrowseQuery.svg";
import CosmosTerminalIcon from "../../../../images/Cosmos-Terminal.svg";
import FeedbackIcon from "../../../../images/Feedback-Command.svg";
import GitHubIcon from "../../../../images/github.svg";
import HostedTerminalIcon from "../../../../images/Hosted-Terminal.svg";
import NewNotebookIcon from "../../../../images/notebook/Notebook-new.svg";
import ResetWorkspaceIcon from "../../../../images/notebook/Notebook-reset-workspace.svg";
import OpenInTabIcon from "../../../../images/open-in-tab.svg";
import OpenQueryFromDiskIcon from "../../../../images/OpenQueryFromDisk.svg";
import SettingsIcon from "../../../../images/settings_15x15.svg";
import SynapseIcon from "../../../../images/synapse-link.svg";
import { AuthType } from "../../../AuthType";
import * as Constants from "../../../Common/Constants";
import { configContext, Platform } from "../../../ConfigContext";
import * as ViewModels from "../../../Contracts/ViewModels";
import { useSidePanel } from "../../../hooks/useSidePanel";
import { JunoClient } from "../../../Juno/JunoClient";
import { userContext } from "../../../UserContext";
import { getCollectionName, getDatabaseName } from "../../../Utils/APITypeUtils";
import { isRunningOnNationalCloud } from "../../../Utils/CloudUtils";
import { CommandButtonComponentProps } from "../../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../../Explorer";
import { useNotebook } from "../../Notebook/useNotebook";
import { OpenFullScreen } from "../../OpenFullScreen";
import { AddDatabasePanel } from "../../Panes/AddDatabasePanel/AddDatabasePanel";
import { BrowseQueriesPane } from "../../Panes/BrowseQueriesPane/BrowseQueriesPane";
import { GitHubReposPanel } from "../../Panes/GitHubReposPanel/GitHubReposPanel";
import { LoadQueryPane } from "../../Panes/LoadQueryPane/LoadQueryPane";
import { SettingsPane } from "../../Panes/SettingsPane/SettingsPane";
import { useDatabases } from "../../useDatabases";
import { SelectedNodeState } from "../../useSelectedNode";

let counter = 0;

export function createStaticCommandBarButtons(
  container: Explorer,
  selectedNodeState: SelectedNodeState
): CommandButtonComponentProps[] {
  if (userContext.authType === AuthType.ResourceToken) {
    return createStaticCommandBarButtonsForResourceToken(container, selectedNodeState);
  }

  const newCollectionBtn = createNewCollectionGroup(container);
  const buttons: CommandButtonComponentProps[] = [];

  buttons.push(newCollectionBtn);

  const addSynapseLink = createOpenSynapseLinkDialogButton(container);
  if (addSynapseLink) {
    buttons.push(createDivider());
    buttons.push(addSynapseLink);
  }

  if (userContext.apiType !== "Tables") {
    newCollectionBtn.children = [createNewCollectionGroup(container)];
    const newDatabaseBtn = createNewDatabase(container);
    newCollectionBtn.children.push(newDatabaseBtn);
  }

  if (useNotebook.getState().isNotebookEnabled) {
    buttons.push(createDivider());
    const notebookButtons: CommandButtonComponentProps[] = [];

    const newNotebookButton = createNewNotebookButton(container);
    newNotebookButton.children = [createNewNotebookButton(container), createuploadNotebookButton(container)];
    notebookButtons.push(newNotebookButton);

    if (container.notebookManager?.gitHubOAuthService) {
      notebookButtons.push(createManageGitHubAccountButton(container));
    }
    if (useNotebook.getState().isPhoenixFeatures && configContext.isTerminalEnabled) {
      notebookButtons.push(createOpenTerminalButton(container));
    }
    if (useNotebook.getState().isPhoenixNotebooks && selectedNodeState.isConnectedToContainer()) {
      notebookButtons.push(createNotebookWorkspaceResetButton(container));
    }
    if (
      (userContext.apiType === "Mongo" &&
        useNotebook.getState().isShellEnabled &&
        selectedNodeState.isDatabaseNodeOrNoneSelected()) ||
      userContext.apiType === "Cassandra"
    ) {
      notebookButtons.push(createDivider());
      if (userContext.apiType === "Cassandra") {
        notebookButtons.push(createOpenCassandraTerminalButton(container));
      } else {
        notebookButtons.push(createOpenMongoTerminalButton(container));
      }
    }

    notebookButtons.forEach((btn) => {
      if (btn.commandButtonLabel.indexOf("Cassandra") !== -1) {
        if (!useNotebook.getState().isPhoenixFeatures) {
          applyNotebooksTemporarilyDownStyle(btn, Constants.Notebook.cassandraShellTemporarilyDownMsg);
        }
      } else if (btn.commandButtonLabel.indexOf("Mongo") !== -1) {
        if (!useNotebook.getState().isPhoenixFeatures) {
          applyNotebooksTemporarilyDownStyle(btn, Constants.Notebook.mongoShellTemporarilyDownMsg);
        }
      } else if (!useNotebook.getState().isPhoenixNotebooks) {
        applyNotebooksTemporarilyDownStyle(btn, Constants.Notebook.temporarilyDownMsg);
      }
      buttons.push(btn);
    });
  }

  if (!selectedNodeState.isDatabaseNodeOrNoneSelected()) {
    const isQuerySupported = userContext.apiType === "SQL" || userContext.apiType === "Gremlin";

    if (isQuerySupported) {
      buttons.push(createDivider());
      const newSqlQueryBtn = createNewSQLQueryButton(selectedNodeState);
      buttons.push(newSqlQueryBtn);
    }

    if (isQuerySupported && selectedNodeState.findSelectedCollection()) {
      const openQueryBtn = createOpenQueryButton(container);
      openQueryBtn.children = [createOpenQueryButton(container), createOpenQueryFromDiskButton()];
      buttons.push(openQueryBtn);
    }

    if (areScriptsSupported()) {
      const label = "New Stored Procedure";
      const newStoredProcedureBtn: CommandButtonComponentProps = {
        iconSrc: AddStoredProcedureIcon,
        iconAlt: label,
        onCommandClick: () => {
          const selectedCollection: ViewModels.Collection = selectedNodeState.findSelectedCollection();
          selectedCollection && selectedCollection.onNewStoredProcedureClick(selectedCollection);
        },
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: true,
        disabled: selectedNodeState.isDatabaseNodeOrNoneSelected(),
      };

      newStoredProcedureBtn.children = createScriptCommandButtons(selectedNodeState);
      buttons.push(newStoredProcedureBtn);
    }
  }

  return buttons;
}

export function createContextCommandBarButtons(
  container: Explorer,
  selectedNodeState: SelectedNodeState
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

  return buttons;
}

export function createControlCommandBarButtons(container: Explorer): CommandButtonComponentProps[] {
  const buttons: CommandButtonComponentProps[] = [
    {
      iconSrc: SettingsIcon,
      iconAlt: "Settings",
      onCommandClick: () => useSidePanel.getState().openSidePanel("Settings", <SettingsPane />),
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

  if (configContext.platform !== Platform.Emulator) {
    const label = "Feedback";
    const feedbackButtonOptions: CommandButtonComponentProps = {
      iconSrc: FeedbackIcon,
      iconAlt: label,
      onCommandClick: () => container.provideFeedbackEmail(),
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
  return userContext.apiType === "SQL" || userContext.apiType === "Gremlin";
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
    disabled: useNotebook.getState().isSynapseLinkUpdating,
    ariaLabel: label,
  };
}

function createNewDatabase(container: Explorer): CommandButtonComponentProps {
  const label = "New " + getDatabaseName();
  return {
    iconSrc: AddDatabaseIcon,
    iconAlt: label,
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
      onCommandClick: () => {
        const selectedCollection: ViewModels.Collection = selectedNodeState.findSelectedCollection();
        selectedCollection && selectedCollection.onNewStoredProcedureClick(selectedCollection);
      },
      commandButtonLabel: label,
      ariaLabel: label,
      hasPopup: true,
      disabled: selectedNodeState.isDatabaseNodeOrNoneSelected(),
    };
    buttons.push(newStoredProcedureBtn);
  }

  if (shouldEnableScriptsCommands) {
    const label = "New UDF";
    const newUserDefinedFunctionBtn: CommandButtonComponentProps = {
      iconSrc: AddUdfIcon,
      iconAlt: label,
      onCommandClick: () => {
        const selectedCollection: ViewModels.Collection = selectedNodeState.findSelectedCollection();
        selectedCollection && selectedCollection.onNewUserDefinedFunctionClick(selectedCollection);
      },
      commandButtonLabel: label,
      ariaLabel: label,
      hasPopup: true,
      disabled: selectedNodeState.isDatabaseNodeOrNoneSelected(),
    };
    buttons.push(newUserDefinedFunctionBtn);
  }

  if (shouldEnableScriptsCommands) {
    const label = "New Trigger";
    const newTriggerBtn: CommandButtonComponentProps = {
      iconSrc: AddTriggerIcon,
      iconAlt: label,
      onCommandClick: () => {
        const selectedCollection: ViewModels.Collection = selectedNodeState.findSelectedCollection();
        selectedCollection && selectedCollection.onNewTriggerClick(selectedCollection);
      },
      commandButtonLabel: label,
      ariaLabel: label,
      hasPopup: true,
      disabled: selectedNodeState.isDatabaseNodeOrNoneSelected(),
    };
    buttons.push(newTriggerBtn);
  }

  return buttons;
}

function applyNotebooksTemporarilyDownStyle(buttonProps: CommandButtonComponentProps, tooltip: string): void {
  if (!buttonProps.isDivider) {
    buttonProps.disabled = true;
    buttonProps.tooltipText = tooltip;
  }
}

function createNewNotebookButton(container: Explorer): CommandButtonComponentProps {
  const label = "New Notebook";
  return {
    id: "newNotebookBtn",
    iconSrc: NewNotebookIcon,
    iconAlt: label,
    onCommandClick: () => container.onNewNotebookClicked(),
    commandButtonLabel: label,
    hasPopup: false,
    disabled: false,
    ariaLabel: label,
  };
}

function createuploadNotebookButton(container: Explorer): CommandButtonComponentProps {
  const label = "Upload to Notebook Server";
  return {
    iconSrc: NewNotebookIcon,
    iconAlt: label,
    onCommandClick: () => container.openUploadFilePanel(),
    commandButtonLabel: label,
    hasPopup: false,
    disabled: false,
    ariaLabel: label,
  };
}

function createOpenQueryButton(container: Explorer): CommandButtonComponentProps {
  const label = "Open Query";
  return {
    iconSrc: BrowseQueriesIcon,
    iconAlt: label,
    onCommandClick: () =>
      useSidePanel.getState().openSidePanel("Open Saved Queries", <BrowseQueriesPane explorer={container} />),
    commandButtonLabel: label,
    ariaLabel: label,
    hasPopup: true,
    disabled: false,
  };
}

function createOpenQueryFromDiskButton(): CommandButtonComponentProps {
  const label = "Open Query From Disk";
  return {
    iconSrc: OpenQueryFromDiskIcon,
    iconAlt: label,
    onCommandClick: () => useSidePanel.getState().openSidePanel("Load Query", <LoadQueryPane />),
    commandButtonLabel: label,
    ariaLabel: label,
    hasPopup: true,
    disabled: false,
  };
}

function createOpenTerminalButton(container: Explorer): CommandButtonComponentProps {
  const label = "Open Terminal";
  return {
    iconSrc: CosmosTerminalIcon,
    iconAlt: label,
    onCommandClick: () => container.openNotebookTerminal(ViewModels.TerminalKind.Default),
    commandButtonLabel: label,
    hasPopup: false,
    disabled: false,
    ariaLabel: label,
  };
}

function createOpenMongoTerminalButton(container: Explorer): CommandButtonComponentProps {
  const label = "Open Mongo Shell";
  const tooltip =
    "This feature is not yet available in your account's region. View supported regions here: https://aka.ms/cosmos-enable-notebooks.";
  const disableButton =
    !useNotebook.getState().isNotebooksEnabledForAccount && !useNotebook.getState().isNotebookEnabled;
  return {
    iconSrc: HostedTerminalIcon,
    iconAlt: label,
    onCommandClick: () => {
      if (useNotebook.getState().isNotebookEnabled) {
        container.openNotebookTerminal(ViewModels.TerminalKind.Mongo);
      }
    },
    commandButtonLabel: label,
    hasPopup: false,
    disabled: disableButton,
    ariaLabel: label,
    tooltipText: !disableButton ? "" : tooltip,
  };
}

function createOpenCassandraTerminalButton(container: Explorer): CommandButtonComponentProps {
  const label = "Open Cassandra Shell";
  const tooltip =
    "This feature is not yet available in your account's region. View supported regions here: https://aka.ms/cosmos-enable-notebooks.";
  const disableButton =
    !useNotebook.getState().isNotebooksEnabledForAccount && !useNotebook.getState().isNotebookEnabled;
  return {
    iconSrc: HostedTerminalIcon,
    iconAlt: label,
    onCommandClick: () => {
      if (useNotebook.getState().isNotebookEnabled) {
        container.openNotebookTerminal(ViewModels.TerminalKind.Cassandra);
      }
    },
    commandButtonLabel: label,
    hasPopup: false,
    disabled: disableButton,
    ariaLabel: label,
    tooltipText: !disableButton ? "" : tooltip,
  };
}

function createNotebookWorkspaceResetButton(container: Explorer): CommandButtonComponentProps {
  const label = "Reset Workspace";
  return {
    iconSrc: ResetWorkspaceIcon,
    iconAlt: label,
    onCommandClick: () => container.resetNotebookWorkspace(),
    commandButtonLabel: label,
    hasPopup: false,
    disabled: false,
    ariaLabel: label,
  };
}

function createManageGitHubAccountButton(container: Explorer): CommandButtonComponentProps {
  const connectedToGitHub: boolean = container.notebookManager?.gitHubOAuthService.isLoggedIn();
  const label = connectedToGitHub ? "Manage GitHub settings" : "Connect to GitHub";
  const junoClient = new JunoClient();
  return {
    iconSrc: GitHubIcon,
    iconAlt: label,
    onCommandClick: () => {
      useSidePanel
        .getState()
        .openSidePanel(
          label,
          <GitHubReposPanel
            explorer={container}
            gitHubClientProp={container.notebookManager.gitHubClient}
            junoClientProp={junoClient}
          />
        );
    },
    commandButtonLabel: label,
    hasPopup: false,
    disabled: false,
    ariaLabel: label,
  };
}

function createStaticCommandBarButtonsForResourceToken(
  container: Explorer,
  selectedNodeState: SelectedNodeState
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
