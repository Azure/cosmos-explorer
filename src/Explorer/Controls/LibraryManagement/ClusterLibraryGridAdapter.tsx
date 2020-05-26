import * as React from "react";
import { ReactAdapter } from "../../../Bindings/ReactBindingHandler";
import { ClusterLibraryGrid, ClusterLibraryGridProps } from "./ClusterLibraryGrid";

export class ClusterLibraryGridAdapter implements ReactAdapter {
  public parameters: ko.Observable<ClusterLibraryGridProps>;

  public renderComponent(): JSX.Element {
    return <ClusterLibraryGrid {...this.parameters()} />;
  }
}
