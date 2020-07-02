/**
 * JupyterLab applications based on jupyterLab components
 */
import { ServerConnection, TerminalSession } from "@jupyterlab/services";
import { Terminal } from "@jupyterlab/terminal";
import { Panel, Widget } from "@phosphor/widgets";

export class JupyterLabAppFactory {
  public static async createTerminalApp(serverSettings: ServerConnection.ISettings) {
    const session = await TerminalSession.startNew({
      serverSettings: serverSettings,
    });
    const term = new Terminal(session, { theme: "dark", shutdownOnClose: true });

    if (!term) {
      console.error("Failed starting terminal");
      return;
    }

    term.title.closable = false;
    term.addClass("terminalWidget");

    let panel = new Panel();
    panel.addWidget(term);
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
