import * as React from "react";
import { JunoClient } from "../../../../Juno/JunoClient";
import { useSidePanel } from "../../../../hooks/useSidePanel";
import GitHubIcon from "../../../../images/github.svg";
import { CommandButtonComponentProps } from "../../../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../../../Explorer";
import { GitHubReposPanel } from "../../../Panes/GitHubReposPanel/GitHubReposPanel";
import { useSelectedNode } from "../../../useSelectedNode";

export function createManageGitHubAccountButton(container: Explorer): CommandButtonComponentProps {
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
    disabled: useSelectedNode.getState().isQueryCopilotCollectionSelected(),
    ariaLabel: label,
  };
}
