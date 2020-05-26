import * as React from "react";
import { ReactAdapter } from "../../../Bindings/ReactBindingHandler";
import { LibraryManageComponent, LibraryManageComponentProps } from "./LibraryManage";

export class LibraryManageComponentAdapter implements ReactAdapter {
  public parameters: ko.Observable<LibraryManageComponentProps>;

  public renderComponent(): JSX.Element {
    return <LibraryManageComponent {...this.parameters()} />;
  }
}
