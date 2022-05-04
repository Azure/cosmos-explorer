import { Spinner, SpinnerSize } from "@fluentui/react";
import * as ko from "knockout";
import * as React from "react";
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
    private getTabId: () => string
  ) {}

  public renderComponent(): JSX.Element {
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

  constructor(options: TerminalTabOptions) {
    super(options);
    this.container = options.container;
    this.notebookTerminalComponentAdapter = new NotebookTerminalComponentAdapter(
      () => this.getNotebookServerInfo(options),
      () => userContext?.databaseAccount,
      () => this.tabId
    );
    this.notebookTerminalComponentAdapter.parameters = ko.computed<boolean>(() => {
      if (
        this.isTemplateReady() &&
        useNotebook.getState().isNotebookEnabled &&
        useNotebook.getState().notebookServerInfo?.notebookServerEndpoint
      ) {
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

    const info: DataModels.NotebookWorkspaceConnectionInfo = useNotebook.getState().notebookServerInfo;
    return {
      authToken: info.authToken,
      notebookServerEndpoint: `${info.notebookServerEndpoint.replace(/\/+$/, "")}/${endpointSuffix}`,
      forwardingId: info.forwardingId,
    };
  }
}
