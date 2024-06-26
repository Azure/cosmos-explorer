import { userContext } from "../../../UserContext";

export function getMongoShellUrl(useMongoProxyEndpoint?: boolean): string {
  const { databaseAccount: account } = userContext;
  const resourceId = account?.id;
  const accountName = account?.name;
  const mongoEndpoint = account?.properties?.mongoEndpoint || account?.properties?.documentEndpoint;
  const queryString = `resourceId=${resourceId}&accountName=${accountName}&mongoEndpoint=${mongoEndpoint}`;

  return useMongoProxyEndpoint ? `/mongoshell/index.html?${queryString}` : `/mongoshell/indexv2.html?${queryString}`;
}
