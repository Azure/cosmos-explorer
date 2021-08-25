import * as Constants from "../../../Common/Constants";
import { AccessInputMetadata, ApiKind } from "../../../Contracts/DataModels";

export function parseConnectionString(connectionString: string): AccessInputMetadata | undefined {
  if (connectionString) {
    try {
      const accessInput = {} as AccessInputMetadata;
      const connectionStringParts = connectionString.split(";");

      connectionStringParts.forEach((connectionStringPart: string) => {
        if (RegExp(Constants.EndpointsRegex.sql).test(connectionStringPart)) {
          const matchArray = connectionStringPart.match(Constants.EndpointsRegex.sql);
          accessInput.accountName = matchArray && matchArray.length > 0 ? matchArray[1] : "";
          accessInput.apiKind = ApiKind.SQL;
        } else if (RegExp(Constants.EndpointsRegex.mongo).test(connectionStringPart)) {
          const matches = connectionStringPart.match(Constants.EndpointsRegex.mongo);
          accessInput.accountName = matches && matches.length > 1 ? matches[2] : "";
          accessInput.apiKind = ApiKind.MongoDB;
        } else if (RegExp(Constants.EndpointsRegex.mongoCompute).test(connectionStringPart)) {
          const matches = connectionStringPart.match(Constants.EndpointsRegex.mongoCompute);
          accessInput.accountName = matches && matches.length > 1 ? matches[2] : "";
          accessInput.apiKind = ApiKind.MongoDBCompute;
        } else if (Constants.EndpointsRegex.cassandra.some((regex) => RegExp(regex).test(connectionStringPart))) {
          Constants.EndpointsRegex.cassandra.forEach((regex) => {
            if (RegExp(regex).test(connectionStringPart)) {
              const matchArray = connectionStringPart.match(regex);
              accessInput.accountName = matchArray && matchArray.length > 0 ? matchArray[1] : "";
              accessInput.apiKind = ApiKind.Cassandra;
            }
          });
        } else if (RegExp(Constants.EndpointsRegex.table).test(connectionStringPart)) {
          const matchArray = connectionStringPart.match(Constants.EndpointsRegex.table);
          accessInput.accountName = matchArray && matchArray.length > 0 ? matchArray[1] : "";
          accessInput.apiKind = ApiKind.Table;
        } else if (connectionStringPart.indexOf("ApiKind=Gremlin") >= 0) {
          accessInput.apiKind = ApiKind.Graph;
        }
      });

      if (Object.keys(accessInput).length === 0) {
        return undefined;
      }

      return accessInput;
    } catch (error) {
      return undefined;
    }
  }

  return undefined;
}
