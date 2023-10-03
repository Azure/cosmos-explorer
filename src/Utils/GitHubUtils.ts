// https://github.com/<owner>/<repo>/tree/<branch>

import { JunoEndpoints } from "Common/Constants";
import { configContext } from "ConfigContext";
import { userContext } from "UserContext";

// The url when users visit a repo/branch on github.com
export const RepoUriPattern = /https:\/\/github.com\/([^/]*)\/([^/]*)\/tree\/([^?]*)/;

// github://<owner>/<repo>/<path>?ref=<branch>
// Custom scheme for github content
export const ContentUriPattern = /github:\/\/([^/]*)\/([^/]*)\/([^?]*)\?ref=(.*)/;

// https://github.com/<owner>/<repo>/blob/<branch>/<path>
// We need to support this until we move to newer scheme for quickstarts
export const LegacyContentUriPattern = /https:\/\/github.com\/([^/]*)\/([^/]*)\/blob\/([^/]*)\/([^?]*)/;

export function toRepoFullName(owner: string, repo: string): string {
  return `${owner}/${repo}`;
}

export function fromRepoUri(repoUri: string): undefined | { owner: string; repo: string; branch: string } {
  const matches = repoUri.match(RepoUriPattern);
  if (matches && matches.length > 3) {
    return {
      owner: matches[1],
      repo: matches[2],
      branch: matches[3],
    };
  }

  return undefined;
}

export function fromContentUri(
  contentUri: string,
): undefined | { owner: string; repo: string; branch: string; path: string } {
  let matches = contentUri.match(ContentUriPattern);
  if (matches && matches.length > 4) {
    return {
      owner: matches[1],
      repo: matches[2],
      branch: matches[4],
      path: matches[3],
    };
  }

  matches = contentUri.match(LegacyContentUriPattern);
  if (matches && matches.length > 4) {
    return {
      owner: matches[1],
      repo: matches[2],
      branch: matches[3],
      path: matches[4],
    };
  }

  return undefined;
}

export function toContentUri(owner: string, repo: string, branch: string, path: string): string {
  return `github://${owner}/${repo}/${path}?ref=${branch}`;
}

export function toRawContentUri(owner: string, repo: string, branch: string, path: string): string {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
}

export function GetGithubClientId(): string {
  const junoEndpoint = userContext.features.junoEndpoint ?? configContext.JUNO_ENDPOINT;
  if (
    junoEndpoint === JunoEndpoints.Test ||
    junoEndpoint === JunoEndpoints.Test2 ||
    junoEndpoint === JunoEndpoints.Test3
  ) {
    return configContext.GITHUB_TEST_ENV_CLIENT_ID;
  }
  return configContext.GITHUB_CLIENT_ID;
}
