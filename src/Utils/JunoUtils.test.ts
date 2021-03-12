import { RepoListItem } from "../Explorer/Controls/GitHub/GitHubReposComponent";
import { IPinnedRepo } from "../Juno/JunoClient";
import * as JunoUtils from "./JunoUtils";
import { IGitHubRepo } from "../GitHub/GitHubClient";

const gitHubRepo: IGitHubRepo = {
  name: "repo-name",
  owner: "owner",
  private: false,
};

const repoListItem: RepoListItem = {
  key: "key",
  repo: {
    name: "repo-name",
    owner: "owner",
    private: false,
  },
  branches: [
    {
      name: "branch-name",
    },
  ],
};

const pinnedRepo: IPinnedRepo = {
  name: "repo-name",
  owner: "owner",
  private: false,
  branches: [
    {
      name: "branch-name",
    },
  ],
};

describe("JunoUtils", () => {
  it("toPinnedRepo converts RepoListItem to IPinnedRepo", () => {
    expect(JunoUtils.toPinnedRepo(repoListItem)).toEqual(pinnedRepo);
  });

  it("toGitHubRepo converts IPinnedRepo to IGitHubRepo", () => {
    expect(JunoUtils.toGitHubRepo(pinnedRepo)).toEqual(gitHubRepo);
  });
});
