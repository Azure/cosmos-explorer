import { Octokit } from "@octokit/rest";
import { RequestHeaders } from "@octokit/types";
import { HttpStatusCodes } from "../Common/Constants";

export interface IGitHubResponse<T> {
  status: number;
  data: T;
}

export interface IGitHubRepo {
  // API properties
  name: string;
  owner: {
    login: string;
  };
  private: boolean;

  // Custom properties
  children?: IGitHubFile[];
}

export interface IGitHubFile {
  // API properties
  type: "file" | "dir" | "symlink" | "submodule";
  encoding?: string;
  size: number;
  name: string;
  path: string;
  content?: string;
  sha: string;

  // Custom properties
  children?: IGitHubFile[];
  repo?: IGitHubRepo;
  branch?: IGitHubBranch;
}

export interface IGitHubCommit {
  // API properties
  sha: string;
  message: string;
  committer: {
    date: string;
  };
}

export interface IGitHubBranch {
  // API properties
  name: string;
}

export interface IGitHubUser {
  // API properties
  login: string;
  name: string;
}

export class GitHubClient {
  private static readonly gitHubApiEndpoint = "https://api.github.com";

  private static readonly samplesRepo: IGitHubRepo = {
    name: "cosmos-notebooks",
    private: false,
    owner: {
      login: "Azure-Samples"
    }
  };

  private static readonly samplesBranch: IGitHubBranch = {
    name: "master"
  };

  private static readonly samplesTopCommit: IGitHubCommit = {
    sha: "41b964f442b638097a75a3f3b6a6451db05a12bf",
    committer: {
      date: "2020-05-19T05:03:30Z"
    },
    message: "Fixing formatting"
  };

  private static readonly samplesFiles: IGitHubFile[] = [
    {
      name: ".github",
      path: ".github",
      sha: "5e6794a8177a0c07a8719f6e1d7b41cce6f92e1e",
      size: 0,
      type: "dir"
    },
    {
      name: ".gitignore",
      path: ".gitignore",
      sha: "3e759b75bf455ac809d0987d369aab89137b5689",
      size: 5582,
      type: "file"
    },
    {
      name: "1. GettingStarted.ipynb",
      path: "1. GettingStarted.ipynb",
      sha: "0732ff5366e4aefdc4c378c61cbd968664f0acec",
      size: 3933,
      type: "file"
    },
    {
      name: "2. Visualization.ipynb",
      path: "2. Visualization.ipynb",
      sha: "f480134ac4adf2f50ce5fe66836c6966749d3ca1",
      size: 814261,
      type: "file"
    },
    {
      name: "3. RequestUnits.ipynb",
      path: "3. RequestUnits.ipynb",
      sha: "252b79a4adc81e9f2ffde453231b695d75e270e8",
      size: 9490,
      type: "file"
    },
    {
      name: "4. Indexing.ipynb",
      path: "4. Indexing.ipynb",
      sha: "e10dd67bd1c55c345226769e4f80e43659ef9cd5",
      size: 10394,
      type: "file"
    },
    {
      name: "5. StoredProcedures.ipynb",
      path: "5. StoredProcedures.ipynb",
      sha: "949941949920de4d2d111149e2182e9657cc8134",
      size: 11818,
      type: "file"
    },
    {
      name: "6. GlobalDistribution.ipynb",
      path: "6. GlobalDistribution.ipynb",
      sha: "b91c31dacacbc9e35750d9054063dda4a5309f3b",
      size: 11375,
      type: "file"
    },
    {
      name: "7. IoTAnomalyDetection.ipynb",
      path: "7. IoTAnomalyDetection.ipynb",
      sha: "82057ae52a67721a5966e2361317f5dfbd0ee595",
      size: 377939,
      type: "file"
    },
    {
      name: "All_API_quickstarts",
      path: "All_API_quickstarts",
      sha: "07054293e6c8fc00771fccd0cde207f5c8053978",
      size: 0,
      type: "dir"
    },
    {
      name: "CSharp_quickstarts",
      path: "CSharp_quickstarts",
      sha: "10e7f5704e6b56a40cac74bc39f15b7708954f52",
      size: 0,
      type: "dir"
    }
  ];

  private ocktokit: Octokit;

  constructor(token: string, private errorCallback: (error: any) => void) {
    this.initOctokit(token);
  }

  public setToken(token: string): void {
    this.initOctokit(token);
  }

  public async getRepoAsync(owner: string, repo: string): Promise<IGitHubResponse<IGitHubRepo>> {
    if (GitHubClient.isSamplesCall(owner, repo)) {
      return {
        status: HttpStatusCodes.OK,
        data: GitHubClient.samplesRepo
      };
    }

    const response = await this.ocktokit.repos.get({
      owner,
      repo,
      headers: GitHubClient.getDisableCacheHeaders()
    });

    let data: IGitHubRepo;
    if (response.data) {
      data = GitHubClient.toGitHubRepo(response.data);
    }

    return { status: response.status, data };
  }

  public async getReposAsync(page: number, perPage: number): Promise<IGitHubResponse<IGitHubRepo[]>> {
    const response = await this.ocktokit.repos.listForAuthenticatedUser({
      page,
      per_page: perPage,
      headers: GitHubClient.getDisableCacheHeaders()
    });

    let data: IGitHubRepo[];
    if (response.data) {
      data = [];
      response.data?.forEach((element: any) => data.push(GitHubClient.toGitHubRepo(element)));
    }

    return { status: response.status, data };
  }

  public async getBranchesAsync(
    owner: string,
    repo: string,
    page: number,
    perPage: number
  ): Promise<IGitHubResponse<IGitHubBranch[]>> {
    const response = await this.ocktokit.repos.listBranches({
      owner,
      repo,
      page,
      per_page: perPage,
      headers: GitHubClient.getDisableCacheHeaders()
    });

    let data: IGitHubBranch[];
    if (response.data) {
      data = [];
      response.data?.forEach(element => data.push(GitHubClient.toGitHubBranch(element)));
    }

    return { status: response.status, data };
  }

  public async getCommitsAsync(
    owner: string,
    repo: string,
    branch: string,
    path: string,
    page: number,
    perPage: number
  ): Promise<IGitHubResponse<IGitHubCommit[]>> {
    if (GitHubClient.isSamplesCall(owner, repo, branch) && path === "" && page === 1 && perPage === 1) {
      return {
        status: HttpStatusCodes.OK,
        data: [GitHubClient.samplesTopCommit]
      };
    }

    const response = await this.ocktokit.repos.listCommits({
      owner,
      repo,
      sha: branch,
      path,
      page,
      per_page: perPage,
      headers: GitHubClient.getDisableCacheHeaders()
    });

    let data: IGitHubCommit[];
    if (response.data) {
      data = [];
      response.data?.forEach(element =>
        data.push(GitHubClient.toGitHubCommit({ ...element.commit, sha: element.sha }))
      );
    }

    return { status: response.status, data };
  }

  public async getDirContentsAsync(
    owner: string,
    repo: string,
    branch: string,
    path: string
  ): Promise<IGitHubResponse<IGitHubFile[]>> {
    return (await this.getContentsAsync(owner, repo, branch, path)) as IGitHubResponse<IGitHubFile[]>;
  }

  public async getFileContentsAsync(
    owner: string,
    repo: string,
    branch: string,
    path: string
  ): Promise<IGitHubResponse<IGitHubFile>> {
    return (await this.getContentsAsync(owner, repo, branch, path)) as IGitHubResponse<IGitHubFile>;
  }

  public async getContentsAsync(
    owner: string,
    repo: string,
    branch: string,
    path: string
  ): Promise<IGitHubResponse<IGitHubFile | IGitHubFile[]>> {
    if (GitHubClient.isSamplesCall(owner, repo, branch) && path === "") {
      return {
        status: HttpStatusCodes.OK,
        data: GitHubClient.samplesFiles.map(file =>
          GitHubClient.toGitHubFile(file, GitHubClient.samplesRepo, GitHubClient.samplesBranch)
        )
      };
    }

    const response = await this.ocktokit.repos.getContents({
      owner,
      repo,
      path,
      ref: branch,
      headers: GitHubClient.getDisableCacheHeaders()
    });

    let data: IGitHubFile | IGitHubFile[];
    if (response.data) {
      const repoResponse = await this.getRepoAsync(owner, repo);
      if (repoResponse.data) {
        const fileRepo: IGitHubRepo = GitHubClient.toGitHubRepo(repoResponse.data);
        const fileBranch: IGitHubBranch = { name: branch };

        if (Array.isArray(response.data)) {
          const contents: IGitHubFile[] = [];
          response.data.forEach((element: any) =>
            contents.push(GitHubClient.toGitHubFile(element, fileRepo, fileBranch))
          );
          data = contents;
        } else {
          data = GitHubClient.toGitHubFile(
            { ...response.data, type: response.data.type as "file" | "dir" | "symlink" | "submodule" },
            fileRepo,
            fileBranch
          );
        }
      }
    }

    return { status: response.status, data };
  }

  public async createOrUpdateFileAsync(
    owner: string,
    repo: string,
    branch: string,
    path: string,
    message: string,
    content: string,
    sha?: string
  ): Promise<IGitHubResponse<IGitHubCommit>> {
    const response = await this.ocktokit.repos.createOrUpdateFile({
      owner,
      repo,
      branch,
      path,
      message,
      content,
      sha
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
    newPath: string
  ): Promise<IGitHubResponse<IGitHubCommit>> {
    const ref = `heads/${branch}`;
    const currentRef = await this.ocktokit.git.getRef({
      owner,
      repo,
      ref,
      headers: GitHubClient.getDisableCacheHeaders()
    });

    const currentTree = await this.ocktokit.git.getTree({
      owner,
      repo,
      tree_sha: currentRef.data.object.sha,
      recursive: "1",
      headers: GitHubClient.getDisableCacheHeaders()
    });

    // API infers tree from paths so we need to filter them out
    const currentTreeItems = currentTree.data.tree.filter(item => item.type !== "tree");
    currentTreeItems.forEach(item => {
      if (item.path === newPath) {
        throw new Error("File with the path already exists");
      }
    });

    const updatedTree = await this.ocktokit.git.createTree({
      owner,
      repo,
      tree: currentTreeItems.map(item => ({
        path: item.path === oldPath ? newPath : item.path,
        mode: item.mode as "100644" | "100755" | "040000" | "160000" | "120000",
        type: item.type as "blob" | "tree" | "commit",
        sha: item.sha
      }))
    });

    const newCommit = await this.ocktokit.git.createCommit({
      owner,
      repo,
      message,
      parents: [currentRef.data.object.sha],
      tree: updatedTree.data.sha
    });

    const updatedRef = await this.ocktokit.git.updateRef({
      owner,
      repo,
      ref,
      sha: newCommit.data.sha
    });

    return {
      status: updatedRef.status,
      data: GitHubClient.toGitHubCommit(newCommit.data)
    };
  }

  public async deleteFileAsync(file: IGitHubFile, message: string): Promise<IGitHubResponse<IGitHubCommit>> {
    const response = await this.ocktokit.repos.deleteFile({
      owner: file.repo.owner.login,
      repo: file.repo.name,
      path: file.path,
      message,
      sha: file.sha,
      branch: file.branch.name
    });

    let data: IGitHubCommit;
    if (response.data) {
      data = GitHubClient.toGitHubCommit(response.data.commit);
    }

    return { status: response.status, data };
  }

  private initOctokit(token: string) {
    this.ocktokit = new Octokit({
      auth: token,
      baseUrl: GitHubClient.gitHubApiEndpoint
    });

    this.ocktokit.hook.error("request", error => {
      this.errorCallback(error);
      throw error;
    });
  }

  private static getDisableCacheHeaders(): RequestHeaders {
    return {
      "If-None-Match": ""
    };
  }

  private static toGitHubRepo(element: IGitHubRepo): IGitHubRepo {
    return {
      name: element.name,
      owner: {
        login: element.owner.login
      },
      private: element.private
    };
  }

  private static toGitHubBranch(element: IGitHubBranch): IGitHubBranch {
    return {
      name: element.name
    };
  }

  private static toGitHubCommit(element: IGitHubCommit): IGitHubCommit {
    return {
      sha: element.sha,
      message: element.message,
      committer: {
        date: element.committer.date
      }
    };
  }

  private static toGitHubFile(element: IGitHubFile, repo: IGitHubRepo, branch: IGitHubBranch): IGitHubFile {
    return {
      type: element.type,
      encoding: element.encoding,
      size: element.size,
      name: element.name,
      path: element.path,
      content: element.content,
      sha: element.sha,
      repo,
      branch
    };
  }

  private static isSamplesCall(owner: string, repo: string, branch?: string): boolean {
    return owner === "Azure-Samples" && repo === "cosmos-notebooks" && (!branch || branch === "master");
  }
}
