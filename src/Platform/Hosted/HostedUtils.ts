import { AccountKind, CapabilityNames, DefaultAccountExperience } from "../../Common/Constants";
import { AccessInputMetadata, ApiKind } from "../../Contracts/DataModels";
import { DefaultExperienceUtility } from "../../Shared/DefaultExperienceUtility";

export function getDatabaseAccountPropertiesFromMetadata(metadata: AccessInputMetadata): unknown {
  let properties = { documentEndpoint: metadata.documentEndpoint };
  const apiExperience: string = DefaultExperienceUtility.getDefaultExperienceFromApiKind(metadata.apiKind);

  if (apiExperience === DefaultAccountExperience.Cassandra) {
    properties = Object.assign(properties, {
      cassandraEndpoint: metadata.apiEndpoint,
      capabilities: [{ name: CapabilityNames.EnableCassandra }],
    });
  } else if (apiExperience === DefaultAccountExperience.Table) {
    properties = Object.assign(properties, {
      tableEndpoint: metadata.apiEndpoint,
      capabilities: [{ name: CapabilityNames.EnableTable }],
    });
  } else if (apiExperience === DefaultAccountExperience.Graph) {
    properties = Object.assign(properties, {
      gremlinEndpoint: metadata.apiEndpoint,
      capabilities: [{ name: CapabilityNames.EnableGremlin }],
    });
  } else if (apiExperience === DefaultAccountExperience.MongoDB) {
    if (metadata.apiKind === ApiKind.MongoDBCompute) {
      properties = Object.assign(properties, {
        mongoEndpoint: metadata.mongoEndpoint,
      });
    }
  }
  return properties;
}

export function getDatabaseAccountKindFromExperience(apiExperience: string): string {
  if (apiExperience === DefaultAccountExperience.MongoDB) {
    return AccountKind.MongoDB;
  }

  if (apiExperience === DefaultAccountExperience.ApiForMongoDB) {
    return AccountKind.MongoDB;
  }

  return AccountKind.GlobalDocumentDB;
}

export function extractMasterKeyfromConnectionString(connectionString: string): string {
  // Only Gremlin uses the actual master key for connection to cosmos
  const matchedParts = connectionString.match("AccountKey=(.*);ApiKind=Gremlin;$");
  return (matchedParts && matchedParts.length > 1 && matchedParts[1]) || undefined;
}
