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
import ScaleIcon from "../../../../images/Scale_15x15.svg";
import FeedbackIcon from "../../../../images/Feedback-Command.svg";
import EnableNotebooksIcon from "../../../../images/notebook/Notebook-enable.svg";
import NewNotebookIcon from "../../../../images/notebook/Notebook-new.svg";
import ResetWorkspaceIcon from "../../../../images/notebook/Notebook-reset-workspace.svg";
import GitHubIcon from "../../../../images/github.svg";
import SynapseIcon from "../../../../images/synapse-link.svg";
import { configContext, Platform } from "../../../ConfigContext";
import Explorer from "../../Explorer";
import { CommandButtonComponentProps } from "../../Controls/CommandButton/CommandButtonComponent";

export class CommandBarComponentButtonFactory {
  private static counter: number = 0;

  public static createStaticCommandBarButtons(container: Explorer): CommandButtonComponentProps[] {
    if (container.isAuthWithResourceToken()) {
      return CommandBarComponentButtonFactory.createStaticCommandBarButtonsForResourceToken(container);
    }

    const newCollectionBtn = CommandBarComponentButtonFactory.createNewCollectionGroup(container);
    const buttons: CommandButtonComponentProps[] = [];

    if (container.isFeatureEnabled("regionselectbutton")) {
      const regions = [{ name: "West US" }, { name: "East US" }, { name: "North Europe" }];
      buttons.push({
        iconSrc: null,
        onCommandClick: () => {},
        commandButtonLabel: null,
        hasPopup: false,
        isDropdown: true,
        dropdownPlaceholder: "West US",
        dropdownSelectedKey: "West US",
        dropdownWidth: 100,
        children: regions.map(
          (region) =>
            ({
              iconSrc: null,
              onCommandClick: () => {},
              commandButtonLabel: region.name,
              dropdownItemKey: region.name,
              hasPopup: false,
              disabled: false,
              ariaLabel: "",
            } as CommandButtonComponentProps)
        ),
        ariaLabel: "",
      });
    }

    buttons.push(newCollectionBtn);

    const addSynapseLink = CommandBarComponentButtonFactory.createOpenSynapseLinkDialogButton(container);
    if (addSynapseLink) {
      buttons.push(CommandBarComponentButtonFactory.createDivider());
      buttons.push(addSynapseLink);
    }

    if (!container.isPreferredApiTable()) {
      newCollectionBtn.children = [CommandBarComponentButtonFactory.createNewCollectionGroup(container)];
      const newDatabaseBtn = CommandBarComponentButtonFactory.createNewDatabase(container);
      newCollectionBtn.children.push(newDatabaseBtn);
    }

    buttons.push(CommandBarComponentButtonFactory.createDivider());

    if (container.isNotebookEnabled()) {
      const newNotebookButton = CommandBarComponentButtonFactory.createNewNotebookButton(container);
      newNotebookButton.children = [
        CommandBarComponentButtonFactory.createNewNotebookButton(container),
        CommandBarComponentButtonFactory.createuploadNotebookButton(container),
      ];
      buttons.push(newNotebookButton);

      if (container.notebookManager?.gitHubOAuthService) {
        buttons.push(CommandBarComponentButtonFactory.createManageGitHubAccountButton(container));
      }
    }

    if (!container.isRunningOnNationalCloud()) {
      if (!container.isNotebookEnabled()) {
        buttons.push(CommandBarComponentButtonFactory.createEnableNotebooksButton(container));
      }

      if (container.isPreferredApiMongoDB()) {
        buttons.push(CommandBarComponentButtonFactory.createOpenMongoTerminalButton(container));
      }

      if (container.isPreferredApiCassandra()) {
        buttons.push(CommandBarComponentButtonFactory.createOpenCassandraTerminalButton(container));
      }
    }

    if (container.isNotebookEnabled()) {
      buttons.push(CommandBarComponentButtonFactory.createOpenTerminalButton(container));

      buttons.push(CommandBarComponentButtonFactory.createNotebookWorkspaceResetButton(container));
    }

    if (!container.isDatabaseNodeOrNoneSelected()) {
      if (container.isNotebookEnabled()) {
        buttons.push(CommandBarComponentButtonFactory.createDivider());
      }

      const isSqlQuerySupported = container.isPreferredApiDocumentDB() || container.isPreferredApiGraph();
      if (isSqlQuerySupported) {
        const newSqlQueryBtn = CommandBarComponentButtonFactory.createNewSQLQueryButton(container);
        buttons.push(newSqlQueryBtn);
      }

      const isSupportedOpenQueryApi =
        container.isPreferredApiDocumentDB() || container.isPreferredApiMongoDB() || container.isPreferredApiGraph();
      const isSupportedOpenQueryFromDiskApi = container.isPreferredApiDocumentDB() || container.isPreferredApiGraph();
      if (isSupportedOpenQueryApi && container.selectedNode() && container.findSelectedCollection()) {
        const openQueryBtn = CommandBarComponentButtonFactory.createOpenQueryButton(container);
        openQueryBtn.children = [
          CommandBarComponentButtonFactory.createOpenQueryButton(container),
          CommandBarComponentButtonFactory.createOpenQueryFromDiskButton(container),
        ];
        buttons.push(openQueryBtn);
      } else if (isSupportedOpenQueryFromDiskApi && container.selectedNode() && container.findSelectedCollection()) {
        buttons.push(CommandBarComponentButtonFactory.createOpenQueryFromDiskButton(container));
      }

      if (CommandBarComponentButtonFactory.areScriptsSupported(container)) {
        const label = "New Stored Procedure";
        const newStoredProcedureBtn: CommandButtonComponentProps = {
          iconSrc: AddStoredProcedureIcon,
          iconAlt: label,
          onCommandClick: () => {
            const selectedCollection: ViewModels.Collection = container.findSelectedCollection();
            selectedCollection && selectedCollection.onNewStoredProcedureClick(selectedCollection, null);
          },
          commandButtonLabel: label,
          ariaLabel: label,
          hasPopup: true,
          disabled: container.isDatabaseNodeOrNoneSelected(),
        };

        newStoredProcedureBtn.children = CommandBarComponentButtonFactory.createScriptCommandButtons(container);
        buttons.push(newStoredProcedureBtn);
      }
    }

    return buttons;
  }

  public static createContextCommandBarButtons(container: Explorer): CommandButtonComponentProps[] {
    const buttons: CommandButtonComponentProps[] = [];

    if (!container.isDatabaseNodeOrNoneSelected() && container.isPreferredApiMongoDB()) {
      const label = "New Shell";
      const newMongoShellBtn: CommandButtonComponentProps = {
        iconSrc: HostedTerminalIcon,
        iconAlt: label,
        onCommandClick: () => {
          const selectedCollection: ViewModels.Collection = container.findSelectedCollection();
          selectedCollection && (<any>selectedCollection).onNewMongoShellClick();
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

  public static createControlCommandBarButtons(container: Explorer): CommandButtonComponentProps[] {
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
        commandButtonLabel: null,
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
        onCommandClick: () => container.generateSharedAccessData(),
        commandButtonLabel: null,
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
        commandButtonLabel: null,
        ariaLabel: label,
        tooltipText: label,
        hasPopup: false,
        disabled: false,
      };
      buttons.push(feedbackButtonOptions);
    }

    return buttons;
  }

  public static createDivider(): CommandButtonComponentProps {
    const label = `divider${CommandBarComponentButtonFactory.counter++}`;
    return {
      isDivider: true,
      commandButtonLabel: label,
      hasPopup: false,
      iconSrc: null,
      iconAlt: null,
      onCommandClick: null,
      ariaLabel: label,
    };
  }

  private static areScriptsSupported(container: Explorer): boolean {
    return container.isPreferredApiDocumentDB() || container.isPreferredApiGraph();
  }

  private static createNewCollectionGroup(container: Explorer): CommandButtonComponentProps {
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

  private static createOpenSynapseLinkDialogButton(container: Explorer): CommandButtonComponentProps {
    if (configContext.platform === Platform.Emulator) {
      return null;
    }

    if (container.isServerlessEnabled()) {
      return null;
    }

    if (
      container.databaseAccount &&
      container.databaseAccount() &&
      container.databaseAccount().properties &&
      container.databaseAccount().properties.enableAnalyticalStorage
    ) {
      return null;
    }

    const capabilities =
      (container.databaseAccount &&
        container.databaseAccount() &&
        container.databaseAccount().properties &&
        container.databaseAccount().properties.capabilities) ||
      [];
    if (capabilities.some((capability) => capability.name === Constants.CapabilityNames.EnableStorageAnalytics)) {
      return null;
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

  private static createNewDatabase(container: Explorer): CommandButtonComponentProps {
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

  private static createNewSQLQueryButton(container: Explorer): CommandButtonComponentProps {
    if (container.isPreferredApiDocumentDB() || container.isPreferredApiGraph()) {
      const label = "New SQL Query";
      return {
        iconSrc: AddSqlQueryIcon,
        iconAlt: label,
        onCommandClick: () => {
          const selectedCollection: ViewModels.Collection = container.findSelectedCollection();
          selectedCollection && selectedCollection.onNewQueryClick(selectedCollection, null);
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
          selectedCollection && (<any>selectedCollection).onNewMongoQueryClick(selectedCollection, null);
        },
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: true,
        disabled: container.isDatabaseNodeOrNoneSelected(),
      };
    }

    return null;
  }

  public static createScriptCommandButtons(container: Explorer): CommandButtonComponentProps[] {
    const buttons: CommandButtonComponentProps[] = [];

    const shouldEnableScriptsCommands: boolean =
      !container.isDatabaseNodeOrNoneSelected() && CommandBarComponentButtonFactory.areScriptsSupported(container);

    if (shouldEnableScriptsCommands) {
      const label = "New Stored Procedure";
      const newStoredProcedureBtn: CommandButtonComponentProps = {
        iconSrc: AddStoredProcedureIcon,
        iconAlt: label,
        onCommandClick: () => {
          const selectedCollection: ViewModels.Collection = container.findSelectedCollection();
          selectedCollection && selectedCollection.onNewStoredProcedureClick(selectedCollection, null);
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
          selectedCollection && selectedCollection.onNewUserDefinedFunctionClick(selectedCollection, null);
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
          selectedCollection && selectedCollection.onNewTriggerClick(selectedCollection, null);
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

  private static createNewNotebookButton(container: Explorer): CommandButtonComponentProps {
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

  private static createuploadNotebookButton(container: Explorer): CommandButtonComponentProps {
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

  private static createOpenQueryButton(container: Explorer): CommandButtonComponentProps {
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

  private static createOpenQueryFromDiskButton(container: Explorer): CommandButtonComponentProps {
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

  private static createEnableNotebooksButton(container: Explorer): CommandButtonComponentProps {
    if (configContext.platform === Platform.Emulator) {
      return null;
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

  private static createOpenTerminalButton(container: Explorer): CommandButtonComponentProps {
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

  private static createOpenMongoTerminalButton(container: Explorer): CommandButtonComponentProps {
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

  private static createOpenCassandraTerminalButton(container: Explorer): CommandButtonComponentProps {
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

  private static createNotebookWorkspaceResetButton(container: Explorer): CommandButtonComponentProps {
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

  private static createManageGitHubAccountButton(container: Explorer): CommandButtonComponentProps {
    let connectedToGitHub: boolean = container.notebookManager?.gitHubOAuthService.isLoggedIn();
    const label = connectedToGitHub ? "Manage GitHub settings" : "Connect to GitHub";
    return {
      iconSrc: GitHubIcon,
      iconAlt: label,
      onCommandClick: () => {
        if (!connectedToGitHub) {
          TelemetryProcessor.trace(Action.NotebooksGitHubConnect, ActionModifiers.Mark, {
            databaseAccountName: container.databaseAccount() && container.databaseAccount().name,
            defaultExperience: container.defaultExperience && container.defaultExperience(),
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

  private static createStaticCommandBarButtonsForResourceToken(container: Explorer): CommandButtonComponentProps[] {
    const newSqlQueryBtn = CommandBarComponentButtonFactory.createNewSQLQueryButton(container);
    const openQueryBtn = CommandBarComponentButtonFactory.createOpenQueryButton(container);

    newSqlQueryBtn.disabled = !container.isResourceTokenCollectionNodeSelected();
    newSqlQueryBtn.onCommandClick = () => {
      const resourceTokenCollection: ViewModels.CollectionBase = container.resourceTokenCollection();
      resourceTokenCollection && resourceTokenCollection.onNewQueryClick(resourceTokenCollection, undefined);
    };

    openQueryBtn.disabled = !container.isResourceTokenCollectionNodeSelected();
    if (!openQueryBtn.disabled) {
      openQueryBtn.children = [
        CommandBarComponentButtonFactory.createOpenQueryButton(container),
        CommandBarComponentButtonFactory.createOpenQueryFromDiskButton(container),
      ];
    }

    return [newSqlQueryBtn, openQueryBtn];
  }
}
