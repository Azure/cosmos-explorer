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
export const EXIT_COMMAND = ` printf "\\033[1;31mSession ended. Please close this tab and initiate a new shell session if needed.\\033[0m\\n" && disown -a && exit`;

/**
 * This command runs mongosh in no-database and quiet mode,
 * and evaluates the `disableTelemetry()` function to turn off telemetry collection.
 */
export const DISABLE_TELEMETRY_COMMAND = `mongosh --nodb --quiet --eval "disableTelemetry()"`;

/**
 * Abstract class that defines the interface for shell-specific handlers
 * in the CloudShell terminal implementation. Each supported shell type
 * (Mongo, PG, etc.) should extend this class and implement
 * the required methods.
 */
export abstract class AbstractShellHandler {
  /**
   * The name of the application using this shell handler.
   * This is used for telemetry and logging purposes.
   */
  protected APP_NAME = "CosmosExplorerTerminal";

  abstract getShellName(): string;
  abstract getSetUpCommands(): string[];
  abstract getConnectionCommand(): string;
  abstract getTerminalSuppressedData(): string[];
  updateTerminalData?(data: string): string;

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

  /**
   * Setup commands for MongoDB shell:
   *
   * 1. Check if mongosh is already installed
   * 2. Download mongosh package if not installed
   * 3. Extract the package to access mongosh binaries
   * 4. Move extracted files to ~/mongosh directory
   * 5. Add mongosh binary path to system PATH
   * 6. Apply PATH changes by sourcing .bashrc
   *
   * Each command runs conditionally only if mongosh
   * is not already present in the environment.
   */
  protected mongoShellSetupCommands(): string[] {
    const PACKAGE_VERSION: string = "2.5.5";
    return [
      "if ! command -v mongosh &> /dev/null; then echo '⚠️ mongosh not found. Installing...'; fi",
      `if ! command -v mongosh &> /dev/null; then curl -LO https://downloads.mongodb.com/compass/mongosh-${PACKAGE_VERSION}-linux-x64.tgz; fi`,
      `if ! command -v mongosh &> /dev/null; then tar -xvzf mongosh-${PACKAGE_VERSION}-linux-x64.tgz; fi`,
      `if ! command -v mongosh &> /dev/null; then mkdir -p ~/mongosh/bin && mv mongosh-${PACKAGE_VERSION}-linux-x64/bin/mongosh ~/mongosh/bin/  && chmod +x ~/mongosh/bin/mongosh; fi`,
      `if ! command -v mongosh &> /dev/null; then rm -rf mongosh-${PACKAGE_VERSION}-linux-x64 mongosh-${PACKAGE_VERSION}-linux-x64.tgz; fi`,
      "if ! command -v mongosh &> /dev/null; then echo 'export PATH=$HOME/mongosh/bin:$PATH' >> ~/.bashrc; fi",
      "if ! command -v mongosh &> /dev/null; then source ~/.bashrc; fi",
    ];
  }
}
