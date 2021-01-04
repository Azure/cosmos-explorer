import * as Constants from "../../Common/Constants";
import * as DataModels from "../../Contracts/DataModels";
import { AccessInputMetadata } from "../../Contracts/DataModels";
import { DefaultExperienceUtility } from "../../Shared/DefaultExperienceUtility";

export function getDatabaseAccountPropertiesFromMetadata(metadata: AccessInputMetadata): unknown {
  let properties = { documentEndpoint: metadata.documentEndpoint };
  const apiExperience: string = DefaultExperienceUtility.getDefaultExperienceFromApiKind(metadata.apiKind);

  if (apiExperience === Constants.DefaultAccountExperience.Cassandra) {
    properties = Object.assign(properties, {
      cassandraEndpoint: metadata.apiEndpoint,
      capabilities: [{ name: Constants.CapabilityNames.EnableCassandra }]
    });
  } else if (apiExperience === Constants.DefaultAccountExperience.Table) {
    properties = Object.assign(properties, {
      tableEndpoint: metadata.apiEndpoint,
      capabilities: [{ name: Constants.CapabilityNames.EnableTable }]
    });
  } else if (apiExperience === Constants.DefaultAccountExperience.Graph) {
    properties = Object.assign(properties, {
      gremlinEndpoint: metadata.apiEndpoint,
      capabilities: [{ name: Constants.CapabilityNames.EnableGremlin }]
    });
  } else if (apiExperience === Constants.DefaultAccountExperience.MongoDB) {
    if (metadata.apiKind === DataModels.ApiKind.MongoDBCompute) {
      properties = Object.assign(properties, {
        mongoEndpoint: metadata.mongoEndpoint
      });
    }
  }
  return properties;
}

export function getDatabaseAccountKindFromExperience(apiExperience: string): string {
  if (apiExperience === Constants.DefaultAccountExperience.MongoDB) {
    return Constants.AccountKind.MongoDB;
  }

  if (apiExperience === Constants.DefaultAccountExperience.ApiForMongoDB) {
    return Constants.AccountKind.MongoDB;
  }

  return Constants.AccountKind.GlobalDocumentDB;
}

export function extractMasterKeyfromConnectionString(connectionString: string): string {
  // Only Gremlin uses the actual master key for connection to cosmos
  const matchedParts: string[] = connectionString.match("AccountKey=(.*);ApiKind=Gremlin;$");
  return (matchedParts.length > 1 && matchedParts[1]) || undefined;
}
