/**
 * JupyterLab applications based on jupyterLab components
 */
import { ServerConnection, TerminalManager } from "@jupyterlab/services";
import { IMessage } from "@jupyterlab/services/lib/terminal/terminal";
import { Terminal } from "@jupyterlab/terminal";
import { Panel, Widget } from "@phosphor/widgets";
import { userContext } from "UserContext";

export class JupyterLabAppFactory {
  private isShellClosed: boolean;
  private onShellExited: () => void;
  private checkShellClosed: ((content: string | undefined) => boolean | undefined) | undefined;

  constructor(closeTab: () => void) {
    this.onShellExited = closeTab;
    this.isShellClosed = false;
    this.checkShellClosed = undefined;

    switch (userContext.apiType) {
      case "Mongo":
        this.checkShellClosed = JupyterLabAppFactory.isMongoShellClosed;
        break;
      case "Cassandra":
        this.checkShellClosed = JupyterLabAppFactory.isCassandraShellClosed;
        break;
    }
  }

  public async createTerminalApp(serverSettings: ServerConnection.ISettings) {
    const manager = new TerminalManager({
      serverSettings: serverSettings,
    });
    const session = await manager.startNew();
    session.messageReceived.connect(async (_, message: IMessage) => {
      const content = message.content && message.content[0]?.toString();
      if (this.checkShellClosed && message.type == "stdout") {
        //Close the terminal tab once the shell closed messages are received
        if (this.checkShellClosed(content)) {
          this.isShellClosed = true;
        } else if (content?.includes("cosmosuser@") && this.isShellClosed) {
          this.onShellExited();
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

  private static isMongoShellClosed(content: string | undefined) {
    return content?.endsWith("bye\r\n") || (content?.includes("Stopped") && content?.includes("mongo --host"));
  }

  private static isCassandraShellClosed(content: string | undefined) {
    return content == "\r\n" || (content?.includes("Stopped") && content?.includes("cqlsh"));
  }
}
