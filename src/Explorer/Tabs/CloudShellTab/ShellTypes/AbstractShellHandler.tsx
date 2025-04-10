export const START_MARKER = `echo "START INITIALIZATION" > /dev/null`;

export abstract class AbstractShellHandler {
  
  abstract getShellName(): string;
  abstract getSetUpCommands(): string[];
  abstract getConnectionCommand(): string;
  abstract getEndpoint(): string;
  abstract getTerminalSuppressedData(): string;

  public getInitialCommands(): string {
    const setupCommands = this.getSetUpCommands();
    const connectionCommand = this.getConnectionCommand();

    const allCommands = [
      START_MARKER,
      ...setupCommands,
      connectionCommand
    ];
  
    return allCommands.join("\n").concat("\n");
  }
}