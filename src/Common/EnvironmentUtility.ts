export default class EnvironmentUtility {
  public static normalizeArmEndpointUri(uri: string): string {
    if (uri && uri.slice(-1) !== "/") {
      return `${uri}/`;
    }
    return uri;
  }
}
