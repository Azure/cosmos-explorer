import * as ko from "knockout";
import * as ViewModels from "../../Contracts/ViewModels";
import * as DataModels from "../../Contracts/DataModels";
import TabsBase from "./TabsBase";
import * as React from "react";
import { ReactAdapter } from "../../Bindings/ReactBindingHandler";
import { NotebookTerminalComponent } from "../Controls/Notebook/NotebookTerminalComponent";
import Explorer from "../Explorer";
import { CommandButtonComponentProps } from "../Controls/CommandButton/CommandButtonComponent";
import template from "./TerminalTab.html";

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
    private getDatabaseAccount: () => DataModels.DatabaseAccount
  ) {}

  public renderComponent(): JSX.Element {
    return this.parameters() ? (
      <NotebookTerminalComponent
        notebookServerInfo={this.getNotebookServerInfo()}
        databaseAccount={this.getDatabaseAccount()}
      />
    ) : (
      <></>
    );
  }
}

export default class TerminalTab extends TabsBase {
  public static readonly component = { name: "terminal-tab", template };
  private container: Explorer;
  private notebookTerminalComponentAdapter: NotebookTerminalComponentAdapter;

  constructor(options: TerminalTabOptions) {
    super(options);
    this.container = options.container;
    this.notebookTerminalComponentAdapter = new NotebookTerminalComponentAdapter(
      () => this.getNotebookServerInfo(options),
      () => this.getContainer().databaseAccount()
    );
    this.notebookTerminalComponentAdapter.parameters = ko.computed<boolean>(() => {
      if (this.isTemplateReady() && this.container.isNotebookEnabled()) {
        return true;
      }
      return false;
    });
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

      default:
        throw new Error(`Terminal kind: ${options.kind} not supported`);
    }

    const info: DataModels.NotebookWorkspaceConnectionInfo = options.container.notebookServerInfo();
    return {
      authToken: info.authToken,
      notebookServerEndpoint: `${info.notebookServerEndpoint.replace(/\/+$/, "")}/${endpointSuffix}`,
    };
  }
}
