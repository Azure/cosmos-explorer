import { userContext } from "../../../../UserContext";
import { isCloudShellEntraAuthEnabled } from "../../../../Utils/AuthorizationUtils";
import { AbstractShellHandler } from "./AbstractShellHandler";

/**
 * Shell handler for the Azure Cosmos DB Shell (https://github.com/Azure/CosmosDBShell),
 * a .NET global tool that targets the Cosmos DB NoSQL (SQL Core) API.
 */
export class CosmosDBShellHandler extends AbstractShellHandler {
  private _endpoint: string | undefined;
  private _isEntraIdEnabled: boolean = isCloudShellEntraAuthEnabled(userContext);

  constructor(private key: string) {
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
   * 3. Install the CosmosDBShell global tool if it is not already available.
   * 4. Persist the PATH/DOTNET_ROOT changes for future sessions.
   * 5. Export the credential as an environment variable so it never appears in
   *    the process arguments or shell history on the Cloud Shell host.
   *
   * Installation steps run conditionally only if cosmosdbshell is not already
   * present in the environment.
   */
  public getSetUpCommands(): string[] {
    const setUpCommands = [
      "export DOTNET_ROOT=$HOME/.dotnet",
      "export PATH=$HOME/.dotnet:$HOME/.dotnet/tools:$PATH",
      "if ! command -v cosmosdbshell &> /dev/null; then echo '⚠️ cosmosdbshell not found. Installing .NET SDK 10 and CosmosDBShell...'; fi",
      "if ! command -v cosmosdbshell &> /dev/null && ! dotnet --list-sdks 2>/dev/null | grep -q '^10\\.'; then curl -sSL https://dot.net/v1/dotnet-install.sh | bash -s -- --channel 10.0 --install-dir $HOME/.dotnet; fi",
      "if ! command -v cosmosdbshell &> /dev/null; then dotnet tool install --global CosmosDBShell --prerelease; fi",
      "grep -qxF 'export DOTNET_ROOT=$HOME/.dotnet' ~/.bashrc || echo 'export DOTNET_ROOT=$HOME/.dotnet' >> ~/.bashrc",
      "grep -qxF 'export PATH=$HOME/.dotnet:$HOME/.dotnet/tools:$PATH' ~/.bashrc || echo 'export PATH=$HOME/.dotnet:$HOME/.dotnet/tools:$PATH' >> ~/.bashrc",
    ];

    if (this.key) {
      // Entra ID (RBAC) uses a pre-fetched AAD bearer token; key auth uses the account master key.
      // Passing the credential via an environment variable keeps it out of argv/ps/history on the
      // remote Cloud Shell host (the CosmosDBShell tool reads these variables natively).
      const envVar = this._isEntraIdEnabled ? "COSMOSDB_SHELL_TOKEN" : "COSMOSDB_SHELL_ACCOUNT_KEY";
      setUpCommands.push(`export ${envVar}='${this.key}'`);
    }

    return setUpCommands;
  }

  public getConnectionCommand(): string {
    if (!this._endpoint) {
      return `echo '${this.getShellName()} endpoint not found.'`;
    }

    // Force gateway (HTTPS/443) connection mode. The shell otherwise defaults to
    // direct (TCP) mode for real accounts, and Azure Cloud Shell blocks the
    // direct-mode TCP ports, causing the connection to fail. `--verbose` surfaces
    // the full exception details when a connection attempt fails.
    //
    // Auth is supplied out-of-band via env vars (COSMOSDB_SHELL_TOKEN for Entra ID,
    // COSMOSDB_SHELL_ACCOUNT_KEY for key auth), which the tool reads natively. We
    // deliberately do NOT pass --connect-tenant here: it has no effect on the static
    // token path, and if the token is ever missing it would push the tool into
    // interactive browser / device-code auth, which cannot complete inside Azure
    // Cloud Shell. Omitting it lets the tool fall back to DefaultAzureCredential
    // (which uses the Cloud Shell's signed-in az session) instead.
    return `cosmosdbshell --connect '${this._endpoint}' --connect-mode gateway --verbose`;
  }

  public getTerminalSuppressedData(): string[] {
    return [];
  }
}
