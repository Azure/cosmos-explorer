import * as Constants from "../../../Common/Constants";
import { AccessInputMetadata, ApiKind } from "../../../Contracts/DataModels";

// Cosmos DB DNS zones used to construct endpoints client-side. These mirror what the Portal Backend's
// accessinputmetadata API constructs from the account name when the connection string does not already
// contain the endpoint.
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
          // SQL and Gremlin connection strings carry the account's document endpoint, so take it as
          // given instead of rebuilding it from the account name.
          accessInput.documentEndpoint = connectionStringPart.substring(connectionStringPart.indexOf("=") + 1);
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

      // Tables connection strings only carry the table endpoint, so the document endpoint that data
      // operations go through has to be derived from the account name. Gremlin accounts additionally
      // need the Gremlin endpoint, which is never part of the connection string.
      if (accessInput.accountName) {
        if (accessInput.apiKind === ApiKind.Table) {
          accessInput.documentEndpoint = `https://${accessInput.accountName}.${DocumentEndpointZone}:${DnsPort}/`;
        } else if (accessInput.apiKind === ApiKind.Graph) {
          accessInput.apiEndpoint = `${accessInput.accountName}.${GremlinEndpointZone}:${DnsPort}`;
        }
      }

      return accessInput;
    } catch (error) {
      return undefined;
    }
  }

  return undefined;
}
