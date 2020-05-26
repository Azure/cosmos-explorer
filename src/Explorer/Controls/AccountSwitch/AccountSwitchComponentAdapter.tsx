import * as React from "react";
import { ReactAdapter } from "../../../Bindings/ReactBindingHandler";
import { AccountSwitchComponent, AccountSwitchComponentProps } from "./AccountSwitchComponent";

export class AccountSwitchComponentAdapter implements ReactAdapter {
  public parameters: ko.Observable<AccountSwitchComponentProps>;

  public renderComponent(): JSX.Element {
    return <AccountSwitchComponent {...this.parameters()} />;
  }
}
