import * as ko from "knockout";
import { BindingHandlersRegisterer } from "./Bindings/BindingHandlersRegisterer";
import Explorer from "./Explorer/Explorer";

export const applyExplorerBindings = (explorer: Explorer) => {
  if (!!explorer) {
    window.dataExplorer = explorer;
    BindingHandlersRegisterer.registerBindingHandlers();
    ko.applyBindings(explorer);
    // This message should ideally be sent immediately after explorer has been initialized for optimal data explorer load times.
    // TODO: Send another message to describe that the bindings have been applied, and handle message transfers accordingly in the portal
    $("#divExplorer").show();
  }
};
