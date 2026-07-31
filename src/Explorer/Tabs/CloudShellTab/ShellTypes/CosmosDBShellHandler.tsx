import { userContext } from "../../../../UserContext";
import { AbstractShellHandler } from "./AbstractShellHandler";

/**
 * A credential resolved by Data Explorer and handed to the Cosmos DB Shell.
 *
 * - `token` is an Entra ID (AAD) bearer token scoped to the account's data plane. It is
 *   exported as COSMOSDB_SHELL_TOKEN (a connection string cannot carry an AAD token) and
 *   the connect command targets the bare account endpoint.
 * - `key` is an account master (or read-only) key. It is delivered as a full connection
 *   string (`AccountEndpoint=...;AccountKey=...;`) passed directly to `--connect`, so a
 *   single string carries everything the tool needs.
 *
 * The kind is tracked explicitly so the correct delivery mechanism is always used.
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
   * 5. For an Entra ID token credential, export it as an environment variable so it never
   *    appears in the process arguments or shell history on the Cloud Shell host. (A key
   *    credential is instead delivered as a connection string on the connect command; see
   *    getConnectionCommand.)
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

    if (this.credential?.kind === "token") {
      // Data Explorer resolved an Entra ID token; pass it to the shell out-of-band via an
      // environment variable so it never appears in argv/ps/history on the remote Cloud
      // Shell host (the CosmosDBShell tool reads COSMOSDB_SHELL_TOKEN natively). A key
      // credential is delivered as a connection string on the connect line instead.
      setUpCommands.push(`export COSMOSDB_SHELL_TOKEN='${this.credential.value}'`);
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
    // For a key credential, pass a full connection string (endpoint + key in one value)
    // straight to `--connect`. The CosmosDBShell tool reads the connect argument without
    // echoing it, so the key does not land in ps/history. For a token credential, connect
    // to the bare endpoint and let the exported COSMOSDB_SHELL_TOKEN resolve the identity.
    const connectTarget =
      this.credential.kind === "key"
        ? `AccountEndpoint=${this._endpoint};AccountKey=${this.credential.value};`
        : this._endpoint;
    return `cosmosdbshell --connect '${connectTarget}' --connect-mode gateway --verbose`;
  }

  public getTerminalSuppressedData(): string[] {
    return [];
  }
}
