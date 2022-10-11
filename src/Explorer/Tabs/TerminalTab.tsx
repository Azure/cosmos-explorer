import { Spinner, SpinnerSize } from "@fluentui/react";
import { configContext } from "ConfigContext";
import { QuickstartFirewallNotification } from "Explorer/Quickstart/QuickstartFirewallNotification";
import * as ko from "knockout";
import * as React from "react";
import { armRequest } from "Utils/arm/request";
import { ReactAdapter } from "../../Bindings/ReactBindingHandler";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { userContext } from "../../UserContext";
import { CommandButtonComponentProps } from "../Controls/CommandButton/CommandButtonComponent";
import { NotebookTerminalComponent } from "../Controls/Notebook/NotebookTerminalComponent";
import Explorer from "../Explorer";
import { useNotebook } from "../Notebook/useNotebook";
import TabsBase from "./TabsBase";

export interface TerminalTabOptions extends ViewModels.TabOptions {
  account: DataModels.DatabaseAccount;
  container: Explorer;
  kind: ViewModels.TerminalKind;
}

/**
 * Notebook terminal tab
 */
class NotebookTerminalComponentAdapter implements ReactAdapter {
  // parameters: true: show, false: hide
  public parameters: ko.Computed<boolean>;
  constructor(
    private getNotebookServerInfo: () => DataModels.NotebookWorkspaceConnectionInfo,
    private getDatabaseAccount: () => DataModels.DatabaseAccount,
    private getTabId: () => string,
    private isAllPublicIPAddressesEnabled: ko.Observable<boolean>
  ) {}

  public renderComponent(): JSX.Element {
    if (!this.isAllPublicIPAddressesEnabled()) {
      return <QuickstartFirewallNotification />;
    }

    return this.parameters() ? (
      <NotebookTerminalComponent
        notebookServerInfo={this.getNotebookServerInfo()}
        databaseAccount={this.getDatabaseAccount()}
        tabId={this.getTabId()}
      />
    ) : (
      <Spinner styles={{ root: { marginTop: 10 } }} size={SpinnerSize.large}></Spinner>
    );
  }
}

export default class TerminalTab extends TabsBase {
  public readonly html = '<div style="height: 100%" data-bind="react:notebookTerminalComponentAdapter"></div>  ';
  private container: Explorer;
  private notebookTerminalComponentAdapter: NotebookTerminalComponentAdapter;
  private isAllPublicIPAddressesEnabled: ko.Observable<boolean>;

  constructor(options: TerminalTabOptions) {
    super(options);
    this.container = options.container;
    this.isAllPublicIPAddressesEnabled = ko.observable(true);
    this.notebookTerminalComponentAdapter = new NotebookTerminalComponentAdapter(
      () => this.getNotebookServerInfo(options),
      () => userContext?.databaseAccount,
      () => this.tabId,
      this.isAllPublicIPAddressesEnabled
    );
    this.notebookTerminalComponentAdapter.parameters = ko.computed<boolean>(() => {
      if (
        this.isTemplateReady() &&
        useNotebook.getState().isNotebookEnabled &&
        useNotebook.getState().notebookServerInfo?.notebookServerEndpoint &&
        this.isAllPublicIPAddressesEnabled()
      ) {
        return true;
      }
      return false;
    });

    if (options.kind === ViewModels.TerminalKind.Postgres) {
      this.checkPostgresFirewallRules();
    }
  }

  public getContainer(): Explorer {
    return this.container;
  }

  protected getTabsButtons(): CommandButtonComponentProps[] {
    const buttons: CommandButtonComponentProps[] = [];
    return buttons;
  }
  protected buildCommandBarOptions(): void {
    this.updateNavbarWithTabsButtons();
  }

  private getNotebookServerInfo(options: TerminalTabOptions): DataModels.NotebookWorkspaceConnectionInfo {
    let endpointSuffix: string;

    switch (options.kind) {
      case ViewModels.TerminalKind.Default:
        endpointSuffix = "";
        break;

      case ViewModels.TerminalKind.Mongo:
        endpointSuffix = "mongo";
        break;

      case ViewModels.TerminalKind.Cassandra:
        endpointSuffix = "cassandra";
        break;

      case ViewModels.TerminalKind.Postgres:
        endpointSuffix = "postgresql";
        break;

      default:
        throw new Error(`Terminal kind: ${options.kind} not supported`);
    }

    const info: DataModels.NotebookWorkspaceConnectionInfo = useNotebook.getState().notebookServerInfo;
    return {
      authToken: info.authToken,
      notebookServerEndpoint: `${info.notebookServerEndpoint.replace(/\/+$/, "")}/${endpointSuffix}`,
      forwardingId: info.forwardingId,
    };
  }

  private async checkPostgresFirewallRules(): Promise<void> {
    const firewallRulesUri = `${userContext.databaseAccount.id}/firewallRules`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = await armRequest({
      host: configContext.ARM_ENDPOINT,
      path: firewallRulesUri,
      method: "GET",
      apiVersion: "2020-10-05-privatepreview",
    });
    const firewallRules: DataModels.PostgresFirewallRule[] = response?.data?.value || response?.value || [];
    const isEnabled = firewallRules.some(
      (rule) => rule.properties.startIpAddress === "0.0.0.0" && rule.properties.endIpAddress === "255.255.255.255"
    );
    this.isAllPublicIPAddressesEnabled(isEnabled);

    // If the firewall rule is not added, check every 30 seconds to see if the user has added the rule
    if (!isEnabled) {
      setTimeout(() => this.checkPostgresFirewallRules(), 30000);
    }
  }
}
