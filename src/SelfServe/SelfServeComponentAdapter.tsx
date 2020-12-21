/**
 * This adapter is responsible to render the React component
 * If the component signals a change through the callback passed in the properties, it must render the React component when appropriate
 * and update any knockout observables passed from the parent.
 */
import * as ko from "knockout";
import * as React from "react";
import { ReactAdapter } from "../Bindings/ReactBindingHandler";
import Explorer from "../Explorer/Explorer";
import { Descriptor, SmartUiComponent } from "../Explorer/Controls/SmartUi/SmartUiComponent";
import { SelfServeTypes } from "./SelfServeUtils";
import { SqlX } from "./SqlX/SqlX";

export class SelfServeComponentAdapter implements ReactAdapter {
  public parameters: ko.Observable<number>;
  public container: Explorer;

  constructor(container: Explorer) {
    this.container = container;
    this.parameters = ko.observable(Date.now());
    this.container.selfServeType.subscribe(() => {this.triggerRender()})
  }

  private getDescriptor = (selfServeType : SelfServeTypes) : Descriptor => {
    switch (selfServeType) {
      case SelfServeTypes.sqlx:
        return SqlX.toSmartUiDescriptor()
      default:
        return undefined;
    }
  }
  
  public renderComponent(): JSX.Element {
    const selfServeType = this.container.selfServeType()
    console.log("type:" + selfServeType)
    const smartUiDescriptor = this.getDescriptor(selfServeType)

  
    const element = smartUiDescriptor ?
      <SmartUiComponent descriptor={smartUiDescriptor} /> :
      <h1>Invalid self serve type!</h1>
  
  
    return element
  }

  private triggerRender() {
    window.requestAnimationFrame(() => this.parameters(Date.now()));
  }
}
