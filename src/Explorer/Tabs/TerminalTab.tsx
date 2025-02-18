import { Spinner, SpinnerSize } from "@fluentui/react";
import { MessageTypes } from "Contracts/ExplorerContracts";
import { QuickstartFirewallNotification } from "Explorer/Quickstart/QuickstartFirewallNotification";
import { checkFirewallRules } from "Explorer/Tabs/Shared/CheckFirewallRules";
import * as ko from "knockout";
import * as React from "react";
import FirewallRuleScreenshot from "../../../images/firewallRule.png";
import { ReactAdapter } from "../../Bindings/ReactBindingHandler";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { userContext } from "../../UserContext";
import { CommandButtonComponentProps } from "../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../Explorer";
//import { useNotebook } from "../Notebook/useNotebook";
import TabsBase from "./TabsBase";
import XTermComponent from "./XTermComponent";


export interface TerminalTabOptions extends ViewModels.TabOptions {
  account: DataModels.DatabaseAccount;
  container: Explorer;
  kind: ViewModels.TerminalKind;
  username?: string;
}

/**
 * Notebook terminal tab
 */
class XTermAdapter implements ReactAdapter {
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
          screenshot={FirewallRuleScreenshot}
          shellName={this.getShellNameForDisplay(this.kind)}
        />
      );
    }
    return this.parameters() ? (
      <XTermComponent />
      // <NotebookTerminalComponent
      //   notebookServerInfo={this.getNotebookServerInfo()}
      //   databaseAccount={this.getDatabaseAccount()}
      //   tabId={this.getTabId()}
      //   username={this.getUsername()}
      // />
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

export default class TerminalTab extends TabsBase {
  public readonly html = '<div style="height: 100%" data-bind="react: xtermAdapter"></div>';
  private container: Explorer;
  private xtermAdapter: XTermAdapter;
  private isAllPublicIPAddressesEnabled: ko.Observable<boolean>;

  constructor(options: TerminalTabOptions) {
    super(options);
    this.container = options.container;
    this.isAllPublicIPAddressesEnabled = ko.observable(true);
    this.xtermAdapter = new XTermAdapter(
      () => null,
      () => userContext?.databaseAccount,
      () => this.tabId,
      () => this.getUsername(),
      this.isAllPublicIPAddressesEnabled,
      options.kind,
    );
    this.xtermAdapter.parameters = ko.computed<boolean>(() => {
      if (
        this.isTemplateReady() &&
        // useNotebook.getState().isNotebookEnabled &&
        // useNotebook.getState().notebookServerInfo?.notebookServerEndpoint &&
        this.isAllPublicIPAddressesEnabled()
      ) {
        return true;
      }
      return false;
    });

    if (options.kind === ViewModels.TerminalKind.Postgres) {
      checkFirewallRules(
        "2022-11-08",
        (rule) => rule.properties.startIpAddress === "0.0.0.0" && rule.properties.endIpAddress === "255.255.255.255",
        this.isAllPublicIPAddressesEnabled,
      );
    }

    if (options.kind === ViewModels.TerminalKind.VCoreMongo) {
      checkFirewallRules(
        "2023-03-01-preview",
        (rule) =>
          rule.name.startsWith("AllowAllAzureServicesAndResourcesWithinAzureIps") ||
          (rule.properties.startIpAddress === "0.0.0.0" && rule.properties.endIpAddress === "255.255.255.255"),
        this.isAllPublicIPAddressesEnabled,
      );
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

  // private getNotebookServerInfo(options: TerminalTabOptions): DataModels.NotebookWorkspaceConnectionInfo {
  //   let endpointSuffix: string;

  //   switch (options.kind) {
  //     case ViewModels.TerminalKind.Default:
  //       endpointSuffix = "";
  //       break;

  //     case ViewModels.TerminalKind.Mongo:
  //       endpointSuffix = "mongo";
  //       break;

  //     case ViewModels.TerminalKind.Cassandra:
  //       endpointSuffix = "cassandra";
  //       break;

  //     case ViewModels.TerminalKind.Postgres:
  //       endpointSuffix = "postgresql";
  //       break;

  //     case ViewModels.TerminalKind.VCoreMongo:
  //       endpointSuffix = "mongovcore";
  //       break;

  //     default:
  //       throw new Error(`Terminal kind: ${options.kind} not supported`);
  //   }

  //   const info: DataModels.NotebookWorkspaceConnectionInfo = useNotebook.getState().notebookServerInfo;
  //   return {
  //     authToken: info.authToken,
  //     notebookServerEndpoint: `${info.notebookServerEndpoint.replace(/\/+$/, "")}/${endpointSuffix}`,
  //     forwardingId: info.forwardingId,
  //   };
  // }

  private getUsername(): string {
    if (userContext.apiType !== "VCoreMongo" || !userContext?.vcoreMongoConnectionParams?.adminLogin) {
      return undefined;
    }

    return userContext.vcoreMongoConnectionParams.adminLogin;
  }
}
