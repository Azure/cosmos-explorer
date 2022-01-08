/**
 * JupyterLab applications based on jupyterLab components
 */
import { ServerConnection, TerminalManager } from "@jupyterlab/services";
import { IMessage, ITerminalConnection } from "@jupyterlab/services/lib/terminal/terminal";
import { Terminal } from "@jupyterlab/terminal";
import { Panel, Widget } from "@phosphor/widgets";

export class JupyterLabAppFactory {
  public static async createTerminalApp(serverSettings: ServerConnection.ISettings, closeTab: () => void) {
    const manager = new TerminalManager({
      serverSettings: serverSettings,
    });
    const session = await manager.startNew();
    session.messageReceived.connect(async (terminalConnection: ITerminalConnection, message: IMessage) => {
      var content = message.content[0].toString();
      if (message.type == "stdout" && content.indexOf("bye") != -1) {
        closeTab();
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
