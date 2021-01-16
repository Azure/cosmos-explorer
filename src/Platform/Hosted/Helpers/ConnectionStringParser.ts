import * as Constants from "../../../Common/Constants";
import * as DataModels from "../../../Contracts/DataModels";

export class ConnectionStringParser {
  public static parseConnectionString(connectionString: string): DataModels.AccessInputMetadata | undefined {
    if (!!connectionString) {
      try {
        const accessInput: DataModels.AccessInputMetadata = {} as DataModels.AccessInputMetadata;
        const connectionStringParts = connectionString.split(";");

        connectionStringParts.forEach((connectionStringPart: string) => {
          const sqlMatchResult = connectionStringPart.match(Constants.EndpointsRegex.sql);
          const mongoMatchResult = connectionStringPart.match(Constants.EndpointsRegex.mongo);
          const mongoComputeMatchResult = connectionStringPart.match(Constants.EndpointsRegex.mongoCompute);
          const tableMatchResult = connectionStringPart.match(Constants.EndpointsRegex.table);

          if (sqlMatchResult && sqlMatchResult.length > 1) {
            accessInput.accountName = sqlMatchResult[1];
            accessInput.apiKind = DataModels.ApiKind.SQL;
          } else if (mongoMatchResult && mongoMatchResult.length > 2) {
            accessInput.accountName = mongoMatchResult[2];
            accessInput.apiKind = DataModels.ApiKind.MongoDB;
          } else if (mongoComputeMatchResult && mongoComputeMatchResult.length > 2) {
            accessInput.accountName = mongoComputeMatchResult[2];
            accessInput.apiKind = DataModels.ApiKind.MongoDBCompute;
          } else if (
            Constants.EndpointsRegex.cassandra &&
            Constants.EndpointsRegex.cassandra.some(regex => RegExp(regex).test(connectionStringPart))
          ) {
            Constants.EndpointsRegex.cassandra.forEach(regex => {
              if (RegExp(regex).test(connectionStringPart)) {
                const connectionMatch = connectionStringPart.match(regex);
                if (connectionMatch && connectionMatch.length > 1) {
                  accessInput.accountName = connectionMatch[1];
                  accessInput.apiKind = DataModels.ApiKind.Cassandra;
                }
              }
            });
          } else if (tableMatchResult && tableMatchResult.length > 1) {
            accessInput.accountName = tableMatchResult[1];
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
