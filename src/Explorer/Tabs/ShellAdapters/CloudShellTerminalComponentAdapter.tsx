import { CloudShellTerminalComponent } from "Explorer/Tabs/CloudShellTab/CloudShellTerminalComponent";
import * as React from "react";
import { BaseTerminalComponentAdapter } from "./BaseTerminalComponentAdapter";

/**
 * CloudShell terminal tab
 */
export class CloudShellTerminalComponentAdapter extends BaseTerminalComponentAdapter {
  protected renderTerminalComponent(): JSX.Element {
    return (
      <CloudShellTerminalComponent
        databaseAccount={this.getDatabaseAccount()}
        tabId={this.getTabId()}
        shellType={this.kind}
        username={this.getUsername()}
      />
    );
  }
}
