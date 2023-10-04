import { Octokit } from "@octokit/rest";
import { HttpStatusCodes } from "../Common/Constants";
import * as Logger from "../Common/Logger";
import * as UrlUtility from "../Common/UrlUtility";
import { NotebookUtil } from "../Explorer/Notebook/NotebookUtil";
import { getErrorMessage } from "../Common/ErrorHandlingUtils";

export interface IGitHubPageInfo {
  endCursor: string;
  hasNextPage: boolean;
}

export interface IGitHubResponse<T> {
  status: number;
  data: T;
  pageInfo?: IGitHubPageInfo;
}

export interface IGitHubRepo {
  name: string;
  owner: string;
  private: boolean;
  children?: IGitHubFile[];
}

export interface IGitHubFile {
  type: "blob" | "tree";
  size?: number;
  name: string;
  path: string;
  content?: string;
  sha?: string;
  children?: IGitHubFile[];
  repo: IGitHubRepo;
  branch: IGitHubBranch;
  commit: IGitHubCommit;
}

export interface IGitHubCommit {
  sha: string;
  message: string;
  commitDate: string;
}

export interface IGitHubBranch {
  name: string;
}

// graphql schema
interface Collection<T> {
  pageInfo?: PageInfo;
  nodes: T[];
}

interface Repository {
  isPrivate: boolean;
  name: string;
  owner: {
    login: string;
  };
}

interface Ref {
  name: string;
}

interface History {
  history: Collection<Commit>;
}

interface Commit {
  committer: {
    date: string;
  };
  message: string;
  oid: string;
}

interface Tree extends Blob {
  entries: TreeEntry[];
}

interface TreeEntry {
  name: string;
  type: string;
  object: Blob;
}

interface Blob {
  byteSize?: number;
  oid?: string;
}

interface PageInfo {
  endCursor: string;
  hasNextPage: boolean;
}

// graphql queries and types
const repositoryQuery = `query($owner: String!, $repo: String!) {
  repository(owner: $owner, name: $repo) {
    owner {
      login
    }
    name
    isPrivate
  }
}`;
type RepositoryQueryParams = {
  owner: string;
  repo: string;
};
type RepositoryQueryResponse = {
  repository: Repository;
};

const repositoriesQuery = `query($pageSize: Int!, $endCursor: String) {
  viewer {
    repositories(first: $pageSize, after: $endCursor) {
      pageInfo {
        endCursor,
        hasNextPage
      }
      nodes {
        owner {
          login
        }
        name
        isPrivate
      }
    }
  }
}`;
type RepositoriesQueryParams = {
  pageSize: number;
  endCursor?: string;
};
type RepositoriesQueryResponse = {
  viewer: {
    repositories: Collection<Repository>;
  };
};

const branchesQuery = `query($owner: String!, $repo: String!, $refPrefix: String!, $pageSize: Int!, $endCursor: String) {
  repository(owner: $owner, name: $repo) {
    refs(refPrefix: $refPrefix, first: $pageSize, after: $endCursor) {
      pageInfo {
        endCursor,
        hasNextPage
      }
      nodes {
        name
      }
    }
  }
}`;
type BranchesQueryParams = {
  owner: string;
  repo: string;
  refPrefix: string;
  pageSize: number;
  endCursor?: string;
};
type BranchesQueryResponse = {
  repository: {
    refs: Collection<Ref>;
  };
};

const contentsQuery = `query($owner: String!, $repo: String!, $ref: String!, $path: String, $objectExpression: String!) {
  repository(owner: $owner, name: $repo) {
    owner {
      login
    }
    name
    isPrivate
    ref(qualifiedName: $ref) {
      name
      target {
        ... on Commit {
          history(first: 1, path: $path) {
            nodes {
              oid
              message
              committer {
                date
              }
            }
          }
        }
      }
    }
    object(expression: $objectExpression) {
      ... on Blob {
        oid
        byteSize
      }
      ... on Tree {
        entries {
          name
          type
          object {
            ... on Blob {
              oid
              byteSize
            }
          }
        }
      }
    }
  }
}`;
type ContentsQueryParams = {
  owner: string;
  repo: string;
  ref: string;
  path?: string;
  objectExpression: string;
};
type ContentsQueryResponse = {
  repository: Repository & { ref: Ref & { target: History } } & { object: Tree };
};

export class GitHubClient {
  private static readonly SelfErrorCode = 599;
  private ocktokit: Octokit;

  constructor(private errorCallback: (error: any) => void) {
    this.initOctokit();
  }

  public setToken(token: string): void {
    this.initOctokit(token);
  }

  public async getRepoAsync(owner: string, repo: string): Promise<IGitHubResponse<IGitHubRepo>> {
    try {
      const response = (await this.ocktokit.graphql(repositoryQuery, {
        owner,
        repo,
      } as RepositoryQueryParams)) as RepositoryQueryResponse;

      return {
        status: HttpStatusCodes.OK,
        data: GitHubClient.toGitHubRepo(response.repository),
      };
    } catch (error) {
      Logger.logError(getErrorMessage(error), "GitHubClient.Octokit", "GitHubClient.getRepoAsync failed");
      return {
        status: GitHubClient.SelfErrorCode,
        data: undefined,
      };
    }
  }

  public async getReposAsync(pageSize: number, endCursor?: string): Promise<IGitHubResponse<IGitHubRepo[]>> {
    try {
      const response = (await this.ocktokit.graphql(repositoriesQuery, {
        pageSize,
        endCursor,
      } as RepositoriesQueryParams)) as RepositoriesQueryResponse;

      return {
        status: HttpStatusCodes.OK,
        data: response.viewer.repositories.nodes.map((repo) => GitHubClient.toGitHubRepo(repo)),
        pageInfo: GitHubClient.toGitHubPageInfo(response.viewer.repositories.pageInfo),
      };
    } catch (error) {
      Logger.logError(getErrorMessage(error), "GitHubClient.Octokit", "GitHubClient.getRepoAsync failed");
      return {
        status: GitHubClient.SelfErrorCode,
        data: undefined,
      };
    }
  }

  public async getBranchesAsync(
    owner: string,
    repo: string,
    pageSize: number,
    endCursor?: string,
  ): Promise<IGitHubResponse<IGitHubBranch[]>> {
    try {
      const response = (await this.ocktokit.graphql(branchesQuery, {
        owner,
        repo,
        refPrefix: "refs/heads/",
        pageSize,
        endCursor,
      } as BranchesQueryParams)) as BranchesQueryResponse;

      return {
        status: HttpStatusCodes.OK,
        data: response.repository.refs.nodes.map((ref) => GitHubClient.toGitHubBranch(ref)),
        pageInfo: GitHubClient.toGitHubPageInfo(response.repository.refs.pageInfo),
      };
    } catch (error) {
      Logger.logError(getErrorMessage(error), "GitHubClient.Octokit", "GitHubClient.getBranchesAsync failed");
      return {
        status: GitHubClient.SelfErrorCode,
        data: undefined,
      };
    }
  }

  public async getContentsAsync(
    owner: string,
    repo: string,
    branch: string,
    path?: string,
  ): Promise<IGitHubResponse<IGitHubFile | IGitHubFile[]>> {
    try {
      const response = (await this.ocktokit.graphql(contentsQuery, {
        owner,
        repo,
        ref: `refs/heads/${branch}`,
        path: path || undefined,
        objectExpression: `refs/heads/${branch}:${path || ""}`,
      } as ContentsQueryParams)) as ContentsQueryResponse;

      if (!response.repository.object) {
        return {
          status: HttpStatusCodes.NotFound,
          data: undefined,
        };
      }

      let data: IGitHubFile | IGitHubFile[];
      const entries = response.repository.object.entries;
      const gitHubRepo = GitHubClient.toGitHubRepo(response.repository);
      const gitHubBranch = GitHubClient.toGitHubBranch(response.repository.ref);
      const gitHubCommit = GitHubClient.toGitHubCommit(response.repository.ref.target.history.nodes[0]);

      if (Array.isArray(entries)) {
        data = entries.map((entry) =>
          GitHubClient.toGitHubFile(
            entry,
            (path && UrlUtility.createUri(path, entry.name)) || entry.name,
            gitHubRepo,
            gitHubBranch,
            gitHubCommit,
          ),
        );
      } else {
        data = GitHubClient.toGitHubFile(
          {
            name: NotebookUtil.getName(path),
            type: "blob",
            object: response.repository.object,
          },
          path,
          gitHubRepo,
          gitHubBranch,
          gitHubCommit,
        );
      }

      return {
        status: HttpStatusCodes.OK,
        data,
      };
    } catch (error) {
      Logger.logError(getErrorMessage(error), "GitHubClient.Octokit", "GitHubClient.getContentsAsync failed");
      return {
        status: GitHubClient.SelfErrorCode,
        data: undefined,
      };
    }
  }

  public async createOrUpdateFileAsync(
    owner: string,
    repo: string,
    branch: string,
    path: string,
    message: string,
    content: string,
    sha?: string,
  ): Promise<IGitHubResponse<IGitHubCommit>> {
    const response = await this.ocktokit.repos.createOrUpdateFile({
      owner,
      repo,
      branch,
      path,
      message,
      content,
      sha,
    });

    let data: IGitHubCommit;
    if (response.data) {
      data = GitHubClient.toGitHubCommit(response.data.commit);
    }

    return { status: response.status, data };
  }

  public async renameFileAsync(
    owner: string,
    repo: string,
    branch: string,
    message: string,
    oldPath: string,
    newPath: string,
  ): Promise<IGitHubResponse<IGitHubCommit>> {
    const ref = `heads/${branch}`;
    const currentRef = await this.ocktokit.git.getRef({
      owner,
      repo,
      ref,
      headers: {
        "If-None-Match": "", // disable 60s cache
      },
    });

    const currentTree = await this.ocktokit.git.getTree({
      owner,
      repo,
      tree_sha: currentRef.data.object.sha,
      recursive: "1",
      headers: {
        "If-None-Match": "", // disable 60s cache
      },
    });

    // API infers tree from paths so we need to filter them out
    const currentTreeItems = currentTree.data.tree.filter((item) => item.type !== "tree");
    currentTreeItems.forEach((item) => {
      if (item.path === newPath) {
        throw new Error("File with the path already exists");
      }
    });

    const updatedTree = await this.ocktokit.git.createTree({
      owner,
      repo,
      tree: currentTreeItems.map((item) => ({
        path: item.path === oldPath ? newPath : item.path,
        mode: item.mode as "100644" | "100755" | "040000" | "160000" | "120000",
        type: item.type as "blob" | "tree" | "commit",
        sha: item.sha,
      })),
    });

    const newCommit = await this.ocktokit.git.createCommit({
      owner,
      repo,
      message,
      parents: [currentRef.data.object.sha],
      tree: updatedTree.data.sha,
    });

    const updatedRef = await this.ocktokit.git.updateRef({
      owner,
      repo,
      ref,
      sha: newCommit.data.sha,
    });

    return {
      status: updatedRef.status,
      data: GitHubClient.toGitHubCommit(newCommit.data),
    };
  }

  public async deleteFileAsync(file: IGitHubFile, message: string): Promise<IGitHubResponse<IGitHubCommit>> {
    const response = await this.ocktokit.repos.deleteFile({
      owner: file.repo.owner,
      repo: file.repo.name,
      path: file.path,
      message,
      sha: file.sha,
      branch: file.branch.name,
    });

    let data: IGitHubCommit;
    if (response.data) {
      data = GitHubClient.toGitHubCommit(response.data.commit);
    }

    return { status: response.status, data };
  }

  public async getBlobAsync(owner: string, repo: string, sha: string): Promise<IGitHubResponse<string>> {
    const response = await this.ocktokit.git.getBlob({
      owner,
      repo,
      file_sha: sha,
      mediaType: {
        format: "raw",
      },
      headers: {
        "If-None-Match": "", // disable 60s cache
      },
    });

    return { status: response.status, data: <string>(<unknown>response.data) };
  }

  private async initOctokit(token?: string) {
    this.ocktokit = new Octokit({
      auth: token,
      log: {
        debug: () => {},
        info: (message?: any) => GitHubClient.log(Logger.logInfo, message),
        warn: (message?: any) => GitHubClient.log(Logger.logWarning, message),
        error: (error?: any) => Logger.logError(getErrorMessage(error), "GitHubClient.Octokit"),
      },
    });

    this.ocktokit.hook.error("request", (error) => {
      this.errorCallback(error);
      throw error;
    });
  }

  private static log(logger: (message: string, area: string) => void, message?: any) {
    if (message) {
      message = typeof message === "string" ? message : JSON.stringify(message);
      logger(message, "GitHubClient.Octokit");
    }
  }

  private static toGitHubRepo(object: Repository): IGitHubRepo {
    return {
      owner: object.owner.login,
      name: object.name,
      private: object.isPrivate,
    };
  }

  private static toGitHubBranch(object: Ref): IGitHubBranch {
    return {
      name: object.name,
    };
  }

  private static toGitHubCommit(object: {
    message: string;
    committer: {
      date: string;
    };
    sha?: string;
    oid?: string;
  }): IGitHubCommit {
    return {
      sha: object.sha || object.oid,
      message: object.message,
      commitDate: object.committer.date,
    };
  }

  private static toGitHubPageInfo(object: PageInfo): IGitHubPageInfo {
    return {
      endCursor: object.endCursor,
      hasNextPage: object.hasNextPage,
    };
  }

  private static toGitHubFile(
    entry: TreeEntry,
    path: string,
    repo: IGitHubRepo,
    branch: IGitHubBranch,
    commit: IGitHubCommit,
  ): IGitHubFile {
    if (entry.type !== "blob" && entry.type !== "tree") {
      throw new Error(`Unsupported file type: ${entry.type}`);
    }

    return {
      type: entry.type,
      name: entry.name,
      path,
      repo,
      branch,
      commit,
      size: entry.object?.byteSize,
      sha: entry.object?.oid,
    };
  }
}
