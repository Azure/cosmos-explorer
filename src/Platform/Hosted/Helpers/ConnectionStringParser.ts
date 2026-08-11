import * as Constants from "../../../Common/Constants";
import { AccessInputMetadata, ApiKind } from "../../../Contracts/DataModels";

// Cosmos DB DNS zones used to construct endpoints client-side. These mirror what the Portal Backend's
// accessinputmetadata API constructs from the account name for SQL, Tables, and Gremlin accounts.
const DocumentEndpointZone = "documents.azure.com";
const GremlinEndpointZone = "gremlin.cosmos.azure.com";
const DnsPort = "443";

export function parseConnectionString(connectionString: string): AccessInputMetadata {
  if (connectionString) {
    try {
      const accessInput = {} as AccessInputMetadata;
      const connectionStringParts = connectionString.split(";");

      connectionStringParts.forEach((connectionStringPart: string) => {
        if (RegExp(Constants.EndpointsRegex.sql).test(connectionStringPart)) {
          accessInput.accountName = connectionStringPart.match(Constants.EndpointsRegex.sql)[1];
          accessInput.apiKind = ApiKind.SQL;
        } else if (RegExp(Constants.EndpointsRegex.mongo).test(connectionStringPart)) {
          const matches: string[] = connectionStringPart.match(Constants.EndpointsRegex.mongo);
          accessInput.accountName = matches && matches.length > 1 && matches[2];
          accessInput.apiKind = ApiKind.MongoDB;
        } else if (RegExp(Constants.EndpointsRegex.mongoCompute).test(connectionStringPart)) {
          const matches: string[] = connectionStringPart.match(Constants.EndpointsRegex.mongoCompute);
          accessInput.accountName = matches && matches.length > 1 && matches[2];
          accessInput.apiKind = ApiKind.MongoDBCompute;
        } else if (Constants.EndpointsRegex.cassandra.some((regex) => RegExp(regex).test(connectionStringPart))) {
          Constants.EndpointsRegex.cassandra.forEach((regex) => {
            if (RegExp(regex).test(connectionStringPart)) {
              accessInput.accountName = connectionStringPart.match(regex)[1];
              accessInput.apiKind = ApiKind.Cassandra;
            }
          });
        } else if (RegExp(Constants.EndpointsRegex.table).test(connectionStringPart)) {
          accessInput.accountName = connectionStringPart.match(Constants.EndpointsRegex.table)[1];
          accessInput.apiKind = ApiKind.Table;
        } else if (connectionStringPart.indexOf("ApiKind=Gremlin") >= 0) {
          accessInput.apiKind = ApiKind.Graph;
        }
      });

      if (Object.keys(accessInput).length === 0) {
        return undefined;
      }

      // For the APIs that log in directly through the Cosmos client (SQL, Tables, Gremlin), derive the
      // endpoints client-side instead of Portal Backend's accessinputmetadata call. Tables
      // connection strings only carry the table endpoint, so the document endpoint is always constructed
      // from the account name. Gremlin also needs its graph endpoint for websocket queries.
      if (accessInput.accountName) {
        if (
          accessInput.apiKind === ApiKind.SQL ||
          accessInput.apiKind === ApiKind.Table ||
          accessInput.apiKind === ApiKind.Graph
        ) {
          accessInput.documentEndpoint = `https://${accessInput.accountName}.${DocumentEndpointZone}:${DnsPort}/`;
          if (accessInput.apiKind === ApiKind.Graph) {
            accessInput.apiEndpoint = `${accessInput.accountName}.${GremlinEndpointZone}:${DnsPort}`;
          }
        }
      }

      return accessInput;
    } catch (error) {
      return undefined;
    }
  }

  return undefined;
}
