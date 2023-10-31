import { createScriptCommandButtons } from "Explorer/Menus/CommandBar/CommandButtonsFactories/createScriptCommandButtons";
import * as Constants from "../../../../Common/Constants";
import { configContext } from "../../../../ConfigContext";
import * as ViewModels from "../../../../Contracts/ViewModels";
import { userContext } from "../../../../UserContext";
import AddStoredProcedureIcon from "../../../../images/AddStoredProcedure.svg";
import { CommandButtonComponentProps } from "../../../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../../../Explorer";
import { useNotebook } from "../../../Notebook/useNotebook";
import { SelectedNodeState, useSelectedNode } from "../../../useSelectedNode";
import { applyNotebooksTemporarilyDownStyle } from "./applyNotebooksTemporarilyDownStyle";
import { areScriptsSupported } from "./areScriptsSupported";
import { createDivider } from "./createDivider";
import { createManageGitHubAccountButton } from "./createManageGitHubAccountButton";
import { createNewCollectionGroup } from "./createNewCollectionGroup";
import { createNewDatabase } from "./createNewDatabase";
import { createNewNotebookButton } from "./createNewNotebookButton";
import { createNewSQLQueryButton } from "./createNewSQLQueryButton";
import { createNotebookWorkspaceResetButton } from "./createNotebookWorkspaceResetButton";
import { createOpenCassandraTerminalButton } from "./createOpenCassandraTerminalButton";
import { createOpenMongoTerminalButton } from "./createOpenMongoTerminalButton";
import { createOpenQueryButton } from "./createOpenQueryButton";
import { createOpenQueryFromDiskButton } from "./createOpenQueryFromDiskButton";
import { createOpenSynapseLinkDialogButton } from "./createOpenSynapseLinkDialogButton";
import { createOpenTerminalButton } from "./createOpenTerminalButton";
import { createuploadNotebookButton } from "./createuploadNotebookButton";

export function createStaticCommandBarButtons(
  container: Explorer,
  selectedNodeState: SelectedNodeState
): CommandButtonComponentProps[] {
  const newCollectionBtn = createNewCollectionGroup(container);
  const buttons: CommandButtonComponentProps[] = [];

  buttons.push(newCollectionBtn);
  if (userContext.apiType !== "Tables" && userContext.apiType !== "Cassandra") {
    const addSynapseLink = createOpenSynapseLinkDialogButton(container);

    if (addSynapseLink) {
      buttons.push(createDivider());
      buttons.push(addSynapseLink);
    }
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
      } else if (btn.commandButtonLabel.indexOf("Open Terminal") !== -1) {
        if (!useNotebook.getState().isPhoenixFeatures) {
          applyNotebooksTemporarilyDownStyle(btn, Constants.Notebook.temporarilyDownMsg);
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
