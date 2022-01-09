/**
 * JupyterLab applications based on jupyterLab components
 */
import { ServerConnection, TerminalManager } from "@jupyterlab/services";
import { IMessage, ITerminalConnection } from "@jupyterlab/services/lib/terminal/terminal";
import { Terminal } from "@jupyterlab/terminal";
import { Panel, Widget } from "@phosphor/widgets";

export class JupyterLabAppFactory {
  private isTerminalClosed: boolean
  private closeTab: () => void

  constructor(closeTab: () => void) {
    this.closeTab = closeTab;
  }

  public async createTerminalApp(serverSettings: ServerConnection.ISettings) {
    const manager = new TerminalManager({
      serverSettings: serverSettings,
    });
    const session = await manager.startNew();
    session.messageReceived.connect(async (terminalConnection: ITerminalConnection, message: IMessage) => {
      var content = message.content[0].toString();
      console.log(content)
      if (message.type == "stdout") {
        //Close the terminal tab once the terminal closed messages are received
        if (content.endsWith("bye\r\n") || (content.indexOf("Stopped") !== -1 && content.indexOf("mongo --host") !== -1)) {
          this.isTerminalClosed = true
        } else if (content.indexOf("cosmosuser@SandboxHost") != -1 && this.isTerminalClosed) {
          this.closeTab();
        }
      }
    }, this)

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
