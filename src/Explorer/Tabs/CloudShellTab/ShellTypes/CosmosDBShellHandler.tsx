import { userContext } from "../../../../UserContext";
import { AbstractShellHandler } from "./AbstractShellHandler";

/**
 * A credential resolved by Data Explorer and handed to the Cosmos DB Shell.
 *
 * Both kinds are delivered the same way the Mongo shell delivers its credential: exported
 * as an environment variable on the same command line as the `cosmosdbshell` invocation
 * (`export VAR='...'; cosmosdbshell --connect <endpoint>`), immediately before the tool
 * reads it, rather than as a separate setup step or embedded in a connection string.
 *
 * - `token` is an Entra ID (AAD) bearer token scoped to the account's data plane, exported
 *   as COSMOSDB_SHELL_TOKEN.
 * - `key` is an account master (or read-only) key, exported as COSMOSDB_SHELL_ACCOUNT_KEY.
 *
 * The kind is tracked explicitly so the correct environment variable is always used.
 */
export interface CosmosDBShellCredential {
  kind: "token" | "key";
  value: string;
}

/**
 * Shell handler for the Azure Cosmos DB Shell (https://github.com/Azure/CosmosDBShell),
 * a .NET global tool that targets the Cosmos DB NoSQL (SQL Core) API.
 */
export class CosmosDBShellHandler extends AbstractShellHandler {
  private _endpoint: string | undefined;

  constructor(
    private credential: CosmosDBShellCredential | undefined,
    private unavailableReason?: string,
  ) {
    super();
    this._endpoint = userContext?.databaseAccount?.properties?.documentEndpoint;
  }

  public getShellName(): string {
    return "Cosmos DB";
  }

  /**
   * Setup commands for the Cosmos DB Shell:
   *
   * 1. Put the private .NET install dir and global tools dir on PATH (and set
   *    DOTNET_ROOT) so both the `dotnet` host and installed tool resolve.
   * 2. Bootstrap a private .NET SDK 10 into $HOME/.dotnet when neither the
   *    cosmosdbshell tool nor a suitable SDK is already available. The
   *    CosmosDBShell global tool targets net10.0, so `dotnet tool install`
   *    requires the .NET SDK 10.0+, which the Azure Cloud Shell host does not
   *    ship by default.
   * 3. Install the CosmosDBShell global tool if it is not already available, or
   *    update it to the latest release when it is (so an older cached install in
   *    the persistent Cloud Shell $HOME picks up newer connect options).
   * 4. Persist the PATH/DOTNET_ROOT changes for future sessions.
   *
   * The credential itself is not exported here: it travels on the same command line as
   * the `cosmosdbshell` invocation (see getConnectionCommand), mirroring how the Mongo
   * shell handler builds its connection command.
   *
   * Installation steps run conditionally only if cosmosdbshell is not already
   * present in the environment.
   */
  public getSetUpCommands(): string[] {
    return [
      "export DOTNET_ROOT=$HOME/.dotnet",
      "export PATH=$HOME/.dotnet:$HOME/.dotnet/tools:$PATH",
      "if ! command -v cosmosdbshell &> /dev/null; then echo '⚠️ cosmosdbshell not found. Installing .NET SDK 10 and CosmosDBShell...'; fi",
      "if ! command -v cosmosdbshell &> /dev/null && ! dotnet --list-sdks 2>/dev/null | grep -q '^10\\.'; then curl -sSL https://dot.net/v1/dotnet-install.sh | bash -s -- --channel 10.0 --install-dir $HOME/.dotnet; fi",
      "if ! command -v cosmosdbshell &> /dev/null; then dotnet tool install --global CosmosDBShell --prerelease; else dotnet tool update --global CosmosDBShell --prerelease; fi",
      "grep -qxF 'export DOTNET_ROOT=$HOME/.dotnet' ~/.bashrc || echo 'export DOTNET_ROOT=$HOME/.dotnet' >> ~/.bashrc",
      "grep -qxF 'export PATH=$HOME/.dotnet:$HOME/.dotnet/tools:$PATH' ~/.bashrc || echo 'export PATH=$HOME/.dotnet:$HOME/.dotnet/tools:$PATH' >> ~/.bashrc",
    ];
  }

  private _getKeyConnectionCommand(key: string): string {
    // Export the key immediately before invoking the tool, on the same command line, so it
    // never appears as a --connect flag value or lands in a separate setup step. The tool
    // reads the account key from COSMOSDB_SHELL_ACCOUNT_KEY and connects to the bare endpoint.
    return `export COSMOSDB_SHELL_ACCOUNT_KEY='${key}'; cosmosdbshell --connect '${this._endpoint}' --connect-mode gateway --verbose`;
  }

  private _getTokenConnectionCommand(token: string): string {
    // Same pattern for the Entra ID token: exported right before the invocation so it never
    // appears in argv/ps, then the tool reads it from COSMOSDB_SHELL_TOKEN.
    return `export COSMOSDB_SHELL_TOKEN='${token}'; cosmosdbshell --connect '${this._endpoint}' --connect-mode gateway --verbose`;
  }

  public getConnectionCommand(): string {
    if (!this._endpoint) {
      return `echo '${this.getShellName()} endpoint not found.'`;
    }

    if (!this.credential) {
      // Never let the tool continue without a credential. With no account key and no
      // COSMOSDB_SHELL_TOKEN exported, its credential chain would fall through to
      // DefaultAzureCredential, which in Azure Cloud Shell tries the managed identity
      // first and fails with "AudienceNotSupported" (the Cloud Shell MSI cannot mint a
      // token for the *.documents.azure.com audience). The interactive browser and
      // device-code flows are not usable from this embedded terminal either, so fail
      // fast with actionable guidance instead.
      //
      // There is no way to inspect the browser dev tools console from inside this remote
      // terminal, so the specific reason (when known) is echoed here too.
      const reasonSuffix = this.unavailableReason ? ` — ${this.unavailableReason}` : "";
      return `echo 'Unable to acquire a ${this.getShellName()} credential${reasonSuffix}. Use "Login for Entra ID" in the Data Explorer toolbar, verify you have Cosmos DB data-plane RBAC access to this account, then reopen the shell.'`;
    }

    // Force gateway (HTTPS/443) connection mode. The shell otherwise defaults to
    // direct (TCP) mode for real accounts, and Azure Cloud Shell blocks the
    // direct-mode TCP ports, causing the connection to fail. `--verbose` surfaces
    // the full exception details when a connection attempt fails.
    return this.credential.kind === "key"
      ? this._getKeyConnectionCommand(this.credential.value)
      : this._getTokenConnectionCommand(this.credential.value);
  }

  public getTerminalSuppressedData(): string[] {
    return [];
  }
}
