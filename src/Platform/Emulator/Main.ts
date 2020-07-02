import * as ViewModels from "../../Contracts/ViewModels";
import EmulatorExplorerFactory from "./ExplorerFactory";

export function initializeExplorer(): ViewModels.Explorer {
  const explorer = EmulatorExplorerFactory.createExplorer();
  return explorer;
}
