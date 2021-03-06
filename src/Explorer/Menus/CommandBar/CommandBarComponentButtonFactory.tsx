import * as ViewModels from "../../../Contracts/ViewModels";
import { Action, ActionModifiers } from "../../../Shared/Telemetry/TelemetryConstants";
import { Areas } from "../../../Common/Constants";
import * as TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";

import AddDatabaseIcon from "../../../../images/AddDatabase.svg";
import AddCollectionIcon from "../../../../images/AddCollection.svg";
import AddSqlQueryIcon from "../../../../images/AddSqlQuery_16x16.svg";
import BrowseQueriesIcon from "../../../../images/BrowseQuery.svg";
import * as Constants from "../../../Common/Constants";
import OpenInTabIcon from "../../../../images/open-in-tab.svg";
import OpenQueryFromDiskIcon from "../../../../images/OpenQueryFromDisk.svg";
import CosmosTerminalIcon from "../../../../images/Cosmos-Terminal.svg";
import HostedTerminalIcon from "../../../../images/Hosted-Terminal.svg";
import AddStoredProcedureIcon from "../../../../images/AddStoredProcedure.svg";
import SettingsIcon from "../../../../images/settings_15x15.svg";
import AddUdfIcon from "../../../../images/AddUdf.svg";
import AddTriggerIcon from "../../../../images/AddTrigger.svg";
import FeedbackIcon from "../../../../images/Feedback-Command.svg";
import EnableNotebooksIcon from "../../../../images/notebook/Notebook-enable.svg";
import NewNotebookIcon from "../../../../images/notebook/Notebook-new.svg";
import ResetWorkspaceIcon from "../../../../images/notebook/Notebook-reset-workspace.svg";
import GitHubIcon from "../../../../images/github.svg";
import SynapseIcon from "../../../../images/synapse-link.svg";
import { configContext, Platform } from "../../../ConfigContext";
import Explorer from "../../Explorer";
import { CommandButtonComponentProps } from "../../Controls/CommandButton/CommandButtonComponent";
import * as React from "react";
import { OpenFullScreen } from "../../OpenFullScreen";

let counter = 0;

export function createStaticCommandBarButtons(container: Explorer): CommandButtonComponentProps[] {
  if (container.isAuthWithResourceToken()) {
    return createStaticCommandBarButtonsForResourceToken(container);
  }

  const newCollectionBtn = createNewCollectionGroup(container);
  const buttons: CommandButtonComponentProps[] = [];

  buttons.push(newCollectionBtn);

  const addSynapseLink = createOpenSynapseLinkDialogButton(container);
  if (addSynapseLink) {
    buttons.push(createDivider());
    buttons.push(addSynapseLink);
  }

  if (!container.isPreferredApiTable()) {
    newCollectionBtn.children = [createNewCollectionGroup(container)];
    const newDatabaseBtn = createNewDatabase(container);
    newCollectionBtn.children.push(newDatabaseBtn);
  }

  buttons.push(createDivider());

  if (container.isNotebookEnabled()) {
    const newNotebookButton = createNewNotebookButton(container);
    newNotebookButton.children = [createNewNotebookButton(container), createuploadNotebookButton(container)];
    buttons.push(newNotebookButton);

    if (container.notebookManager?.gitHubOAuthService) {
      buttons.push(createManageGitHubAccountButton(container));
    }
  }

  if (!container.isRunningOnNationalCloud()) {
    if (!container.isNotebookEnabled()) {
      buttons.push(createEnableNotebooksButton(container));
    }

    if (container.isPreferredApiMongoDB()) {
      buttons.push(createOpenMongoTerminalButton(container));
    }

    if (container.isPreferredApiCassandra()) {
      buttons.push(createOpenCassandraTerminalButton(container));
    }
  }

  if (container.isNotebookEnabled()) {
    buttons.push(createOpenTerminalButton(container));

    buttons.push(createNotebookWorkspaceResetButton(container));
  }

  if (!container.isDatabaseNodeOrNoneSelected()) {
    if (container.isNotebookEnabled()) {
      buttons.push(createDivider());
    }

    const isSqlQuerySupported = container.isPreferredApiDocumentDB() || container.isPreferredApiGraph();
    if (isSqlQuerySupported) {
      const newSqlQueryBtn = createNewSQLQueryButton(container);
      buttons.push(newSqlQueryBtn);
    }

    const isSupportedOpenQueryApi =
      container.isPreferredApiDocumentDB() || container.isPreferredApiMongoDB() || container.isPreferredApiGraph();
    const isSupportedOpenQueryFromDiskApi = container.isPreferredApiDocumentDB() || container.isPreferredApiGraph();
    if (isSupportedOpenQueryApi && container.selectedNode() && container.findSelectedCollection()) {
      const openQueryBtn = createOpenQueryButton(container);
      openQueryBtn.children = [createOpenQueryButton(container), createOpenQueryFromDiskButton(container)];
      buttons.push(openQueryBtn);
    } else if (isSupportedOpenQueryFromDiskApi && container.selectedNode() && container.findSelectedCollection()) {
      buttons.push(createOpenQueryFromDiskButton(container));
    }

    if (areScriptsSupported(container)) {
      const label = "New Stored Procedure";
      const newStoredProcedureBtn: CommandButtonComponentProps = {
        iconSrc: AddStoredProcedureIcon,
        iconAlt: label,
        onCommandClick: () => {
          const selectedCollection: ViewModels.Collection = container.findSelectedCollection();
          selectedCollection && selectedCollection.onNewStoredProcedureClick(selectedCollection);
        },
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: true,
        disabled: container.isDatabaseNodeOrNoneSelected(),
      };

      newStoredProcedureBtn.children = createScriptCommandButtons(container);
      buttons.push(newStoredProcedureBtn);
    }
  }

  return buttons;
}

export function createContextCommandBarButtons(container: Explorer): CommandButtonComponentProps[] {
  const buttons: CommandButtonComponentProps[] = [];

  if (!container.isDatabaseNodeOrNoneSelected() && container.isPreferredApiMongoDB()) {
    const label = "New Shell";
    const newMongoShellBtn: CommandButtonComponentProps = {
      iconSrc: HostedTerminalIcon,
      iconAlt: label,
      onCommandClick: () => {
        const selectedCollection: ViewModels.Collection = container.findSelectedCollection();
        selectedCollection && selectedCollection.onNewMongoShellClick();
      },
      commandButtonLabel: label,
      ariaLabel: label,
      hasPopup: true,
      disabled: container.isDatabaseNodeOrNoneSelected() && container.isPreferredApiMongoDB(),
    };
    buttons.push(newMongoShellBtn);
  }

  return buttons;
}

export function createControlCommandBarButtons(container: Explorer): CommandButtonComponentProps[] {
  const buttons: CommandButtonComponentProps[] = [];
  if (configContext.platform === Platform.Hosted) {
    return buttons;
  }

  if (!container.isPreferredApiCassandra()) {
    const label = "Settings";
    const settingsPaneButton: CommandButtonComponentProps = {
      iconSrc: SettingsIcon,
      iconAlt: label,
      onCommandClick: () => container.settingsPane.open(),
      commandButtonLabel: undefined,
      ariaLabel: label,
      tooltipText: label,
      hasPopup: true,
      disabled: false,
    };
    buttons.push(settingsPaneButton);
  }

  if (container.isHostedDataExplorerEnabled()) {
    const label = "Open Full Screen";
    const fullScreenButton: CommandButtonComponentProps = {
      iconSrc: OpenInTabIcon,
      iconAlt: label,
      onCommandClick: () => {
        container.openSidePanel("Open Full Screen", <OpenFullScreen />);
      },
      commandButtonLabel: undefined,
      ariaLabel: label,
      tooltipText: label,
      hasPopup: false,
      disabled: !container.isHostedDataExplorerEnabled(),
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

function areScriptsSupported(container: Explorer): boolean {
  return container.isPreferredApiDocumentDB() || container.isPreferredApiGraph();
}

function createNewCollectionGroup(container: Explorer): CommandButtonComponentProps {
  const label = container.addCollectionText();
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

  if (container.isServerlessEnabled()) {
    return undefined;
  }

  if (
    container.databaseAccount &&
    container.databaseAccount() &&
    container.databaseAccount().properties &&
    container.databaseAccount().properties.enableAnalyticalStorage
  ) {
    return undefined;
  }

  const capabilities =
    (container.databaseAccount &&
      container.databaseAccount() &&
      container.databaseAccount().properties &&
      container.databaseAccount().properties.capabilities) ||
    [];
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
    disabled: container.isSynapseLinkUpdating(),
    ariaLabel: label,
  };
}

function createNewDatabase(container: Explorer): CommandButtonComponentProps {
  const label = container.addDatabaseText();
  return {
    iconSrc: AddDatabaseIcon,
    iconAlt: label,
    onCommandClick: () => {
      container.addDatabasePane.open();
      document.getElementById("linkAddDatabase").focus();
    },
    commandButtonLabel: label,
    ariaLabel: label,
    hasPopup: true,
  };
}

function createNewSQLQueryButton(container: Explorer): CommandButtonComponentProps {
  if (container.isPreferredApiDocumentDB() || container.isPreferredApiGraph()) {
    const label = "New SQL Query";
    return {
      iconSrc: AddSqlQueryIcon,
      iconAlt: label,
      onCommandClick: () => {
        const selectedCollection: ViewModels.Collection = container.findSelectedCollection();
        selectedCollection && selectedCollection.onNewQueryClick(selectedCollection);
      },
      commandButtonLabel: label,
      ariaLabel: label,
      hasPopup: true,
      disabled: container.isDatabaseNodeOrNoneSelected(),
    };
  } else if (container.isPreferredApiMongoDB()) {
    const label = "New Query";
    return {
      iconSrc: AddSqlQueryIcon,
      iconAlt: label,
      onCommandClick: () => {
        const selectedCollection: ViewModels.Collection = container.findSelectedCollection();
        selectedCollection && selectedCollection.onNewMongoQueryClick(selectedCollection);
      },
      commandButtonLabel: label,
      ariaLabel: label,
      hasPopup: true,
      disabled: container.isDatabaseNodeOrNoneSelected(),
    };
  }

  return undefined;
}

export function createScriptCommandButtons(container: Explorer): CommandButtonComponentProps[] {
  const buttons: CommandButtonComponentProps[] = [];

  const shouldEnableScriptsCommands: boolean =
    !container.isDatabaseNodeOrNoneSelected() && areScriptsSupported(container);

  if (shouldEnableScriptsCommands) {
    const label = "New Stored Procedure";
    const newStoredProcedureBtn: CommandButtonComponentProps = {
      iconSrc: AddStoredProcedureIcon,
      iconAlt: label,
      onCommandClick: () => {
        const selectedCollection: ViewModels.Collection = container.findSelectedCollection();
        selectedCollection && selectedCollection.onNewStoredProcedureClick(selectedCollection);
      },
      commandButtonLabel: label,
      ariaLabel: label,
      hasPopup: true,
      disabled: container.isDatabaseNodeOrNoneSelected(),
    };
    buttons.push(newStoredProcedureBtn);
  }

  if (shouldEnableScriptsCommands) {
    const label = "New UDF";
    const newUserDefinedFunctionBtn: CommandButtonComponentProps = {
      iconSrc: AddUdfIcon,
      iconAlt: label,
      onCommandClick: () => {
        const selectedCollection: ViewModels.Collection = container.findSelectedCollection();
        selectedCollection && selectedCollection.onNewUserDefinedFunctionClick(selectedCollection);
      },
      commandButtonLabel: label,
      ariaLabel: label,
      hasPopup: true,
      disabled: container.isDatabaseNodeOrNoneSelected(),
    };
    buttons.push(newUserDefinedFunctionBtn);
  }

  if (shouldEnableScriptsCommands) {
    const label = "New Trigger";
    const newTriggerBtn: CommandButtonComponentProps = {
      iconSrc: AddTriggerIcon,
      iconAlt: label,
      onCommandClick: () => {
        const selectedCollection: ViewModels.Collection = container.findSelectedCollection();
        selectedCollection && selectedCollection.onNewTriggerClick(selectedCollection);
      },
      commandButtonLabel: label,
      ariaLabel: label,
      hasPopup: true,
      disabled: container.isDatabaseNodeOrNoneSelected(),
    };
    buttons.push(newTriggerBtn);
  }

  return buttons;
}

function createNewNotebookButton(container: Explorer): CommandButtonComponentProps {
  const label = "New Notebook";
  return {
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
    onCommandClick: () => container.onUploadToNotebookServerClicked(),
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
    onCommandClick: () => container.browseQueriesPane.open(),
    commandButtonLabel: label,
    ariaLabel: label,
    hasPopup: true,
    disabled: false,
  };
}

function createOpenQueryFromDiskButton(container: Explorer): CommandButtonComponentProps {
  const label = "Open Query From Disk";
  return {
    iconSrc: OpenQueryFromDiskIcon,
    iconAlt: label,
    onCommandClick: () => container.loadQueryPane.open(),
    commandButtonLabel: label,
    ariaLabel: label,
    hasPopup: true,
    disabled: false,
  };
}

function createEnableNotebooksButton(container: Explorer): CommandButtonComponentProps {
  if (configContext.platform === Platform.Emulator) {
    return undefined;
  }
  const label = "Enable Notebooks (Preview)";
  const tooltip =
    "Notebooks are not yet available in your account's region. View supported regions here: https://aka.ms/cosmos-enable-notebooks.";
  const description =
    "Looks like you have not yet created a notebooks workspace for this account. To proceed and start using notebooks, we'll need to create a default notebooks workspace in this account.";
  return {
    iconSrc: EnableNotebooksIcon,
    iconAlt: label,
    onCommandClick: () => container.setupNotebooksPane.openWithTitleAndDescription(label, description),
    commandButtonLabel: label,
    hasPopup: false,
    disabled: !container.isNotebooksEnabledForAccount(),
    ariaLabel: label,
    tooltipText: container.isNotebooksEnabledForAccount() ? "" : tooltip,
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
  const title = "Set up workspace";
  const description =
    "Looks like you have not created a workspace for this account. To proceed and start using features including mongo shell and notebook, we will need to create a default workspace in this account.";
  const disableButton = !container.isNotebooksEnabledForAccount() && !container.isNotebookEnabled();
  return {
    iconSrc: HostedTerminalIcon,
    iconAlt: label,
    onCommandClick: () => {
      if (container.isNotebookEnabled()) {
        container.openNotebookTerminal(ViewModels.TerminalKind.Mongo);
      } else {
        container.setupNotebooksPane.openWithTitleAndDescription(title, description);
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
  const title = "Set up workspace";
  const description =
    "Looks like you have not created a workspace for this account. To proceed and start using features including cassandra shell and notebook, we will need to create a default workspace in this account.";
  const disableButton = !container.isNotebooksEnabledForAccount() && !container.isNotebookEnabled();
  return {
    iconSrc: HostedTerminalIcon,
    iconAlt: label,
    onCommandClick: () => {
      if (container.isNotebookEnabled()) {
        container.openNotebookTerminal(ViewModels.TerminalKind.Cassandra);
      } else {
        container.setupNotebooksPane.openWithTitleAndDescription(title, description);
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
  return {
    iconSrc: GitHubIcon,
    iconAlt: label,
    onCommandClick: () => {
      if (!connectedToGitHub) {
        TelemetryProcessor.trace(Action.NotebooksGitHubConnect, ActionModifiers.Mark, {
          dataExplorerArea: Areas.Notebook,
        });
      }
      container.gitHubReposPane.open();
    },
    commandButtonLabel: label,
    hasPopup: false,
    disabled: false,
    ariaLabel: label,
  };
}

function createStaticCommandBarButtonsForResourceToken(container: Explorer): CommandButtonComponentProps[] {
  const newSqlQueryBtn = createNewSQLQueryButton(container);
  const openQueryBtn = createOpenQueryButton(container);

  newSqlQueryBtn.disabled = !container.isResourceTokenCollectionNodeSelected();
  newSqlQueryBtn.onCommandClick = () => {
    const resourceTokenCollection: ViewModels.CollectionBase = container.resourceTokenCollection();
    resourceTokenCollection && resourceTokenCollection.onNewQueryClick(resourceTokenCollection, undefined);
  };

  openQueryBtn.disabled = !container.isResourceTokenCollectionNodeSelected();
  if (!openQueryBtn.disabled) {
    openQueryBtn.children = [createOpenQueryButton(container), createOpenQueryFromDiskButton(container)];
  }

  return [newSqlQueryBtn, openQueryBtn];
}
