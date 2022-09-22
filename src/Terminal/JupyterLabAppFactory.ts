/**
 * JupyterLab applications based on jupyterLab components
 */
import { ServerConnection, TerminalManager } from "@jupyterlab/services";
import { IMessage } from "@jupyterlab/services/lib/terminal/terminal";
import { Terminal } from "@jupyterlab/terminal";
import { Panel, Widget } from "@phosphor/widgets";
import { userContext } from "UserContext";

export class JupyterLabAppFactory {
  private isShellStarted: boolean | undefined;
  private checkShellStarted: ((content: string | undefined) => void) | undefined;
  private onShellExited: () => void;

  private isShellExited(content: string | undefined) {
    return content?.includes("cosmosuser@");
  }

  private isMongoShellStarted(content: string | undefined) {
    this.isShellStarted = content?.includes("MongoDB shell version");
  }

  private isCassandraShellStarted(content: string | undefined) {
    this.isShellStarted = content?.includes("Connected to") && content?.includes("cqlsh");
  }

  private isPostgresShellStarted(content: string | undefined) {
    this.isShellStarted = content?.includes("citus=>");
  }

  constructor(closeTab: () => void) {
    this.onShellExited = closeTab;
    this.isShellStarted = false;
    this.checkShellStarted = undefined;

    switch (userContext.apiType) {
      case "Mongo":
        this.checkShellStarted = this.isMongoShellStarted;
        break;
      case "Cassandra":
        this.checkShellStarted = this.isCassandraShellStarted;
        break;
      case "Postgres":
        this.checkShellStarted = this.isPostgresShellStarted;
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

      if (this.checkShellStarted && message.type == "stdout") {
        //Close the terminal tab once the shell closed messages are received
        if (!this.isShellStarted) {
          this.checkShellStarted(content);
        } else if (this.isShellExited(content)) {
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
}
