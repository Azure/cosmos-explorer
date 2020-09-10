import ko from "knockout";
import * as React from "react";
import { ReactAdapter } from "../../../Bindings/ReactBindingHandler";
import { QueryComponent, QueryComponentProps } from "./QueryComponent";

export class QueryComponentAdapter implements ReactAdapter {
  public parameters: ko.Observable<number>;

  constructor(private props: QueryComponentProps) {
    this.parameters = ko.observable<number>(Date.now());
    console.log("adapter intiialized")
  }

  public renderComponent(): JSX.Element {
    return <QueryComponent {...this.props} />;
  }

  public triggerRender(): void {
    window.requestAnimationFrame(() => this.parameters(Date.now()));
  }
}