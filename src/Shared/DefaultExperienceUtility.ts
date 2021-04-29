import * as _ from "underscore";
import * as Constants from "../Common/Constants";
import * as DataModels from "../Contracts/DataModels";

export class DefaultExperienceUtility {
  public static getDefaultExperienceFromDatabaseAccount(databaseAccount: DataModels.DatabaseAccount): string | null {
    if (!databaseAccount) {
      return null;
    }

    const kind: string =
      databaseAccount && databaseAccount.kind && databaseAccount.kind && databaseAccount.kind.toLowerCase();
    const capabilities = (databaseAccount.properties && databaseAccount.properties.capabilities) || [];

    return DefaultExperienceUtility._getDefaultExperience(kind, capabilities);
  }

  public static getApiKindFromDefaultExperience(defaultExperience: string): DataModels.ApiKind {
    if (!defaultExperience) {
      return DataModels.ApiKind.SQL;
    }

    switch (defaultExperience) {
      case Constants.DefaultAccountExperience.DocumentDB:
        return DataModels.ApiKind.SQL;
      case Constants.DefaultAccountExperience.MongoDB:
      case Constants.DefaultAccountExperience.ApiForMongoDB:
        return DataModels.ApiKind.MongoDB;
      case Constants.DefaultAccountExperience.Table:
        return DataModels.ApiKind.Table;
      case Constants.DefaultAccountExperience.Cassandra:
        return DataModels.ApiKind.Cassandra;
      case Constants.DefaultAccountExperience.Graph:
        return DataModels.ApiKind.Graph;
      default:
        return DataModels.ApiKind.SQL;
    }
  }

  public static getDefaultExperienceFromApiKind(apiKind: DataModels.ApiKind): string {
    if (apiKind == null) {
      return Constants.DefaultAccountExperience.Default;
    }

    switch (apiKind) {
      case DataModels.ApiKind.SQL:
        return Constants.DefaultAccountExperience.DocumentDB;
      case DataModels.ApiKind.MongoDB:
      case DataModels.ApiKind.MongoDBCompute:
        return Constants.DefaultAccountExperience.MongoDB;
      case DataModels.ApiKind.Table:
        return Constants.DefaultAccountExperience.Table;
      case DataModels.ApiKind.Cassandra:
        return Constants.DefaultAccountExperience.Cassandra;
      case DataModels.ApiKind.Graph:
        return Constants.DefaultAccountExperience.Graph;
      default:
        return Constants.DefaultAccountExperience.Default;
    }
  }

  private static _getDefaultExperience(kind: string, capabilities: DataModels.Capability[]): string {
    const defaultDefaultExperience: string = Constants.DefaultAccountExperience.DocumentDB;
    const defaultExperienceFromKind: string = DefaultExperienceUtility._getDefaultExperienceFromAccountKind(kind) || "";
    const defaultExperienceFromCapabilities: string =
      DefaultExperienceUtility._getDefaultExperienceFromAccountCapabilities(capabilities) || "";
    if (!!defaultExperienceFromKind) {
      return defaultExperienceFromKind;
    }

    if (!!defaultExperienceFromCapabilities) {
      return defaultExperienceFromCapabilities;
    }

    return defaultDefaultExperience;
  }

  private static _getDefaultExperienceFromAccountKind(kind: string): string | null {
    if (!kind) {
      return null;
    }

    if (kind.toLowerCase() === Constants.AccountKind.MongoDB.toLowerCase()) {
      return Constants.DefaultAccountExperience.MongoDB;
    }

    if (kind.toLowerCase() === Constants.AccountKind.Parse.toLowerCase()) {
      return Constants.DefaultAccountExperience.MongoDB;
    }

    return null;
  }

  private static _getDefaultExperienceFromAccountCapabilities(capabilities: DataModels.Capability[]): string | null {
    if (!capabilities) {
      return null;
    }

    if (!Array.isArray(capabilities)) {
      return null;
    }

    const enableTable = DefaultExperienceUtility._findCapability(capabilities, Constants.CapabilityNames.EnableTable);
    if (enableTable) {
      return Constants.DefaultAccountExperience.Table;
    }

    const enableGremlin = DefaultExperienceUtility._findCapability(
      capabilities,
      Constants.CapabilityNames.EnableGremlin
    );
    if (enableGremlin) {
      return Constants.DefaultAccountExperience.Graph;
    }

    const enableCassandra = DefaultExperienceUtility._findCapability(
      capabilities,
      Constants.CapabilityNames.EnableCassandra
    );
    if (enableCassandra) {
      return Constants.DefaultAccountExperience.Cassandra;
    }

    return null;
  }

  private static _findCapability(capabilities: DataModels.Capability[], capabilityName: string): DataModels.Capability {
    return _.find(capabilities, (capability) => {
      return capability && capability.name && capability.name.toLowerCase() === capabilityName.toLowerCase();
    });
  }
}
