import { checkFirewallRules } from "Explorer/Tabs/Shared/CheckFirewallRules";
import { CloudShellTerminalComponentAdapter } from "Explorer/Tabs/ShellAdapters/CloudShellTerminalComponentAdapter";
import * as ko from "knockout";
import { ReactAdapter } from "../../Bindings/ReactBindingHandler";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { userContext } from "../../UserContext";
import { CommandButtonComponentProps } from "../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../Explorer";
import { useNotebook } from "../Notebook/useNotebook";
import { NotebookTerminalComponentAdapter } from "./ShellAdapters/NotebookTerminalComponentAdapter";
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

    const commonArgs: [
      () => DataModels.DatabaseAccount,
      () => string,
      () => string,
      ko.Observable<boolean>,
      ViewModels.TerminalKind,
    ] = [
      () => userContext?.databaseAccount,
      () => this.tabId,
      () => this.getUsername(),
      this.isAllPublicIPAddressesEnabled,
      options.kind,
    ];

    if (userContext.features.enableCloudShell) {
      this.notebookTerminalComponentAdapter = new CloudShellTerminalComponentAdapter(...commonArgs);

      this.notebookTerminalComponentAdapter.parameters = ko.computed<boolean>(() => {
        return this.isTemplateReady() && this.isAllPublicIPAddressesEnabled();
      });
    } else {
      this.notebookTerminalComponentAdapter = new NotebookTerminalComponentAdapter(
        () => this.getNotebookServerInfo(options),
        ...commonArgs,
      );

      this.notebookTerminalComponentAdapter.parameters = ko.computed<boolean>(() => {
        return (
          this.isTemplateReady() &&
          useNotebook.getState().isNotebookEnabled &&
          useNotebook.getState().notebookServerInfo?.notebookServerEndpoint &&
          this.isAllPublicIPAddressesEnabled()
        );
      });
    }

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

      case ViewModels.TerminalKind.VCoreMongo:
        endpointSuffix = "mongovcore";
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

  private getUsername(): string {
    if (userContext.apiType !== "VCoreMongo" || !userContext?.vcoreMongoConnectionParams?.adminLogin) {
      return undefined;
    }

    return userContext.vcoreMongoConnectionParams.adminLogin;
  }
}
