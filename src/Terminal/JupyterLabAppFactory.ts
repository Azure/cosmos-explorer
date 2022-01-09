/**
 * JupyterLab applications based on jupyterLab components
 */
import { ServerConnection, TerminalManager } from "@jupyterlab/services";
import { IMessage, ITerminalConnection } from "@jupyterlab/services/lib/terminal/terminal";
import { Terminal } from "@jupyterlab/terminal";
import { Panel, Widget } from "@phosphor/widgets";
import { userContext } from "UserContext";

export class JupyterLabAppFactory {
  private shouldCloseTerminalTab: boolean;
  private closeTab: () => void;
  private isShellClosed: (content: string) => boolean;

  constructor(closeTab: () => void) {
    this.closeTab = closeTab;
    switch (userContext.apiType) {
      case "Mongo":
        this.isShellClosed = JupyterLabAppFactory.isMongoShellClosed;
        break;
      case "Cassandra":
        this.isShellClosed = JupyterLabAppFactory.isCassandraShellClosed;
        break;
    }
  }

  public async createTerminalApp(serverSettings: ServerConnection.ISettings) {
    const manager = new TerminalManager({
      serverSettings: serverSettings,
    });
    const session = await manager.startNew();
    session.messageReceived.connect(async (terminalConnection: ITerminalConnection, message: IMessage) => {
      var content = message.content[0].toString();
      if (message.type == "stdout" && this.isShellClosed) {
        //Close the terminal tab once the shell closed messages are received
        if (this.isShellClosed(content)) {
          this.shouldCloseTerminalTab = true;
        } else if (content.indexOf("cosmosuser@") != -1 && this.shouldCloseTerminalTab) {
          this.closeTab();
        }
      }
    }, this);

    const term = new Terminal(session, { theme: "dark", shutdownOnClose: true });

    if (!term) {
      console.error("Failed starting terminal");
      return;
    }

    term.title.closable = false;
    term.addClass("terminalWidget");

    let panel = new Panel();
    panel.addWidget(term as any);
    panel.id = "main";

    // Attach the widget to the dom.
    Widget.attach(panel, document.body);

    // Handle resize events.
    window.addEventListener("resize", () => {
      panel.update();
    });

    // Dispose terminal when unloading.
    window.addEventListener("unload", () => {
      panel.dispose();
    });
  }

  private static isMongoShellClosed(content: string) {
    return content.endsWith("bye\r\n") || (content.indexOf("Stopped") !== -1 && content.indexOf("mongo --host") !== -1);
  }

  private static isCassandraShellClosed(content: string) {
    return content == "\r\n" || (content.indexOf("Stopped") !== -1 && content.indexOf("cqlsh") !== -1);
  }
}
