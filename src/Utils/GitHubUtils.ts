export class GitHubUtils {
  // https://github.com/<owner>/<repo>/tree/<branch>
  // The url when users visit a repo/branch on github.com
  private static readonly RepoUriPattern = /https:\/\/github.com\/([^/]*)\/([^/]*)\/tree\/([^?]*)/;

  // github://<owner>/<repo>/<path>?ref=<branch>
  // Custom scheme for github content
  private static readonly ContentUriPattern = /github:\/\/([^/]*)\/([^/]*)\/([^?]*)\?ref=(.*)/;

  // https://github.com/<owner>/<repo>/blob/<branch>/<path>
  // We need to support this until we move to newer scheme for quickstarts
  private static readonly LegacyContentUriPattern = /https:\/\/github.com\/([^/]*)\/([^/]*)\/blob\/([^/]*)\/([^?]*)/;

  public static toRepoFullName(owner: string, repo: string): string {
    return `${owner}/${repo}`;
  }

  public static fromRepoUri(repoUri: string): undefined | { owner: string; repo: string; branch: string } {
    const matches = repoUri.match(GitHubUtils.RepoUriPattern);
    if (matches && matches.length > 3) {
      return {
        owner: matches[1],
        repo: matches[2],
        branch: matches[3]
      };
    }

    return undefined;
  }

  public static fromContentUri(
    contentUri: string
  ): undefined | { owner: string; repo: string; branch: string; path: string } {
    let matches = contentUri.match(GitHubUtils.ContentUriPattern);
    if (matches && matches.length > 4) {
      return {
        owner: matches[1],
        repo: matches[2],
        branch: matches[4],
        path: matches[3]
      };
    }

    matches = contentUri.match(GitHubUtils.LegacyContentUriPattern);
    if (matches && matches.length > 4) {
      console.log(`Using legacy github content uri scheme ${contentUri}`);

      return {
        owner: matches[1],
        repo: matches[2],
        branch: matches[3],
        path: matches[4]
      };
    }

    return undefined;
  }

  public static toContentUri(owner: string, repo: string, branch: string, path: string): string {
    return `github://${owner}/${repo}/${path}?ref=${branch}`;
  }
}
