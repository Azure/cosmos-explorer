import * as ko from "knockout";
import { BindingHandlersRegisterer } from "./Bindings/BindingHandlersRegisterer";
import Explorer from "./Explorer/Explorer";

export const applyExplorerBindings = (explorer: Explorer) => {
  if (explorer) {
    window.dataExplorer = explorer;
    BindingHandlersRegisterer.registerBindingHandlers();
    ko.applyBindings(explorer);
  }
};
