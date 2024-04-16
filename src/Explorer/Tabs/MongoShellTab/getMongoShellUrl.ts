import { configContext } from "ConfigContext";
import { userContext } from "../../../UserContext";

export function getMongoShellUrl(useMongoProxyEndpoint?: boolean): URL {
  const { databaseAccount: account } = userContext;
  const resourceId = account?.id;
  const accountName = account?.name;
  const mongoEndpoint = account?.properties?.mongoEndpoint || account?.properties?.documentEndpoint;
  const queryString = `resourceId=${resourceId}&accountName=${accountName}&mongoEndpoint=${mongoEndpoint}`;
  const path: string = useMongoProxyEndpoint ? `/index.html?${queryString}` : `/indexv2.html?${queryString}`;
  
  return new URL(path, configContext.hostedExplorerURL);
}
