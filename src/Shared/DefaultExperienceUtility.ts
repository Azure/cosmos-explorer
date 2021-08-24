import * as DataModels from "../Contracts/DataModels";
import { userContext } from "../UserContext";

export class DefaultExperienceUtility {
  public static getApiKindFromDefaultExperience(
    defaultExperience: typeof userContext.apiType | null
  ): DataModels.ApiKind {
    if (!defaultExperience) {
      return DataModels.ApiKind.SQL;
    }

    switch (defaultExperience) {
      case "SQL":
        return DataModels.ApiKind.SQL;
      case "Mongo":
        return DataModels.ApiKind.MongoDB;
      case "Tables":
        return DataModels.ApiKind.Table;
      case "Cassandra":
        return DataModels.ApiKind.Cassandra;
      case "Gremlin":
        return DataModels.ApiKind.Graph;
      default:
        return DataModels.ApiKind.SQL;
    }
  }

  public static getDefaultExperienceFromApiKind(apiKind: DataModels.ApiKind): typeof userContext.apiType {
    if (apiKind == null) {
      return "SQL";
    }

    switch (apiKind) {
      case DataModels.ApiKind.SQL:
        return "SQL";
      case DataModels.ApiKind.MongoDB:
      case DataModels.ApiKind.MongoDBCompute:
        return "Mongo";
      case DataModels.ApiKind.Table:
        return "Tables";
      case DataModels.ApiKind.Cassandra:
        return "Cassandra";
      case DataModels.ApiKind.Graph:
        return "Gremlin";
      default:
        return "SQL";
    }
  }
}
