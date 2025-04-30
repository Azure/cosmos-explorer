import { NotebookTerminalComponent } from "Explorer/Controls/Notebook/NotebookTerminalComponent";
import * as React from "react";
import * as DataModels from "../../../Contracts/DataModels";
import * as ViewModels from "../../../Contracts/ViewModels";
import { BaseTerminalComponentAdapter } from "./BaseTerminalComponentAdapter";

/**
 * Notebook terminal tab
 */
export class NotebookTerminalComponentAdapter extends BaseTerminalComponentAdapter {
  constructor(
    private getNotebookServerInfo: () => DataModels.NotebookWorkspaceConnectionInfo,
    getDatabaseAccount: () => DataModels.DatabaseAccount,
    getTabId: () => string,
    getUsername: () => string,
    isAllPublicIPAddressesEnabled: ko.Observable<boolean>,
    kind: ViewModels.TerminalKind,
  ) {
    super(getDatabaseAccount, getTabId, getUsername, isAllPublicIPAddressesEnabled, kind);
  }

  protected renderTerminalComponent(): JSX.Element {
    return (
      <NotebookTerminalComponent
        notebookServerInfo={this.getNotebookServerInfo()}
        databaseAccount={this.getDatabaseAccount()}
        tabId={this.getTabId()}
        username={this.getUsername()}
      />
    );
  }
}
