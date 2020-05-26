import { GitHubUtils } from "./GitHubUtils";

describe("GitHubUtils", () => {
  describe("fromGitHubUri", () => {
    it("parses github repo url for a branch", () => {
      const gitHubInfo = GitHubUtils.fromGitHubUri("https://github.com/owner/repo/tree/branch");
      expect(gitHubInfo).toEqual({
        owner: "owner",
        repo: "repo",
        branch: "branch",
        path: ""
      });
    });

    it("parses github file url", () => {
      const gitHubInfo = GitHubUtils.fromGitHubUri("https://github.com/owner/repo/blob/branch/dir/file.ext");
      expect(gitHubInfo).toEqual({
        owner: "owner",
        repo: "repo",
        branch: "branch",
        path: "dir/file.ext"
      });
    });

    it("parses github file url with spaces", () => {
      const gitHubInfo = GitHubUtils.fromGitHubUri("https://github.com/owner/repo/blob/branch/dir/file name.ext");
      expect(gitHubInfo).toEqual({
        owner: "owner",
        repo: "repo",
        branch: "branch",
        path: "dir/file name.ext"
      });
    });

    it("parses github file url with encoded chars", () => {
      const gitHubInfo = GitHubUtils.fromGitHubUri("https://github.com/owner/repo/blob/branch/dir/file%20name.ext");
      expect(gitHubInfo).toEqual({
        owner: "owner",
        repo: "repo",
        branch: "branch",
        path: "dir/file%20name.ext"
      });
    });
  });

  it("toRepoFullName returns full name in expected format", () => {
    const fullName = GitHubUtils.toRepoFullName("owner", "repo");
    expect(fullName).toBe("owner/repo");
  });
});
