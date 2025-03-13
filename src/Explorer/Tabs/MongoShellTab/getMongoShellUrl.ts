import { userContext } from "../../../UserContext";

export function getMongoShellUrl(): string {
  const { databaseAccount: account } = userContext;
  const resourceId = account?.id;
  const accountName = account?.name;
  const mongoEndpoint = account?.properties?.mongoEndpoint || account?.properties?.documentEndpoint;
  const queryString = `resourceId=${resourceId}&accountName=${accountName}&mongoEndpoint=${mongoEndpoint}`;

  return `/mongoshell/index.html?${queryString}`;
}
