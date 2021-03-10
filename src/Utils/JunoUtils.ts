import { RepoListItem } from "../Explorer/Controls/GitHub/GitHubReposComponent";
import { IGitHubRepo } from "../GitHub/GitHubClient";
import { IPinnedRepo } from "../Juno/JunoClient";

export function toPinnedRepo(item: RepoListItem): IPinnedRepo {
  return {
    owner: item.repo.owner,
    name: item.repo.name,
    private: item.repo.private,
    branches: item.branches.map((element) => ({ name: element.name })),
  };
}

export function toGitHubRepo(pinnedRepo: IPinnedRepo): IGitHubRepo {
  return {
    owner: pinnedRepo.owner,
    name: pinnedRepo.name,
    private: pinnedRepo.private,
  };
}
