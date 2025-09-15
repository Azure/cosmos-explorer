import { Spinner, SpinnerSize } from "@fluentui/react";
import { MessageTypes } from "Contracts/ExplorerContracts";
import { QuickstartFirewallNotification } from "Explorer/Quickstart/QuickstartFirewallNotification";
import { getShellNameForDisplay } from "Explorer/Tabs/CloudShellTab/Utils/CommonUtils";
import * as React from "react";
import FirewallRuleScreenshot from "../../../../images/firewallRule.png";
import { ReactAdapter } from "../../../Bindings/ReactBindingHandler";
import * as DataModels from "../../../Contracts/DataModels";
import * as ViewModels from "../../../Contracts/ViewModels";

/**
 * Base terminal component adapter
 */
export abstract class BaseTerminalComponentAdapter implements ReactAdapter {
  // parameters: true: show, false: hide
  public parameters: ko.Computed<boolean>;

  constructor(
    protected getDatabaseAccount: () => DataModels.DatabaseAccount,
    protected getTabId: () => string,
    protected getUsername: () => string,
    protected isAllPublicIPAddressesEnabled: ko.Observable<boolean>,
    protected kind: ViewModels.TerminalKind,
  ) {}

  public renderComponent(): JSX.Element {
    if (this.kind === ViewModels.TerminalKind.Mongo || this.kind === ViewModels.TerminalKind.VCoreMongo) {
      return this.renderTerminalComponent();
    }

    if (!this.isAllPublicIPAddressesEnabled()) {
      return (
        <QuickstartFirewallNotification
          messageType={this.getMessageType()}
          screenshot={FirewallRuleScreenshot}
          shellName={getShellNameForDisplay(this.kind)}
        />
      );
    }

    return this.parameters() ? (
      this.renderTerminalComponent()
    ) : (
      <Spinner styles={{ root: { marginTop: 10 } }} size={SpinnerSize.large}></Spinner>
    );
  }

  private getMessageType(): MessageTypes {
    switch (this.kind) {
      case ViewModels.TerminalKind.Postgres:
        return MessageTypes.OpenPostgresNetworkingBlade;
      case ViewModels.TerminalKind.Mongo:
      case ViewModels.TerminalKind.VCoreMongo:
        return MessageTypes.OpenVCoreMongoNetworkingBlade;
      default:
        return MessageTypes.OpenPostgresNetworkingBlade;
    }
  }

  protected abstract renderTerminalComponent(): JSX.Element;
}
