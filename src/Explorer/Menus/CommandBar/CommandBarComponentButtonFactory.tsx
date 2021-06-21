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
import EnableNotebooksIcon from "../../../../images/notebook/Notebook-enable.svg";
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
import { userContext } from "../../../UserContext";
import { getCollectionName, getDatabaseName } from "../../../Utils/APITypeUtils";
import { isServerlessAccount } from "../../../Utils/CapabilityUtils";
import { isRunningOnNationalCloud } from "../../../Utils/CloudUtils";
import { CommandButtonComponentProps } from "../../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../../Explorer";
import { OpenFullScreen } from "../../OpenFullScreen";
import { BrowseQueriesPane } from "../../Panes/BrowseQueriesPane/BrowseQueriesPane";
import { LoadQueryPane } from "../../Panes/LoadQueryPane/LoadQueryPane";
import { SettingsPane } from "../../Panes/SettingsPane/SettingsPane";
import { SetupNoteBooksPanel } from "../../Panes/SetupNotebooksPanel/SetupNotebooksPanel";

let counter = 0;

export function createStaticCommandBarButtons(container: Explorer): CommandButtonComponentProps[] {
  if (userContext.authType === AuthType.ResourceToken) {
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

  if (userContext.apiType !== "Tables") {
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

    buttons.push(createOpenTerminalButton(container));

    buttons.push(createNotebookWorkspaceResetButton(container));
    if (
      (userContext.apiType === "Mongo" && container.isShellEnabled() && container.isDatabaseNodeOrNoneSelected()) ||
      userContext.apiType === "Cassandra"
    ) {
      buttons.push(createDivider());
      if (userContext.apiType === "Cassandra") {
        buttons.push(createOpenCassandraTerminalButton(container));
      } else {
        buttons.push(createOpenMongoTerminalButton(container));
      }
    }
  } else {
    if (!isRunningOnNationalCloud()) {
      buttons.push(createEnableNotebooksButton(container));
    }
  }

  if (!container.isDatabaseNodeOrNoneSelected()) {
    const isQuerySupported = userContext.apiType === "SQL" || userContext.apiType === "Gremlin";

    if (isQuerySupported) {
      buttons.push(createDivider());
      const newSqlQueryBtn = createNewSQLQueryButton(container);
      buttons.push(newSqlQueryBtn);
    }

    if (isQuerySupported && container.selectedNode() && container.findSelectedCollection()) {
      const openQueryBtn = createOpenQueryButton(container);
      openQueryBtn.children = [createOpenQueryButton(container), createOpenQueryFromDiskButton(container)];
      buttons.push(openQueryBtn);
    }

    if (areScriptsSupported()) {
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

  if (!container.isDatabaseNodeOrNoneSelected() && userContext.apiType === "Mongo") {
    const label = container.isShellEnabled() ? "Open Mongo Shell" : "New Shell";
    const newMongoShellBtn: CommandButtonComponentProps = {
      iconSrc: HostedTerminalIcon,
      iconAlt: label,
      onCommandClick: () => {
        const selectedCollection: ViewModels.Collection = container.findSelectedCollection();
        if (container.isShellEnabled()) {
          container.openNotebookTerminal(ViewModels.TerminalKind.Mongo);
        } else {
          selectedCollection && selectedCollection.onNewMongoShellClick();
        }
      },
      commandButtonLabel: label,
      ariaLabel: label,
      hasPopup: true,
      disabled: container.isDatabaseNodeOrNoneSelected() && userContext.apiType === "Mongo",
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

  if (isServerlessAccount()) {
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
    disabled: container.isSynapseLinkUpdating(),
    ariaLabel: label,
  };
}

function createNewDatabase(container: Explorer): CommandButtonComponentProps {
  const label = "New " + getDatabaseName();
  return {
    iconSrc: AddDatabaseIcon,
    iconAlt: label,
    onCommandClick: () => {
      container.openAddDatabasePane();
    },
    commandButtonLabel: label,
    ariaLabel: label,
    hasPopup: true,
  };
}

function createNewSQLQueryButton(container: Explorer): CommandButtonComponentProps {
  if (userContext.apiType === "SQL" || userContext.apiType === "Gremlin") {
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
  } else if (userContext.apiType === "Mongo") {
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

  const shouldEnableScriptsCommands: boolean = !container.isDatabaseNodeOrNoneSelected() && areScriptsSupported();

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

function createOpenQueryFromDiskButton(container: Explorer): CommandButtonComponentProps {
  const label = "Open Query From Disk";
  return {
    iconSrc: OpenQueryFromDiskIcon,
    iconAlt: label,
    onCommandClick: () => useSidePanel.getState().openSidePanel("Load Query", <LoadQueryPane explorer={container} />),
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
    onCommandClick: () =>
      useSidePanel
        .getState()
        .openSidePanel(
          label,
          <SetupNoteBooksPanel explorer={container} panelTitle={label} panelDescription={description} />
        ),
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
        useSidePanel
          .getState()
          .openSidePanel(
            title,
            <SetupNoteBooksPanel explorer={container} panelTitle={title} panelDescription={description} />
          );
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
        useSidePanel
          .getState()
          .openSidePanel(
            title,
            <SetupNoteBooksPanel explorer={container} panelTitle={title} panelDescription={description} />
          );
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
    onCommandClick: () => container.openGitHubReposPanel(label),
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
