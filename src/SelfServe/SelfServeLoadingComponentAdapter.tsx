/**
 * This adapter is responsible to render the React component
 * If the component signals a change through the callback passed in the properties, it must render the React component when appropriate
 * and update any knockout observables passed from the parent.
 */
import * as ko from "knockout";
import { Spinner, SpinnerSize } from "office-ui-fabric-react";
import * as React from "react";
import { ReactAdapter } from "../Bindings/ReactBindingHandler";

export class SelfServeLoadingComponentAdapter implements ReactAdapter {
  public parameters: ko.Observable<number>;

  constructor() {
    this.parameters = ko.observable(Date.now());
  }

  public renderComponent(): JSX.Element {
    return <Spinner size={SpinnerSize.large} />;
  }

  private triggerRender() {
    window.requestAnimationFrame(() => this.parameters(Date.now()));
  }
}
