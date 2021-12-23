/**
 * Wrapper around Notebook server terminal
 */

import postRobot from "post-robot";
import * as React from "react";
import * as DataModels from "../../../Contracts/DataModels";
import { TerminalProps } from "../../../Terminal/TerminalProps";
import { userContext } from "../../../UserContext";
import * as StringUtils from "../../../Utils/StringUtils";

export interface NotebookTerminalComponentProps {
  notebookServerInfo: DataModels.NotebookWorkspaceConnectionInfo;
  databaseAccount: DataModels.DatabaseAccount;
}

export class NotebookTerminalComponent extends React.Component<NotebookTerminalComponentProps> {
  // Need to declare as Window | null as contentWindow is typeof Window | null.
  // Only Window type declaration throws compilation typeScript error in compile strict mode
  private terminalWindow: Window | null;

  constructor(props: NotebookTerminalComponentProps) {
    super(props);
    this.terminalWindow = window;
  }

  componentDidMount(): void {
    this.sendPropsToTerminalFrame();
  }

  public render(): JSX.Element {
    return (
      <div className="notebookTerminalContainer">
        <iframe
          title="Terminal to Notebook Server"
          onLoad={(event) => this.handleFrameLoad(event)}
          src="terminal.html"
        />
      </div>
    );
  }

  handleFrameLoad(event: React.SyntheticEvent<HTMLIFrameElement, Event>): void {
    this.terminalWindow = (event.target as HTMLIFrameElement).contentWindow;
    this.sendPropsToTerminalFrame();
  }

  sendPropsToTerminalFrame(): void {
    if (!this.terminalWindow) {
      return;
    }

    const props: TerminalProps = {
      terminalEndpoint: this.tryGetTerminalEndpoint(),
      notebookServerEndpoint: this.props.notebookServerInfo?.notebookServerEndpoint,
      authToken: this.props.notebookServerInfo?.authToken,
      subscriptionId: userContext.subscriptionId,
      apiType: userContext.apiType,
      authType: userContext.authType,
      databaseAccount: userContext.databaseAccount,
    };

    postRobot.send(this.terminalWindow, "props", props, {
      domain: window.location.origin,
    });
  }

  public tryGetTerminalEndpoint(): string | undefined {
    let terminalEndpoint: string | undefined;

    const notebookServerEndpoint = this.props.notebookServerInfo?.notebookServerEndpoint;
    if (StringUtils.endsWith(notebookServerEndpoint, "mongo")) {
      // mongoEndpoint is only available for Mongo 3.6 and higher, fallback to documentEndpoint otherwise
      terminalEndpoint =
        this.props.databaseAccount?.properties.mongoEndpoint || this.props.databaseAccount?.properties.documentEndpoint;
    } else if (StringUtils.endsWith(notebookServerEndpoint, "cassandra")) {
      terminalEndpoint = this.props.databaseAccount?.properties.cassandraEndpoint;
    }

    if (terminalEndpoint) {
      return new URL(terminalEndpoint).host;
    }

    return undefined;
  }
}
