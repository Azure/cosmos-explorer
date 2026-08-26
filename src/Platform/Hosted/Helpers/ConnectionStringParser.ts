import { configContext } from "../../../ConfigContext";
import { AccessInputMetadata, ApiKind } from "../../../Contracts/DataModels";

const PpeDnsSuffix = "windows-ppe.net";
const DnsPort = "443";

const isPpeZone = (zone: string): boolean => zone.endsWith(PpeDnsSuffix);

// Picks the DNS zone matching the kind of account the connection string came from, since a PPE
// account's endpoints sit under PPE zones and every other account's do not. Returns undefined when the
// config carries no zone of that kind, so the caller can reject the connection string rather than build
// an endpoint the account does not own and send the account key there.
export const selectEndpointZone = (zones: ReadonlyArray<string>, isPpeAccount: boolean): string | undefined =>
  zones.find((zone) => isPpeZone(zone) === isPpeAccount);

// Builds an alternation matching any of the given DNS zones, e.g. "(documents\.azure\.com|sql\.cosmos\.azure\.com)".
// The group captures so callers can tell which zone matched, and with it whether the account is a PPE account.
// The zone has to run to the end of the host, otherwise a host that merely starts with an allowed zone
// would pass as that zone and the account key would travel to whatever was appended to it.
export const dnsZoneAlternation = (zones: ReadonlyArray<string>): string =>
  `(${zones.map((zone) => zone.replace(/\./g, "\\.")).join("|")})(?=[:/\\s]|$)`;

// The zone lists live in ConfigContext, which is populated asynchronously by initializeConfiguration,
// so these are built per call rather than once at module load.
export const buildEndpointsRegex = () => ({
  sql: `AccountEndpoint=https://([^.]+)\\.${dnsZoneAlternation(configContext.SQL_DNS_ZONES)}`,
  mongo: `mongodb://.*:(.*)@([^.]+)\\.${dnsZoneAlternation(configContext.MONGO_DNS_ZONES)}`,
  mongoCompute: `mongodb://.*:(.*)@([^.]+)\\.${dnsZoneAlternation(configContext.MONGO_COMPUTE_DNS_ZONES)}`,
  cassandra: ["AccountEndpoint", "HostName"].map(
    (key) => `${key}=([^.]+)\\.${dnsZoneAlternation(configContext.CASSANDRA_DNS_ZONES)}`,
  ),
  table: `TableEndpoint=https://([^.]+)\\.${dnsZoneAlternation(configContext.TABLE_DNS_ZONES)}`,
});

export function parseConnectionString(connectionString: string): AccessInputMetadata {
  if (connectionString) {
    try {
      const accessInput = {} as AccessInputMetadata;
      const connectionStringParts = connectionString.split(";");
      const endpointsRegex = buildEndpointsRegex();
      // Endpoints we build from the account name have to match the kind of zone the connection string
      // actually matched, since PPE accounts and other accounts do not share zones.
      let isPpeAccount = false;

      connectionStringParts.forEach((connectionStringPart: string) => {
        if (RegExp(endpointsRegex.sql).test(connectionStringPart)) {
          const matches: string[] = connectionStringPart.match(endpointsRegex.sql);
          accessInput.accountName = matches[1];
          accessInput.apiKind = ApiKind.SQL;
          // SQL and Gremlin connection strings carry the account's document endpoint, so take it as
          // given instead of rebuilding it from the account name.
          accessInput.documentEndpoint = connectionStringPart.substring(connectionStringPart.indexOf("=") + 1);
          isPpeAccount = isPpeZone(matches[2]);
        } else if (RegExp(endpointsRegex.mongo).test(connectionStringPart)) {
          const matches: string[] = connectionStringPart.match(endpointsRegex.mongo);
          accessInput.accountName = matches && matches.length > 1 && matches[2];
          accessInput.apiKind = ApiKind.MongoDB;
        } else if (RegExp(endpointsRegex.mongoCompute).test(connectionStringPart)) {
          const matches: string[] = connectionStringPart.match(endpointsRegex.mongoCompute);
          accessInput.accountName = matches && matches.length > 1 && matches[2];
          accessInput.apiKind = ApiKind.MongoDBCompute;
        } else if (endpointsRegex.cassandra.some((regex) => RegExp(regex).test(connectionStringPart))) {
          endpointsRegex.cassandra.forEach((regex) => {
            if (RegExp(regex).test(connectionStringPart)) {
              accessInput.accountName = connectionStringPart.match(regex)[1];
              accessInput.apiKind = ApiKind.Cassandra;
            }
          });
        } else if (RegExp(endpointsRegex.table).test(connectionStringPart)) {
          const matches: string[] = connectionStringPart.match(endpointsRegex.table);
          accessInput.accountName = matches[1];
          accessInput.apiKind = ApiKind.Table;
          isPpeAccount = isPpeZone(matches[2]);
        } else if (connectionStringPart.indexOf("ApiKind=Gremlin") >= 0) {
          accessInput.apiKind = ApiKind.Graph;
        }
      });

      if (Object.keys(accessInput).length === 0) {
        return undefined;
      }

      // Table connection strings only carry the table endpoint, so the document endpoint that data plane
      // operations go through has to be derived from the account name. Gremlin accounts additionally
      // need the Gremlin endpoint, which is never part of the connection string.
      if (accessInput.accountName) {
        if (accessInput.apiKind === ApiKind.Table) {
          const documentEndpointZone = selectEndpointZone(configContext.DOCUMENT_ENDPOINT_ZONES, isPpeAccount);
          if (!documentEndpointZone) {
            return undefined;
          }
          accessInput.documentEndpoint = `https://${accessInput.accountName}.${documentEndpointZone}:${DnsPort}/`;
        } else if (accessInput.apiKind === ApiKind.Graph) {
          const gremlinEndpointZone = selectEndpointZone(configContext.GREMLIN_ENDPOINT_ZONES, isPpeAccount);
          if (!gremlinEndpointZone) {
            return undefined;
          }
          accessInput.apiEndpoint = `${accessInput.accountName}.${gremlinEndpointZone}:${DnsPort}`;
        }
      }

      return accessInput;
    } catch (error) {
      return undefined;
    }
  }

  return undefined;
}
