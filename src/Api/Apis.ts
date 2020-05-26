import * as ViewModels from "../Contracts/ViewModels";

export class DefaultApi implements ViewModels.CosmosDbApi {
  public isSystemDatabasePredicate = (database: ViewModels.Database): boolean => {
    return false;
  };
}

export class CassandraApi implements ViewModels.CosmosDbApi {
  public isSystemDatabasePredicate = (database: ViewModels.Database): boolean => {
    return database.id() === "system";
  };
}
