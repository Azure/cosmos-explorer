export const START_MARKER = `echo "START INITIALIZATION" > /dev/null`;
export const DISABLE_HISTORY = `set +o history`;
export const EXIT_COMMAND = ` && printf "\\033[1;31mSession ended. Please close this tab and initiate a new shell session if needed.\\033[0m\\n" && exit`;

export abstract class AbstractShellHandler {
  abstract getShellName(): string;
  abstract getSetUpCommands(): string[];
  abstract getConnectionCommand(): string;
  abstract getTerminalSuppressedData(): string;

  public getInitialCommands(): string {
    const setupCommands = this.getSetUpCommands();
    const connectionCommand = this.getConnectionCommand();

    const allCommands = [START_MARKER, DISABLE_HISTORY, ...setupCommands, connectionCommand + EXIT_COMMAND];

    return allCommands.join("\n").concat("\n");
  }
}
