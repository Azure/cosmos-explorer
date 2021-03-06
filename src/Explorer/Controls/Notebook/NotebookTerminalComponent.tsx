/**
 * Wrapper around Notebook server terminal
 */

import * as React from "react";
import * as DataModels from "../../../Contracts/DataModels";
import * as StringUtils from "../../../Utils/StringUtils";
import { userContext } from "../../../UserContext";
import { TerminalQueryParams } from "../../../Common/Constants";
import { handleError } from "../../../Common/ErrorHandlingUtils";

export interface NotebookTerminalComponentProps {
  notebookServerInfo: DataModels.NotebookWorkspaceConnectionInfo;
  databaseAccount: DataModels.DatabaseAccount;
}

export class NotebookTerminalComponent extends React.Component<NotebookTerminalComponentProps> {
  constructor(props: NotebookTerminalComponentProps) {
    super(props);
  }

  public render(): JSX.Element {
    return (
      <div className="notebookTerminalContainer">
        <iframe
          title="Terminal to Notebook Server"
          src={NotebookTerminalComponent.createNotebookAppSrc(this.props.notebookServerInfo, this.getTerminalParams())}
        />
      </div>
    );
  }

  public getTerminalParams(): Map<string, string> {
    let params: Map<string, string> = new Map<string, string>();
    params.set(TerminalQueryParams.Terminal, "true");

    const terminalEndpoint: string = this.tryGetTerminalEndpoint();
    if (terminalEndpoint) {
      params.set(TerminalQueryParams.TerminalEndpoint, terminalEndpoint);
    }

    return params;
  }

  public tryGetTerminalEndpoint(): string | null {
    let terminalEndpoint: string | null;

    const notebookServerEndpoint: string = this.props.notebookServerInfo.notebookServerEndpoint;
    if (StringUtils.endsWith(notebookServerEndpoint, "mongo")) {
      let mongoShellEndpoint: string = this.props.databaseAccount.properties.mongoEndpoint;
      if (!mongoShellEndpoint) {
        // mongoEndpoint is only available for Mongo 3.6 and higher.
        // Fallback to documentEndpoint otherwise.
        mongoShellEndpoint = this.props.databaseAccount.properties.documentEndpoint;
      }
      terminalEndpoint = mongoShellEndpoint;
    } else if (StringUtils.endsWith(notebookServerEndpoint, "cassandra")) {
      terminalEndpoint = this.props.databaseAccount.properties.cassandraEndpoint;
    }

    if (terminalEndpoint) {
      return new URL(terminalEndpoint).host;
    }
    return null;
  }

  public static createNotebookAppSrc(
    serverInfo: DataModels.NotebookWorkspaceConnectionInfo,
    params: Map<string, string>
  ): string {
    if (!serverInfo.notebookServerEndpoint) {
      handleError(
        "Notebook server endpoint not defined. Terminal will fail to connect to jupyter server.",
        "NotebookTerminalComponent/createNotebookAppSrc"
      );
      return "";
    }

    params.set(TerminalQueryParams.Server, serverInfo.notebookServerEndpoint);
    if (serverInfo.authToken && serverInfo.authToken.length > 0) {
      params.set(TerminalQueryParams.Token, serverInfo.authToken);
    }

    params.set(TerminalQueryParams.SubscriptionId, userContext.subscriptionId);

    let result: string = "terminal.html?";
    for (let key of params.keys()) {
      result += `${key}=${encodeURIComponent(params.get(key))}&`;
    }

    return result;
  }
}
