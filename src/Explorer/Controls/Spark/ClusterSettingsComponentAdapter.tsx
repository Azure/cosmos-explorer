import * as React from "react";
import { ClusterSettingsComponent, ClusterSettingsComponentProps } from "./ClusterSettingsComponent";
import { ReactAdapter } from "../../../Bindings/ReactBindingHandler";

export class ClusterSettingsComponentAdapter implements ReactAdapter {
  public parameters: ko.Observable<ClusterSettingsComponentProps>;

  public renderComponent(): JSX.Element {
    return <ClusterSettingsComponent {...this.parameters()} />;
  }
}
