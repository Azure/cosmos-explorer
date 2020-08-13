import EmulatorExplorerFactory from "./ExplorerFactory";
import Explorer from "../../Explorer/Explorer";

export function initializeExplorer(): Explorer {
  return EmulatorExplorerFactory.createExplorer();
}
