import { Spinner, SpinnerSize } from "@fluentui/react";
import { MessageTypes } from "Contracts/ExplorerContracts";
import { QuickstartFirewallNotification } from "Explorer/Quickstart/QuickstartFirewallNotification";
import { CloudShellTerminalComponent } from "Explorer/Tabs/CloudShellTab/CloudShellTerminalComponent";
import * as React from "react";
import FirewallRuleScreenshot from "../../../../images/firewallRule.png";
import VcoreFirewallRuleScreenshot from "../../../../images/vcoreMongoFirewallRule.png";
import { ReactAdapter } from "../../../Bindings/ReactBindingHandler";
import * as DataModels from "../../../Contracts/DataModels";
import * as ViewModels from "../../../Contracts/ViewModels";

/**
 * CloudShell terminal tab
 */
export class CloudShellTerminalComponentAdapter implements ReactAdapter {
  // parameters: true: show, false: hide
  public parameters: ko.Computed<boolean>;
  constructor(
    private getDatabaseAccount: () => DataModels.DatabaseAccount,
    private getTabId: () => string,
    private getUsername: () => string,
    private isAllPublicIPAddressesEnabled: ko.Observable<boolean>,
    private kind: ViewModels.TerminalKind,
  ) {}

  public renderComponent(): JSX.Element {
    if (!this.isAllPublicIPAddressesEnabled()) {
      return (
        <QuickstartFirewallNotification
          messageType={MessageTypes.OpenPostgresNetworkingBlade}
          screenshot={
            this.kind === ViewModels.TerminalKind.Mongo || this.kind === ViewModels.TerminalKind.VCoreMongo
              ? VcoreFirewallRuleScreenshot
              : FirewallRuleScreenshot
          }
          shellName={this.getShellNameForDisplay(this.kind)}
        />
      );
    }

    return this.parameters() ? (
      <CloudShellTerminalComponent
        databaseAccount={this.getDatabaseAccount()}
        tabId={this.getTabId()}
        shellType={this.kind}
        username={this.getUsername()}
      />
    ) : (
      <Spinner styles={{ root: { marginTop: 10 } }} size={SpinnerSize.large}></Spinner>
    );
  }

  private getShellNameForDisplay(terminalKind: ViewModels.TerminalKind): string {
    switch (terminalKind) {
      case ViewModels.TerminalKind.Postgres:
        return "PostgreSQL";
      case ViewModels.TerminalKind.Mongo:
      case ViewModels.TerminalKind.VCoreMongo:
        return "MongoDB";
      default:
        return "";
    }
  }
}
