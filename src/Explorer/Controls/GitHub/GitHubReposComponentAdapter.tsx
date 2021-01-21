import ko from "knockout";
import * as React from "react";
import { ReactAdapter } from "../../../Bindings/ReactBindingHandler";
import { GitHubReposComponent, GitHubReposComponentProps } from "./GitHubReposComponent";

export class GitHubReposComponentAdapter implements ReactAdapter {
  public parameters: ko.Observable<number>;

  constructor(private props: GitHubReposComponentProps) {
    this.parameters = ko.observable<number>(Date.now());
  }

  public renderComponent(): JSX.Element {
    return <GitHubReposComponent {...this.props} />;
  }

  public triggerRender(): void {
    window.requestAnimationFrame(() => this.parameters(Date.now()));
  }
}
