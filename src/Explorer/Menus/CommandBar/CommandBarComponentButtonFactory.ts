import * as ViewModels from "../../../Contracts/ViewModels";
import { PlatformType } from "../../../PlatformType";
import { Action, ActionModifiers } from "../../../Shared/Telemetry/TelemetryConstants";
import { Areas } from "../../../Common/Constants";
import TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";

import ApacheSparkIcon from "../../../../images/notebook/Apache-spark.svg";
import AddDatabaseIcon from "../../../../images/AddDatabase.svg";
import AddCollectionIcon from "../../../../images/AddCollection.svg";
import AddSqlQueryIcon from "../../../../images/AddSqlQuery_16x16.svg";
import BrowseQueriesIcon from "../../../../images/BrowseQuery.svg";
import * as Constants from "../../../Common/Constants";
import DeleteIcon from "../../../../images/delete.svg";
import EditIcon from "../../../../images/edit.svg";
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
import LibraryManageIcon from "../../../../images/notebook/Spark-library-manage.svg";
import GitHubIcon from "../../../../images/github.svg";
import SynapseIcon from "../../../../images/synapse-link.svg";
import { config, Platform } from "../../../Config";

export class CommandBarComponentButtonFactory {
  private static counter: number = 0;

  public static createStaticCommandBarButtons(container: ViewModels.Explorer): ViewModels.NavbarButtonConfig[] {
    if (container.isAuthWithResourceToken()) {
      return CommandBarComponentButtonFactory.createStaticCommandBarButtonsForResourceToken(container);
    }

    const newCollectionBtn = CommandBarComponentButtonFactory.createNewCollectionGroup(container);
    const buttons: ViewModels.NavbarButtonConfig[] = [newCollectionBtn];

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
        CommandBarComponentButtonFactory.createuploadNotebookButton(container)
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

    // TODO: Should be replaced with the create arcadia spark pool button
    // if (!container.isSparkEnabled() && container.isSparkEnabledForAccount()) {
    //   const createSparkClusterButton = CommandBarComponentButtonFactory.createSparkClusterButton(container);
    //   buttons.push(createSparkClusterButton);
    // }

    // TODO: Should be replaced with the edit/manage/delete arcadia spark pool button
    // if (container.isSparkEnabled()) {
    //   const manageSparkClusterButton = CommandBarComponentButtonFactory.createMonitorClusterButton(container);
    //   manageSparkClusterButton.children = [
    //     CommandBarComponentButtonFactory.createMonitorClusterButton(container),
    //     CommandBarComponentButtonFactory.createEditClusterButton(container),
    //     CommandBarComponentButtonFactory.createDeleteClusterButton(container),
    //     CommandBarComponentButtonFactory.createLibraryManageButton(container),
    //     CommandBarComponentButtonFactory.createClusterLibraryButton(container)
    //   ];
    //   buttons.push(manageSparkClusterButton);
    // }

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
          CommandBarComponentButtonFactory.createOpenQueryFromDiskButton(container)
        ];
        buttons.push(openQueryBtn);
      } else if (isSupportedOpenQueryFromDiskApi && container.selectedNode() && container.findSelectedCollection()) {
        buttons.push(CommandBarComponentButtonFactory.createOpenQueryFromDiskButton(container));
      }

      if (CommandBarComponentButtonFactory.areScriptsSupported(container)) {
        const label = "New Stored Procedure";
        const newStoredProcedureBtn: ViewModels.NavbarButtonConfig = {
          iconSrc: AddStoredProcedureIcon,
          iconAlt: label,
          onCommandClick: () => {
            const selectedCollection: ViewModels.Collection = container.findSelectedCollection();
            selectedCollection && selectedCollection.onNewStoredProcedureClick(selectedCollection, null);
          },
          commandButtonLabel: label,
          ariaLabel: label,
          hasPopup: true,
          disabled: container.isDatabaseNodeOrNoneSelected()
        };

        newStoredProcedureBtn.children = CommandBarComponentButtonFactory.createScriptCommandButtons(container);
        buttons.push(newStoredProcedureBtn);
      }
    }

    return buttons;
  }

  public static createContextCommandBarButtons(container: ViewModels.Explorer): ViewModels.NavbarButtonConfig[] {
    const buttons: ViewModels.NavbarButtonConfig[] = [];

    if (!container.isDatabaseNodeOrNoneSelected() && container.isPreferredApiMongoDB()) {
      const label = "New Shell";
      const newMongoShellBtn: ViewModels.NavbarButtonConfig = {
        iconSrc: HostedTerminalIcon,
        iconAlt: label,
        onCommandClick: () => {
          const selectedCollection: ViewModels.Collection = container.findSelectedCollection();
          selectedCollection && (<any>selectedCollection).onNewMongoShellClick();
        },
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: true,
        disabled: container.isDatabaseNodeOrNoneSelected() && container.isPreferredApiMongoDB()
      };
      buttons.push(newMongoShellBtn);
    }

    return buttons;
  }

  public static createControlCommandBarButtons(container: ViewModels.Explorer): ViewModels.NavbarButtonConfig[] {
    const buttons: ViewModels.NavbarButtonConfig[] = [];
    if (window.dataExplorerPlatform === PlatformType.Hosted) {
      return buttons;
    }

    if (!container.isPreferredApiCassandra()) {
      const label = "Settings";
      const settingsPaneButton: ViewModels.NavbarButtonConfig = {
        iconSrc: SettingsIcon,
        iconAlt: label,
        onCommandClick: () => container.settingsPane.open(),
        commandButtonLabel: null,
        ariaLabel: label,
        tooltipText: label,
        hasPopup: true,
        disabled: false
      };
      buttons.push(settingsPaneButton);
    }

    if (container.isHostedDataExplorerEnabled()) {
      const label = "Open Full Screen";
      const fullScreenButton: ViewModels.NavbarButtonConfig = {
        iconSrc: OpenInTabIcon,
        iconAlt: label,
        onCommandClick: () => container.generateSharedAccessData(),
        commandButtonLabel: null,
        ariaLabel: label,
        tooltipText: label,
        hasPopup: false,
        disabled: !container.isHostedDataExplorerEnabled(),
        className: "OpenFullScreen"
      };
      buttons.push(fullScreenButton);
    }

    if (!container.hasOwnProperty("isEmulator") || !container.isEmulator) {
      const label = "Feedback";
      const feedbackButtonOptions: ViewModels.NavbarButtonConfig = {
        iconSrc: FeedbackIcon,
        iconAlt: label,
        onCommandClick: () => container.provideFeedbackEmail(),
        commandButtonLabel: null,
        ariaLabel: label,
        tooltipText: label,
        hasPopup: false,
        disabled: false
      };
      buttons.push(feedbackButtonOptions);
    }

    return buttons;
  }

  public static createDivider(): ViewModels.NavbarButtonConfig {
    const label = `divider${CommandBarComponentButtonFactory.counter++}`;
    return {
      isDivider: true,
      commandButtonLabel: label,
      hasPopup: false,
      iconSrc: null,
      iconAlt: null,
      onCommandClick: null,
      ariaLabel: label
    };
  }

  private static areScriptsSupported(container: ViewModels.Explorer): boolean {
    return container.isPreferredApiDocumentDB() || container.isPreferredApiGraph();
  }

  private static createNewCollectionGroup(container: ViewModels.Explorer): ViewModels.NavbarButtonConfig {
    const label = container.addCollectionText();
    return {
      iconSrc: AddCollectionIcon,
      iconAlt: label,
      onCommandClick: () => container.onNewCollectionClicked(),
      commandButtonLabel: label,
      ariaLabel: label,
      hasPopup: true,
      id: "createNewContainerCommandButton"
    };
  }

  private static createOpenSynapseLinkDialogButton(container: ViewModels.Explorer): ViewModels.NavbarButtonConfig {
    if (config.platform === Platform.Emulator) {
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
    if (capabilities.some(capability => capability.name === Constants.CapabilityNames.EnableStorageAnalytics)) {
      return null;
    }

    const label = "Enable Azure Synapse Link (Preview)";
    return {
      iconSrc: SynapseIcon,
      iconAlt: label,
      onCommandClick: () => container.openEnableSynapseLinkDialog(),
      commandButtonLabel: label,
      hasPopup: false,
      disabled: container.isSynapseLinkUpdating(),
      ariaLabel: label
    };
  }

  private static createNewDatabase(container: ViewModels.Explorer): ViewModels.NavbarButtonConfig {
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
      hasPopup: true
    };
  }

  private static createNewSQLQueryButton(container: ViewModels.Explorer): ViewModels.NavbarButtonConfig {
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
        disabled: container.isDatabaseNodeOrNoneSelected()
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
        disabled: container.isDatabaseNodeOrNoneSelected()
      };
    }

    return null;
  }

  public static createScriptCommandButtons(container: ViewModels.Explorer): ViewModels.NavbarButtonConfig[] {
    const buttons: ViewModels.NavbarButtonConfig[] = [];

    const shouldEnableScriptsCommands: boolean =
      !container.isDatabaseNodeOrNoneSelected() && CommandBarComponentButtonFactory.areScriptsSupported(container);

    if (shouldEnableScriptsCommands) {
      const label = "New Stored Procedure";
      const newStoredProcedureBtn: ViewModels.NavbarButtonConfig = {
        iconSrc: AddStoredProcedureIcon,
        iconAlt: label,
        onCommandClick: () => {
          const selectedCollection: ViewModels.Collection = container.findSelectedCollection();
          selectedCollection && selectedCollection.onNewStoredProcedureClick(selectedCollection, null);
        },
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: true,
        disabled: container.isDatabaseNodeOrNoneSelected()
      };
      buttons.push(newStoredProcedureBtn);
    }

    if (shouldEnableScriptsCommands) {
      const label = "New UDF";
      const newUserDefinedFunctionBtn: ViewModels.NavbarButtonConfig = {
        iconSrc: AddUdfIcon,
        iconAlt: label,
        onCommandClick: () => {
          const selectedCollection: ViewModels.Collection = container.findSelectedCollection();
          selectedCollection && selectedCollection.onNewUserDefinedFunctionClick(selectedCollection, null);
        },
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: true,
        disabled: container.isDatabaseNodeOrNoneSelected()
      };
      buttons.push(newUserDefinedFunctionBtn);
    }

    if (shouldEnableScriptsCommands) {
      const label = "New Trigger";
      const newTriggerBtn: ViewModels.NavbarButtonConfig = {
        iconSrc: AddTriggerIcon,
        iconAlt: label,
        onCommandClick: () => {
          const selectedCollection: ViewModels.Collection = container.findSelectedCollection();
          selectedCollection && selectedCollection.onNewTriggerClick(selectedCollection, null);
        },
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: true,
        disabled: container.isDatabaseNodeOrNoneSelected()
      };
      buttons.push(newTriggerBtn);
    }

    return buttons;
  }

  private static createScaleAndSettingsButton(container: ViewModels.Explorer): ViewModels.NavbarButtonConfig {
    let isShared = false;
    if (container.isDatabaseNodeSelected()) {
      isShared = container.findSelectedDatabase().isDatabaseShared();
    } else if (container.isNodeKindSelected("Collection")) {
      const database: ViewModels.Database = container.findSelectedCollection().getDatabase();
      isShared = database && database.isDatabaseShared();
    }

    const label = isShared ? "Settings" : "Scale & Settings";

    return {
      iconSrc: ScaleIcon,
      iconAlt: label,
      onCommandClick: () => {
        const selectedCollection: ViewModels.Collection = container.findSelectedCollection();
        selectedCollection && (<any>selectedCollection).onSettingsClick();
      },
      commandButtonLabel: label,
      ariaLabel: label,
      hasPopup: true,
      disabled: container.isDatabaseNodeOrNoneSelected()
    };
  }

  private static createNewNotebookButton(container: ViewModels.Explorer): ViewModels.NavbarButtonConfig {
    const label = "New Notebook";
    return {
      iconSrc: NewNotebookIcon,
      iconAlt: label,
      onCommandClick: () => container.onNewNotebookClicked(),
      commandButtonLabel: label,
      hasPopup: false,
      disabled: false,
      ariaLabel: label
    };
  }

  private static createuploadNotebookButton(container: ViewModels.Explorer): ViewModels.NavbarButtonConfig {
    const label = "Upload to Notebook Server";
    return {
      iconSrc: NewNotebookIcon,
      iconAlt: label,
      onCommandClick: () => container.onUploadToNotebookServerClicked(),
      commandButtonLabel: label,
      hasPopup: false,
      disabled: false,
      ariaLabel: label
    };
  }

  private static createOpenQueryButton(container: ViewModels.Explorer): ViewModels.NavbarButtonConfig {
    const label = "Open Query";
    return {
      iconSrc: BrowseQueriesIcon,
      iconAlt: label,
      onCommandClick: () => container.browseQueriesPane.open(),
      commandButtonLabel: label,
      ariaLabel: label,
      hasPopup: true,
      disabled: false
    };
  }

  private static createOpenQueryFromDiskButton(container: ViewModels.Explorer): ViewModels.NavbarButtonConfig {
    const label = "Open Query From Disk";
    return {
      iconSrc: OpenQueryFromDiskIcon,
      iconAlt: label,
      onCommandClick: () => container.loadQueryPane.open(),
      commandButtonLabel: label,
      ariaLabel: label,
      hasPopup: true,
      disabled: false
    };
  }

  private static createEnableNotebooksButton(container: ViewModels.Explorer): ViewModels.NavbarButtonConfig {
    if (config.platform === Platform.Emulator) {
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
      tooltipText: container.isNotebooksEnabledForAccount() ? "" : tooltip
    };
  }

  private static createSparkClusterButton(container: ViewModels.Explorer): ViewModels.NavbarButtonConfig {
    const label = "Enable Spark";
    return {
      iconSrc: ApacheSparkIcon,
      iconAlt: "Enable spark icon",
      onCommandClick: () => container.setupSparkClusterPane.open(),
      commandButtonLabel: label,
      hasPopup: false,
      disabled: false,
      ariaLabel: label
    };
  }

  private static createEditClusterButton(container: ViewModels.Explorer): ViewModels.NavbarButtonConfig {
    const label = "Edit Cluster";
    return {
      iconSrc: EditIcon,
      iconAlt: "Edit cluster icon",
      onCommandClick: () => container.manageSparkClusterPane.open(),
      commandButtonLabel: label,
      hasPopup: false,
      disabled: false,
      ariaLabel: label
    };
  }

  private static createDeleteClusterButton(container: ViewModels.Explorer): ViewModels.NavbarButtonConfig {
    const label = "Delete Cluster";
    return {
      iconSrc: DeleteIcon,
      iconAlt: "Delete cluster icon",
      onCommandClick: () => container.deleteCluster(),
      commandButtonLabel: label,
      hasPopup: false,
      disabled: false,
      ariaLabel: label
    };
  }

  private static createMonitorClusterButton(container: ViewModels.Explorer): ViewModels.NavbarButtonConfig {
    const label = "Monitor Cluster";
    return {
      iconSrc: ApacheSparkIcon,
      iconAlt: "Monitor cluster icon",
      onCommandClick: () => container.openSparkMasterTab(),
      commandButtonLabel: label,
      hasPopup: false,
      disabled: false,
      ariaLabel: label
    };
  }

  private static createOpenTerminalButton(container: ViewModels.Explorer): ViewModels.NavbarButtonConfig {
    const label = "Open Terminal";
    return {
      iconSrc: CosmosTerminalIcon,
      iconAlt: label,
      onCommandClick: () => container.openNotebookTerminal(ViewModels.TerminalKind.Default),
      commandButtonLabel: label,
      hasPopup: false,
      disabled: false,
      ariaLabel: label
    };
  }

  private static createOpenMongoTerminalButton(container: ViewModels.Explorer): ViewModels.NavbarButtonConfig {
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
      tooltipText: !disableButton ? "" : tooltip
    };
  }

  private static createOpenCassandraTerminalButton(container: ViewModels.Explorer): ViewModels.NavbarButtonConfig {
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
      tooltipText: !disableButton ? "" : tooltip
    };
  }

  private static createNotebookWorkspaceResetButton(container: ViewModels.Explorer): ViewModels.NavbarButtonConfig {
    const label = "Reset Workspace";
    return {
      iconSrc: ResetWorkspaceIcon,
      iconAlt: label,
      onCommandClick: () => container.resetNotebookWorkspace(),
      commandButtonLabel: label,
      hasPopup: false,
      disabled: false,
      ariaLabel: label
    };
  }

  private static createManageGitHubAccountButton(container: ViewModels.Explorer): ViewModels.NavbarButtonConfig {
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
            dataExplorerArea: Areas.Notebook
          });
        }
        container.gitHubReposPane.open();
      },
      commandButtonLabel: label,
      hasPopup: false,
      disabled: false,
      ariaLabel: label
    };
  }

  private static createLibraryManageButton(container: ViewModels.Explorer): ViewModels.NavbarButtonConfig {
    const label = "Manage Libraries";
    return {
      iconSrc: LibraryManageIcon,
      iconAlt: label,
      onCommandClick: () => container.libraryManagePane.open(),
      commandButtonLabel: label,
      hasPopup: false,
      disabled: false,
      ariaLabel: label
    };
  }

  private static createClusterLibraryButton(container: ViewModels.Explorer): ViewModels.NavbarButtonConfig {
    const label = "Manage Cluster Libraries";
    return {
      iconSrc: LibraryManageIcon,
      iconAlt: label,
      onCommandClick: () => container.clusterLibraryPane.open(),
      commandButtonLabel: label,
      hasPopup: false,
      disabled: false,
      ariaLabel: label
    };
  }

  private static createStaticCommandBarButtonsForResourceToken(
    container: ViewModels.Explorer
  ): ViewModels.NavbarButtonConfig[] {
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
        CommandBarComponentButtonFactory.createOpenQueryFromDiskButton(container)
      ];
    }

    return [newSqlQueryBtn, openQueryBtn];
  }
}
