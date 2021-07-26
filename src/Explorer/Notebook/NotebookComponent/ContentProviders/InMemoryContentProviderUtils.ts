// memory://<path>
// Custom scheme for in memory content
export const ContentUriPattern = /memory:\/\/([^/]*)/;

export function fromContentUri(contentUri: string): undefined | string {
  const matches = contentUri.match(ContentUriPattern);
  if (matches && matches.length > 1) {
    return matches[1];
  }
  return undefined;
}

export function toContentUri(path: string): string {
  return `memory://${path}`;
}
