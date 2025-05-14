/**
 * JupyterLab applications based on jupyterLab components
 */
import { ServerConnection, TerminalManager } from "@jupyterlab/services";
import { IMessage, ITerminalConnection } from "@jupyterlab/services/lib/terminal/terminal";
import { Terminal } from "@jupyterlab/terminal";
import { Panel, Widget } from "@phosphor/widgets";
import { userContext } from "UserContext";

export class JupyterLabAppFactory {
  private isShellStarted: boolean | undefined;
  private checkShellStarted: ((content: string | undefined) => void) | undefined;
  private onShellExited: (restartShell: boolean) => void;
  private restartShell: boolean;

  private isShellExited(content: string | undefined) {
    if (userContext.apiType === "VCoreMongo" && content?.includes("MongoServerError: Invalid key")) {
      this.restartShell = true;
    }
    return content?.includes("cosmosshelluser@");
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

  private isVCoreMongoShellStarted(content: string | undefined) {
    this.isShellStarted = content?.includes("Enter password");
  }

  constructor(closeTab: (restartShell: boolean) => void) {
    this.onShellExited = closeTab;
    this.isShellStarted = false;
    this.checkShellStarted = undefined;
    this.restartShell = false;

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
      case "VCoreMongo":
        this.checkShellStarted = this.isVCoreMongoShellStarted;
        break;
    }
  }

  public async createTerminalApp(serverSettings: ServerConnection.ISettings): Promise<ITerminalConnection | undefined> {
    const configurationSettings: Partial<ServerConnection.ISettings> = serverSettings;
    (configurationSettings.appendToken as boolean) = false;
    serverSettings = ServerConnection.makeSettings(configurationSettings);
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
          this.onShellExited(this.restartShell);
        }
      }
    }, this);

    let internalSend = session.send;
    session.send = (message: IMessage) => {
      message?.content?.push(serverSettings?.token);
      internalSend.call(session, message);
    };
    const term = new Terminal(session, { theme: "dark", shutdownOnClose: true });

    if (!term) {
      console.error("Failed starting terminal");
      return undefined;
    }

    term.title.closable = false;
    term.addClass("terminalWidget");

    let panel = new Panel();
    panel.addWidget(term as any);
    panel.id = "main";

    // Attach the widget to the dom.
    Widget.attach(panel, document.body);

    // Switch focus to the terminal
    term.activate();

    // Handle resize events.
    window.addEventListener("resize", () => {
      panel.update();
    });

    // Dispose terminal when unloading.
    window.addEventListener("unload", () => {
      panel.dispose();
    });

    // Close terminal when Ctrl key is pressed
    term.node.addEventListener("keydown", (event: KeyboardEvent) => {
      if (event.ctrlKey) {
        this.onShellExited(false);
      }
    });

    return session;
  }
}
