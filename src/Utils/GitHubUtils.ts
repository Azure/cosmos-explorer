import UrlUtility from "../Common/UrlUtility";
import { RepoListItem } from "../Explorer/Controls/GitHub/GitHubReposComponent";
import { IGitHubFile, IGitHubRepo } from "../GitHub/GitHubClient";
import { IPinnedRepo } from "../Juno/JunoClient";

export class GitHubUtils {
  // The pattern is https://github.com/<owner>/<repo>/(blob|tree)/<branch>/<path>
  private static readonly UriPattern = "https://github.com/([^/]*)/([^/]*)/(blob|tree)/([^/]*)/?(.*)";

  public static toRepoFullName(owner: string, repo: string): string {
    return `${owner}/${repo}`;
  }

  public static toGitHubUriForRepoAndBranch(owner: string, repo: string, branch: string, path?: string): string {
    return UrlUtility.createUri(`https://github.com/${owner}/${repo}/tree/${branch}`, path);
  }

  public static toGitHubUriForFile(gitHubFile: IGitHubFile): string {
    return decodeURIComponent(gitHubFile.html_url);
  }

  public static fromGitHubUri(
    gitHubUri: string
  ): undefined | { owner: string; repo: string; branch: string; path: string } {
    try {
      const matches = gitHubUri.match(GitHubUtils.UriPattern);
      return {
        owner: matches[1],
        repo: matches[2],
        branch: matches[4],
        path: matches[5]
      };
    } catch (error) {
      return undefined;
    }
  }

  public static toPinnedRepo(item: RepoListItem): IPinnedRepo {
    return {
      owner: item.repo.owner.login,
      name: item.repo.name,
      private: item.repo.private,
      branches: item.branches.map(element => ({ name: element.name }))
    };
  }

  public static toGitHubRepo(pinnedRepo: IPinnedRepo): IGitHubRepo {
    return {
      owner: {
        login: pinnedRepo.owner
      },
      name: pinnedRepo.name,
      private: pinnedRepo.private
    };
  }
}
