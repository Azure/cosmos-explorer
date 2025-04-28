/**
 * Command that serves as a marker to indicate the start of shell initialization.
 * Outputs to /dev/null to prevent displaying in the terminal.
 */
export const START_MARKER = `echo "START INITIALIZATION" > /dev/null`;

/**
 * Command to disable command history recording in the shell.
 * Prevents initialization commands from appearing in history.
 */
export const DISABLE_HISTORY = `set +o history`;
/**
 * Command that displays an error message and exits the shell session.
 * Used when shell initialization or connection fails.
 */
export const EXIT_COMMAND = ` printf "\\033[1;31mSession ended. Please close this tab and initiate a new shell session if needed.\\033[0m\\n" && exit`;

/**
 * Abstract class that defines the interface for shell-specific handlers
 * in the CloudShell terminal implementation. Each supported shell type
 * (Mongo, PG, etc.) should extend this class and implement
 * the required methods.
 */
export abstract class AbstractShellHandler {
  abstract getShellName(): string;
  abstract getSetUpCommands(): string[];
  abstract getConnectionCommand(): string;
  abstract getTerminalSuppressedData(): string;

  /**
   * Constructs the complete initialization command sequence for the shell.
   *
   * This method:
   * 1. Starts with the initialization marker
   * 2. Disables command history
   * 3. Adds shell-specific setup commands
   * 4. Adds the connection command with error handling
   * 5. Adds a fallback exit command if connection fails
   *
   * The connection command is wrapped in a construct that prevents
   * errors from terminating the entire session immediately, allowing
   * the friendly exit message to be displayed.
   *
   * @returns {string} Complete initialization command sequence with newlines
   */
  public getInitialCommands(): string {
    const setupCommands = this.getSetUpCommands();
    const connectionCommand = this.getConnectionCommand();

    const allCommands = [
      START_MARKER,
      DISABLE_HISTORY,
      ...setupCommands,
      `{ ${connectionCommand}; } || true;${EXIT_COMMAND}`,
    ];

    return allCommands.join("\n").concat("\n");
  }
}
