import { checkFirewallRules } from "Explorer/Tabs/Shared/CheckFirewallRules";
import { CloudShellTerminalComponentAdapter } from "Explorer/Tabs/ShellAdapters/CloudShellTerminalComponentAdapter";
import * as ko from "knockout";
import { ReactAdapter } from "../../Bindings/ReactBindingHandler";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { userContext } from "../../UserContext";
import { CommandButtonComponentProps } from "../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../Explorer";
import TabsBase from "./TabsBase";

export interface TerminalTabOptions extends ViewModels.TabOptions {
  account: DataModels.DatabaseAccount;
  container: Explorer;
  kind: ViewModels.TerminalKind;
  username?: string;
}

export default class TerminalTab extends TabsBase {
  public readonly html = '<div style="height: 100%" data-bind="react:notebookTerminalComponentAdapter"></div>  ';
  private container: Explorer;
  private notebookTerminalComponentAdapter: ReactAdapter;
  private isAllPublicIPAddressesEnabled: ko.Observable<boolean>;

  constructor(options: TerminalTabOptions) {
    super(options);
    this.container = options.container;
    this.isAllPublicIPAddressesEnabled = ko.observable(true);

    this.notebookTerminalComponentAdapter = new CloudShellTerminalComponentAdapter(
      () => userContext?.databaseAccount,
      () => this.tabId,
      () => this.getUsername(),
      this.isAllPublicIPAddressesEnabled,
      options.kind,
    );

    this.notebookTerminalComponentAdapter.parameters = ko.computed<boolean>(() => {
      return this.isTemplateReady() && this.isAllPublicIPAddressesEnabled();
    });

    if (options.kind === ViewModels.TerminalKind.Postgres) {
      checkFirewallRules(
        "2022-11-08",
        (rule) => rule.properties.startIpAddress === "0.0.0.0" && rule.properties.endIpAddress === "255.255.255.255",
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

  private getUsername(): string {
    if (userContext.apiType !== "VCoreMongo" || !userContext?.vcoreMongoConnectionParams?.adminLogin) {
      return undefined;
    }

    return userContext.vcoreMongoConnectionParams.adminLogin;
  }
}
