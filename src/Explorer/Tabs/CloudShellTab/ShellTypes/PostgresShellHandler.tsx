import { userContext } from "../../../../UserContext";
import { AbstractShellHandler } from "./AbstractShellHandler";

const PACKAGE_VERSION: string = "15.2";

export class PostgresShellHandler extends AbstractShellHandler {
  private _endpoint: string | undefined;

  constructor() {
    super();
    this._endpoint = userContext?.databaseAccount?.properties?.postgresqlEndpoint;
  }

  public getShellName(): string {
    return "PostgreSQL";
  }

  /**
   * PostgreSQL setup commands for CloudShell:
   *
   * 1. Check if psql client is already installed
   * 2. Download PostgreSQL source package if needed
   * 3. Extract the PostgreSQL package
   * 4. Create installation directory
   * 5. Download and extract readline dependency
   * 6. Configure readline with appropriate installation path
   * 7. Add PostgreSQL binaries to system PATH
   * 8. Apply PATH changes
   *
   * All installation steps run conditionally only if
   * psql is not already available in the environment.
   */
  public getSetUpCommands(): string[] {
    return [
      "if ! command -v psql &> /dev/null; then echo '⚠️ psql not found. Installing...'; fi",
      `if ! command -v psql &> /dev/null; then curl -LO https://ftp.postgresql.org/pub/source/v${PACKAGE_VERSION}/postgresql-${PACKAGE_VERSION}.tar.bz2; fi`,
      `if ! command -v psql &> /dev/null; then tar -xvjf postgresql-${PACKAGE_VERSION}.tar.bz2; fi`,
      "if ! command -v psql &> /dev/null; then mkdir -p ~/pgsql; fi",
      "if ! command -v psql &> /dev/null; then curl -LO https://ftp.gnu.org/gnu/readline/readline-8.1.tar.gz; fi",
      "if ! command -v psql &> /dev/null; then tar -xvzf readline-8.1.tar.gz; fi",
      "if ! command -v psql &> /dev/null; then cd readline-8.1 && ./configure --prefix=$HOME/pgsql; fi",
      "if ! command -v psql &> /dev/null; then echo 'export PATH=$HOME/pgsql/bin:$PATH' >> ~/.bashrc; fi",
      "source ~/.bashrc",
    ];
  }

  public getConnectionCommand(): string {
    if (!this._endpoint) {
      return `echo '${this.getShellName()} endpoint not found.'`;
    }

    // Database name is hardcoded as "citus" because Azure Cosmos DB for PostgreSQL
    // uses Citus as its distributed database extension with this default database name.
    // All Azure Cosmos DB PostgreSQL deployments follow this convention.
    // Ref. https://learn.microsoft.com/en-us/azure/cosmos-db/postgresql/reference-limits#database-creation
    const loginName = userContext.postgresConnectionStrParams.adminLogin;
    return `psql -h "${this._endpoint}" -p 5432 -d "citus" -U "${loginName}" --set=sslmode=require --set=application_name=${this.APP_NAME}`;
  }

  public getTerminalSuppressedData(): string[] {
    return [""];
  }
}
