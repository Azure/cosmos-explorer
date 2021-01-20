import * as GitHubUtils from "./GitHubUtils";

const owner = "owner-1";
const repo = "repo-1";
const branch = "branch/name.1-2";
const path = "folder name/file name1:2.ipynb";

describe("GitHubUtils", () => {
  it("fromRepoUri parses github repo url correctly", () => {
    const repoInfo = GitHubUtils.fromRepoUri(`https://github.com/${owner}/${repo}/tree/${branch}`);
    expect(repoInfo).toEqual({
      owner,
      repo,
      branch,
    });
  });

  it("toContentUri generates github uris correctly", () => {
    const uri = GitHubUtils.toContentUri(owner, repo, branch, path);
    expect(uri).toBe(`github://${owner}/${repo}/${path}?ref=${branch}`);
  });

  it("fromContentUri parses the github uris correctly", () => {
    const contentInfo = GitHubUtils.fromContentUri(`github://${owner}/${repo}/${path}?ref=${branch}`);
    expect(contentInfo).toEqual({
      owner,
      repo,
      branch,
      path,
    });
  });
});
