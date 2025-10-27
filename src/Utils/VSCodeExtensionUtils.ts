import { useTabs } from "hooks/useTabs";
import { userContext } from "UserContext";
import { getHostFromUrl } from "./../Explorer/Tabs/CloudShellTab/Utils/CommonUtils";

export const DOCUMENTDB_VSCODE_EXTENSION_BASEURL = "vscode://ms-azuretools.vscode-documentdb";
export const COSMOSDB_VSCODE_EXTENSION_BASEURL = "vscode://ms-azuretools.vscode-cosmosdb";

/**
 * Generates a VS Code DocumentDB connection URL using the current user's MongoDB connection parameters.
 * Double-encodes the updated connection string for safe usage in VS Code URLs.
 *
 * The DocumentDB VS Code extension requires double encoding for connection strings.
 * See: https://microsoft.github.io/vscode-documentdb/manual/how-to-construct-url.html#double-encoding
 *
 * @returns {string} The encoded VS Code DocumentDB connection URL.
 */
export const getVSCodeUrl = (): string => {
  const isvCore = (userContext.apiType || userContext.databaseAccount.kind) === "VCoreMongo";
  const isMongo =
    userContext.apiType === "Mongo" && userContext.databaseAccount?.properties?.apiProperties?.serverVersion !== "3.2";
  return isvCore ? getDocumentDbUrl() : isMongo ? getMongoRUUrl() : getCosmosDbUrl();
};

export const getCosmosDbUrl = () => {
  const activeTab = useTabs.getState().activeTab;
  const resourceId = encodeURIComponent(userContext.databaseAccount.id);
  const database = encodeURIComponent(activeTab?.collection?.databaseId);
  const container = encodeURIComponent(activeTab?.collection?.id());
  const baseUrl = `${COSMOSDB_VSCODE_EXTENSION_BASEURL}?resourceId=${resourceId}`;
  const vscodeUrl = activeTab ? `${baseUrl}&database=${database}&container=${container}` : baseUrl;
  return vscodeUrl;
};

export const getMongoRUUrl = () => {
  const activeTab = useTabs.getState().activeTab;
  const databaseAccount = userContext.databaseAccount;
  const host = getHostFromUrl(databaseAccount.properties?.mongoEndpoint);
  const port = 10255;
  const database = activeTab?.collection?.databaseId;
  const container = activeTab?.collection?.id();
  const encodedUpdatedConnectionString = encodeURIComponent(`mongodb://${databaseAccount?.name}@${host}:${port}`);
  const documentDbUrl = `${DOCUMENTDB_VSCODE_EXTENSION_BASEURL}?connectionString=${encodedUpdatedConnectionString}${
    database ? `&database=${database}` : ""
  }${container ? `&collection=${container}` : ""}`;

  return documentDbUrl;
};

export const getDocumentDbUrl = () => {
  const { adminLogin: adminLoginuserName = "", connectionString = "" } = userContext.vcoreMongoConnectionParams;
  const updatedConnectionString = connectionString.replace(/<(user|username)>:<password>/i, adminLoginuserName);
  const encodedUpdatedConnectionString = encodeURIComponent(encodeURIComponent(updatedConnectionString));
  const documentDbUrl = `${DOCUMENTDB_VSCODE_EXTENSION_BASEURL}?connectionString=${encodedUpdatedConnectionString}`;
  return documentDbUrl;
};
