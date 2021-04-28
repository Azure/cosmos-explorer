/**
 * Custom binding to make it easy to insert a React component.
 * Mounts the react component and renders when needed.
 *
 * Usage:
 * 1) Implement ReactAdapter:
 *  parameters: pass any parameters including Knockout Observable's.
 *  render(): render your ReactComponent here.
 *
 * 2) In the markup, add this:
 * <div data-bind="react:myAdapter"></div>
 */
import * as ko from "knockout";
import * as ReactDOM from "react-dom";

export interface ReactAdapter {
  parameters: any;
  renderComponent: () => JSX.Element;
  setElement?: (elt: Element) => void;
}

export class Registerer {
  public static register(): void {
    ko.bindingHandlers.react = {
      init: (element: any, wrappedValueAccessor: () => any) => {
        const adapter: ReactAdapter = wrappedValueAccessor();

        if (adapter.setElement) {
          adapter.setElement(element);
        }

        // If any of the ko observable change inside parameters, trigger a new render.
        ko.computed(() => ko.toJSON(adapter.parameters)).subscribe(() =>
          ReactDOM.render(adapter.renderComponent(), element)
        );

        // Initial rendering at mount point
        ReactDOM.render(adapter.renderComponent(), element);
      },
    } as ko.BindingHandler;
  }
}
