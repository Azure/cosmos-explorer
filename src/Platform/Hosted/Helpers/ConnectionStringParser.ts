import * as Constants from "../../../Common/Constants";
import * as DataModels from "../../../Contracts/DataModels";

export class ConnectionStringParser {
  public static parseConnectionString(connectionString: string): DataModels.AccessInputMetadata {
    if (!!connectionString) {
      try {
        const accessInput: DataModels.AccessInputMetadata = {} as DataModels.AccessInputMetadata;
        const connectionStringParts = connectionString.split(";");

        connectionStringParts.forEach((connectionStringPart: string) => {
          if (RegExp(Constants.EndpointsRegex.sql).test(connectionStringPart)) {
            accessInput.accountName = connectionStringPart.match(Constants.EndpointsRegex.sql)[1];
            accessInput.apiKind = DataModels.ApiKind.SQL;
          } else if (RegExp(Constants.EndpointsRegex.mongo).test(connectionStringPart)) {
            const matches: string[] = connectionStringPart.match(Constants.EndpointsRegex.mongo);
            accessInput.accountName = matches && matches.length > 1 && matches[2];
            accessInput.apiKind = DataModels.ApiKind.MongoDB;
          } else if (RegExp(Constants.EndpointsRegex.mongoCompute).test(connectionStringPart)) {
            const matches: string[] = connectionStringPart.match(Constants.EndpointsRegex.mongoCompute);
            accessInput.accountName = matches && matches.length > 1 && matches[2];
            accessInput.apiKind = DataModels.ApiKind.MongoDBCompute;
          } else if (Constants.EndpointsRegex.cassandra.some((regex) => RegExp(regex).test(connectionStringPart))) {
            Constants.EndpointsRegex.cassandra.forEach((regex) => {
              if (RegExp(regex).test(connectionStringPart)) {
                accessInput.accountName = connectionStringPart.match(regex)[1];
                accessInput.apiKind = DataModels.ApiKind.Cassandra;
              }
            });
          } else if (RegExp(Constants.EndpointsRegex.table).test(connectionStringPart)) {
            accessInput.accountName = connectionStringPart.match(Constants.EndpointsRegex.table)[1];
            accessInput.apiKind = DataModels.ApiKind.Table;
          } else if (connectionStringPart.indexOf("ApiKind=Gremlin") >= 0) {
            accessInput.apiKind = DataModels.ApiKind.Graph;
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
}
