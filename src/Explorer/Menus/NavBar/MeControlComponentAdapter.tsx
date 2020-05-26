/**
 * This adapter is responsible to render the React component
 * If the component signals a change through the callback passed in the properties, it must render the React component when appropriate
 * and update any knockout observables passed from the parent.
 */
import * as React from "react";
import { ReactAdapter } from "../../../Bindings/ReactBindingHandler";
import { MeControlComponent, MeControlComponentProps } from "./MeControlComponent";

export class MeControlComponentAdapter implements ReactAdapter {
  public parameters: ko.Observable<MeControlComponentProps>;

  public renderComponent(): JSX.Element {
    return <MeControlComponent {...this.parameters()} />;
  }
}
