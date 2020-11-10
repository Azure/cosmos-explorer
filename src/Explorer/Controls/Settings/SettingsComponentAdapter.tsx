import ko from "knockout";
import * as React from "react";
import { ReactAdapter } from "../../../Bindings/ReactBindingHandler";
import { SettingsComponent, SettingsComponentProps } from "./SettingsComponent";

export class SettingsComponentAdapter implements ReactAdapter {
  public parameters: ko.Computed<boolean>;

  constructor(private props: SettingsComponentProps) {}

  public renderComponent(): JSX.Element {
    return this.parameters() ? <SettingsComponent {...this.props} /> : <></>;
  }
}
