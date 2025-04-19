import { Spinner, SpinnerSize } from "@fluentui/react";
import { MessageTypes } from "Contracts/ExplorerContracts";
import { NotebookTerminalComponent } from "Explorer/Controls/Notebook/NotebookTerminalComponent";
import { QuickstartFirewallNotification } from "Explorer/Quickstart/QuickstartFirewallNotification";
import * as React from "react";
import { ReactAdapter } from "../../../Bindings/ReactBindingHandler";
import * as DataModels from "../../../Contracts/DataModels";
import * as ViewModels from "../../../Contracts/ViewModels";
import FirewallRuleScreenshot from "../../../../images/firewallRule.png";
import VcoreFirewallRuleScreenshot from "../../../../images/vcoreMongoFirewallRule.png";

/**
 * Notebook terminal tab
 */
export class NotebookTerminalComponentAdapter implements ReactAdapter {
  // parameters: true: show, false: hide
  public parameters: ko.Computed<boolean>;
  constructor(
    private getNotebookServerInfo: () => DataModels.NotebookWorkspaceConnectionInfo,
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
      <NotebookTerminalComponent
        notebookServerInfo={this.getNotebookServerInfo()}
        databaseAccount={this.getDatabaseAccount()}
        tabId={this.getTabId()}
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
