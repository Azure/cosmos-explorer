import ko from "knockout";
import * as React from "react";
import { ReactAdapter } from "../../../Bindings/ReactBindingHandler";
import { PublishNotebookComponentProps, PublishNotebookComponent } from "./PublishNotebookComponent";

export class PublishNotebookComponentAdapter implements ReactAdapter {
  public parameters: ko.Observable<number>;

  constructor(private props: PublishNotebookComponentProps) {
    this.parameters = ko.observable<number>(Date.now());
  }

  public renderComponent(): JSX.Element {
    return <PublishNotebookComponent {...this.props} />;
  }

  public triggerRender(): void {
    window.requestAnimationFrame(() => this.parameters(Date.now()));
  }
}
