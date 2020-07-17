import * as Constants from "../Common/Constants";
import * as ViewModels from "../Contracts/ViewModels";
import { AuthType } from "../AuthType";
import { StringUtils } from "../Utils/StringUtils";
import Explorer from "../Explorer/Explorer";

export default class EnvironmentUtility {
  public static getMongoBackendEndpoint(serverId: string, location: string, extensionEndpoint: string = ""): string {
    const defaultEnvironment: string = "default";
    const defaultLocation: string = "default";
    let environment: string = serverId;
    const endpointType: Constants.MongoBackendEndpointType =
      Constants.MongoBackend.endpointsByEnvironment[environment] ||
      Constants.MongoBackend.endpointsByEnvironment[defaultEnvironment];
    if (endpointType === Constants.MongoBackendEndpointType.local) {
      return `${extensionEndpoint}${Constants.MongoBackend.localhostEndpoint}`;
    }

    const normalizedLocation = EnvironmentUtility.normalizeRegionName(location);
    return (
      Constants.MongoBackend.endpointsByRegion[normalizedLocation] ||
      Constants.MongoBackend.endpointsByRegion[defaultLocation]
    );
  }

  public static isAadUser(): boolean {
    return window.authType === AuthType.AAD;
  }

  public static getCassandraBackendEndpoint(explorer: Explorer): string {
    const defaultLocation: string = "default";
    const location: string = EnvironmentUtility.normalizeRegionName(explorer.databaseAccount().location);
    return (
      Constants.CassandraBackend.endpointsByRegion[location] ||
      Constants.CassandraBackend.endpointsByRegion[defaultLocation]
    );
  }

  public static normalizeArmEndpointUri(uri: string): string {
    if (uri && uri.slice(-1) !== "/") {
      return `${uri}/`;
    }
    return uri;
  }

  private static normalizeRegionName(region: string): string {
    return region && StringUtils.stripSpacesFromString(region.toLocaleLowerCase());
  }
}
