import * as Constants from "../../../../Common/Constants";
import { Platform, configContext } from "../../../../ConfigContext";
import { userContext } from "../../../../UserContext";
import SynapseIcon from "../../../../images/synapse-link.svg";
import { CommandButtonComponentProps } from "../../../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../../../Explorer";
import { useNotebook } from "../../../Notebook/useNotebook";
import { useSelectedNode } from "../../../useSelectedNode";

export function createOpenSynapseLinkDialogButton(container: Explorer): CommandButtonComponentProps {
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
