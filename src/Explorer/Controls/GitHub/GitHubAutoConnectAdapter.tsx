import ko from "knockout";
import * as React from "react";
import { ReactAdapter } from "../../../Bindings/ReactBindingHandler";
import { GitHubAutoConnectComponentProps, GitHubAutoConnectComponent } from "./GitHubAutoConnectComponent";

export class GitHubAutoConnectAdapter implements ReactAdapter {
  public parameters: ko.Observable<number>;

  constructor(private props: GitHubAutoConnectComponentProps) {
    this.parameters = ko.observable<number>(Date.now());
  }

  public renderComponent(): JSX.Element {
    return <GitHubAutoConnectComponent {...this.props} />;
  }

  public triggerRender(): void {
    window.requestAnimationFrame(() => this.parameters(Date.now()));
  }
}
