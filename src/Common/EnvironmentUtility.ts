export function normalizeArmEndpoint(uri: string): string {
  if (uri && uri.slice(-1) !== "/") {
    return `${uri}/`;
  }
  return uri;
}
