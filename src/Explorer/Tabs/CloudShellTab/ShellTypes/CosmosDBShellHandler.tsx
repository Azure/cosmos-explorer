import { userContext } from "../../../../UserContext";
import { AbstractShellHandler } from "./AbstractShellHandler";

/**
 * A credential resolved by Data Explorer and handed to the Cosmos DB Shell.
 *
 * `token` is an Entra ID (AAD) bearer token scoped to the account's data plane and is
 * exported as COSMOSDB_SHELL_TOKEN; `key` is an account master key and is exported as
 * COSMOSDB_SHELL_ACCOUNT_KEY. The kind is tracked explicitly so the correct environment
 * variable is always used — exporting one as the other silently breaks authentication.
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

  constructor(private credential: CosmosDBShellCredential | undefined) {
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
      "if ! command -v cosmosdbshell &> /dev/null; then dotnet tool install --global CosmosDBShell --prerelease; else dotnet tool update --global CosmosDBShell --prerelease; fi",
      "grep -qxF 'export DOTNET_ROOT=$HOME/.dotnet' ~/.bashrc || echo 'export DOTNET_ROOT=$HOME/.dotnet' >> ~/.bashrc",
      "grep -qxF 'export PATH=$HOME/.dotnet:$HOME/.dotnet/tools:$PATH' ~/.bashrc || echo 'export PATH=$HOME/.dotnet:$HOME/.dotnet/tools:$PATH' >> ~/.bashrc",
    ];

    if (this.credential) {
      // Data Explorer already resolved a credential for this account; pass it to the shell
      // out-of-band via an environment variable so it never appears in argv/ps/history on
      // the remote Cloud Shell host (the CosmosDBShell tool reads both variables natively).
      const envVar = this.credential.kind === "token" ? "COSMOSDB_SHELL_TOKEN" : "COSMOSDB_SHELL_ACCOUNT_KEY";
      setUpCommands.push(`export ${envVar}='${this.credential.value}'`);
    }

    return setUpCommands;
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
      return `echo 'Unable to acquire a ${this.getShellName()} credential. Use "Login for Entra ID" in the Data Explorer toolbar, verify you have Cosmos DB data-plane RBAC access to this account, then reopen the shell.'`;
    }

    // Force gateway (HTTPS/443) connection mode. The shell otherwise defaults to
    // direct (TCP) mode for real accounts, and Azure Cloud Shell blocks the
    // direct-mode TCP ports, causing the connection to fail. `--verbose` surfaces
    // the full exception details when a connection attempt fails.
    //
    // No credential flags are passed: the exported environment variable resolves to the
    // account key (step 1) or the static token credential (step 3) in the tool's
    // credential chain, both of which are terminal and require no interactive sign-in.
    return `cosmosdbshell --connect '${this._endpoint}' --connect-mode gateway --verbose`;
  }

  public getTerminalSuppressedData(): string[] {
    return [];
  }
}
