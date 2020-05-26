import * as Constants from "../../Common/Constants";
import * as DataModels from "../../Contracts/DataModels";
import { AccessInputMetadata } from "../../Contracts/DataModels";
import { DefaultExperienceUtility } from "../../Shared/DefaultExperienceUtility";

export class HostedUtils {
  static getDatabaseAccountPropertiesFromMetadata(metadata: AccessInputMetadata): any {
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
}
