import ko from "knockout";
import * as React from "react";
import { ReactAdapter } from "../../../Bindings/ReactBindingHandler";
import { SettingsComponent, SettingsComponentProps } from "./SettingsComponent";

export class SettingsComponentAdapter implements ReactAdapter {
  public parameters: ko.Observable<number>;

  constructor(private props: SettingsComponentProps) {
    this.parameters = ko.observable<number>(Date.now());
  }

  public renderComponent(): JSX.Element {
    return <SettingsComponent {...this.props} />;
  }

  public triggerRender(): void {
    window.requestAnimationFrame(() => this.parameters(Date.now()));
  }
}
