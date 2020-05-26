/**
 * This adapter is responsible to render the Dialog React component
 * If the component signals a change through the callback passed in the properties, it must render the React component when appropriate
 * and update any knockout observables passed from the parent.
 */
import * as React from "react";
import { DialogComponent, DialogProps } from "./DialogComponent";
import { ReactAdapter } from "../../../Bindings/ReactBindingHandler";

export class DialogComponentAdapter implements ReactAdapter {
  public parameters: ko.Observable<DialogProps>;

  public renderComponent(): JSX.Element {
    return <DialogComponent {...this.parameters()} />;
  }
}
