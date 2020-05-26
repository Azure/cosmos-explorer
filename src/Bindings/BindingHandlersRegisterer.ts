import * as ko from "knockout";
import * as ReactBindingHandler from "./ReactBindingHandler";

interface RestorePoint {
  readonly element: JQuery;
  readonly width: number;
}

export class BindingHandlersRegisterer {
  public static registerBindingHandlers() {
    ko.bindingHandlers.setTemplateReady = {
      init(
        element: any,
        wrappedValueAccessor: () => any,
        allBindings?: ko.AllBindings,
        viewModel?: any,
        bindingContext?: ko.BindingContext
      ) {
        const value = ko.unwrap(wrappedValueAccessor());
        bindingContext.$data.isTemplateReady(value);
      }
    } as ko.BindingHandler;

    ReactBindingHandler.Registerer.register();
  }
}
