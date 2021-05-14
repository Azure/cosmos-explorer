import { AccountKind, CapabilityNames } from "../../Common/Constants";
import { AccessInputMetadata, ApiKind } from "../../Contracts/DataModels";
import { DefaultExperienceUtility } from "../../Shared/DefaultExperienceUtility";
import { userContext } from "../../UserContext";

export function getDatabaseAccountPropertiesFromMetadata(metadata: AccessInputMetadata): unknown {
  let properties = { documentEndpoint: metadata.documentEndpoint };
  const apiExperience = DefaultExperienceUtility.getDefaultExperienceFromApiKind(metadata.apiKind);

  if (apiExperience === "Cassandra") {
    properties = Object.assign(properties, {
      cassandraEndpoint: metadata.apiEndpoint,
      capabilities: [{ name: CapabilityNames.EnableCassandra }],
    });
  } else if (apiExperience === "Tables") {
    properties = Object.assign(properties, {
      tableEndpoint: metadata.apiEndpoint,
      capabilities: [{ name: CapabilityNames.EnableTable }],
    });
  } else if (apiExperience === "Gremlin") {
    properties = Object.assign(properties, {
      gremlinEndpoint: metadata.apiEndpoint,
      capabilities: [{ name: CapabilityNames.EnableGremlin }],
    });
  } else if (apiExperience === "Mongo") {
    if (metadata.apiKind === ApiKind.MongoDBCompute) {
      properties = Object.assign(properties, {
        mongoEndpoint: metadata.mongoEndpoint,
      });
    }
  }
  return properties;
}

export function getDatabaseAccountKindFromExperience(apiExperience: typeof userContext.apiType): AccountKind {
  if (apiExperience === "Mongo") {
    return AccountKind.MongoDB;
  }

  return AccountKind.GlobalDocumentDB;
}

export function extractMasterKeyfromConnectionString(connectionString: string): string {
  // Only Gremlin uses the actual master key for connection to cosmos
  const matchedParts = connectionString.match("AccountKey=(.*);ApiKind=Gremlin;$");
  return (matchedParts && matchedParts.length > 1 && matchedParts[1]) || "";
}
