import { BindingHandlersRegisterer } from "./Bindings/BindingHandlersRegisterer";
import { sendMessage } from "./Common/MessageHandler";
import * as ko from "knockout";
import Explorer from "./Explorer/Explorer";

export const applyExplorerBindings = (explorer: Explorer) => {
  if (!!explorer) {
    // This message should ideally be sent immediately after explorer has been initialized for optimal data explorer load times.
    // TODO: Send another message to describe that the bindings have been applied, and handle message transfers accordingly in the portal
    sendMessage("ready");
    window.dataExplorer = explorer;
    BindingHandlersRegisterer.registerBindingHandlers();
    ko.applyBindings(explorer);
    $("#divExplorer").show();
  }
};
