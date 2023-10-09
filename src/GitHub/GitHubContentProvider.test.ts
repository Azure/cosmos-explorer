import { IContent } from "@nteract/core";
import { fixture } from "@nteract/fixtures";
import { HttpStatusCodes } from "../Common/Constants";
import * as GitHubUtils from "../Utils/GitHubUtils";
import { GitHubClient, IGitHubCommit, IGitHubFile } from "./GitHubClient";
import { GitHubContentProvider } from "./GitHubContentProvider";

const gitHubClient = new GitHubClient(() => {
  /**/
});
const gitHubContentProvider = new GitHubContentProvider({
  gitHubClient,
  promptForCommitMsg: () => Promise.resolve("commit msg"),
});
const gitHubCommit: IGitHubCommit = {
  sha: "sha",
  message: "message",
  commitDate: "date",
};
const sampleFile: IGitHubFile = {
  type: "blob",
  size: 0,
  name: "name.ipynb",
  path: "dir/name.ipynb",
  content: fixture,
  sha: "sha",
  repo: {
    owner: "owner",
    name: "repo",
    private: false,
  },
  branch: {
    name: "branch",
  },
  commit: gitHubCommit,
};
const sampleGitHubUri = GitHubUtils.toContentUri(
  sampleFile.repo.owner,
  sampleFile.repo.name,
  sampleFile.branch.name,
  sampleFile.path,
);
const sampleNotebookModel: IContent<"notebook"> = {
  name: sampleFile.name,
  path: sampleGitHubUri,
  type: "notebook",
  writable: true,
  created: "",
  last_modified: "date",
  mimetype: "application/x-ipynb+json",
  content: sampleFile.content ? JSON.parse(sampleFile.content) : undefined,
  format: "json",
};

describe("GitHubContentProvider remove", () => {
  it("errors on invalid path", async () => {
    jest.spyOn(GitHubClient.prototype, "getContentsAsync");

    const response = await gitHubContentProvider.remove(undefined, "invalid path").toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(GitHubContentProvider.SelfErrorCode);
    expect(gitHubClient.getContentsAsync).not.toHaveBeenCalled();
  });

  it("errors on failed read", async () => {
    jest
      .spyOn(GitHubClient.prototype, "getContentsAsync")
      .mockReturnValue(Promise.resolve({ status: 888, data: undefined }));

    const response = await gitHubContentProvider.remove(undefined, sampleGitHubUri).toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(888);
    expect(gitHubClient.getContentsAsync).toHaveBeenCalled();
  });

  it("errors on failed delete", async () => {
    jest
      .spyOn(GitHubClient.prototype, "getContentsAsync")
      .mockReturnValue(Promise.resolve({ status: HttpStatusCodes.OK, data: sampleFile }));
    jest
      .spyOn(GitHubClient.prototype, "deleteFileAsync")
      .mockReturnValue(Promise.resolve({ status: 888, data: undefined }));

    const response = await gitHubContentProvider.remove(undefined, sampleGitHubUri).toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(888);
    expect(gitHubClient.getContentsAsync).toHaveBeenCalled();
    expect(gitHubClient.deleteFileAsync).toHaveBeenCalled();
  });

  it("removes notebook", async () => {
    jest
      .spyOn(GitHubClient.prototype, "getContentsAsync")
      .mockReturnValue(Promise.resolve({ status: HttpStatusCodes.OK, data: sampleFile }));
    jest
      .spyOn(GitHubClient.prototype, "deleteFileAsync")
      .mockReturnValue(Promise.resolve({ status: HttpStatusCodes.OK, data: gitHubCommit }));

    const response = await gitHubContentProvider.remove(undefined, sampleGitHubUri).toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(HttpStatusCodes.NoContent);
    expect(gitHubClient.deleteFileAsync).toHaveBeenCalled();
    expect(response.response).toBeUndefined();
  });
});

describe("GitHubContentProvider get", () => {
  it("errors on invalid path", async () => {
    jest.spyOn(GitHubClient.prototype, "getContentsAsync");

    const response = await gitHubContentProvider.get(undefined, "invalid path", undefined).toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(GitHubContentProvider.SelfErrorCode);
    expect(gitHubClient.getContentsAsync).not.toHaveBeenCalled();
  });

  it("errors on failed read", async () => {
    jest
      .spyOn(GitHubClient.prototype, "getContentsAsync")
      .mockReturnValue(Promise.resolve({ status: 888, data: undefined }));

    const response = await gitHubContentProvider.get(undefined, sampleGitHubUri, undefined).toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(888);
    expect(gitHubClient.getContentsAsync).toHaveBeenCalled();
  });

  it("reads notebook", async () => {
    jest
      .spyOn(GitHubClient.prototype, "getContentsAsync")
      .mockReturnValue(Promise.resolve({ status: HttpStatusCodes.OK, data: sampleFile }));

    const response = await gitHubContentProvider.get(undefined, sampleGitHubUri, {}).toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(HttpStatusCodes.OK);
    expect(gitHubClient.getContentsAsync).toHaveBeenCalled();
    expect(response.response).toEqual(sampleNotebookModel);
  });
});

describe("GitHubContentProvider update", () => {
  it("errors on invalid path", async () => {
    jest.spyOn(GitHubClient.prototype, "getContentsAsync");

    const response = await gitHubContentProvider.update(undefined, "invalid path", undefined).toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(GitHubContentProvider.SelfErrorCode);
    expect(gitHubClient.getContentsAsync).not.toHaveBeenCalled();
  });

  it("errors on failed read", async () => {
    jest
      .spyOn(GitHubClient.prototype, "getContentsAsync")
      .mockReturnValue(Promise.resolve({ status: 888, data: undefined }));

    const response = await gitHubContentProvider.update(undefined, sampleGitHubUri, undefined).toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(888);
    expect(gitHubClient.getContentsAsync).toHaveBeenCalled();
  });

  it("errors on failed rename", async () => {
    jest
      .spyOn(GitHubClient.prototype, "getContentsAsync")
      .mockReturnValue(Promise.resolve({ status: HttpStatusCodes.OK, data: sampleFile }));
    jest
      .spyOn(GitHubClient.prototype, "renameFileAsync")
      .mockReturnValue(Promise.resolve({ status: 888, data: undefined }));

    const response = await gitHubContentProvider.update(undefined, sampleGitHubUri, sampleNotebookModel).toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(888);
    expect(gitHubClient.getContentsAsync).toHaveBeenCalled();
    expect(gitHubClient.renameFileAsync).toHaveBeenCalled();
  });

  it("updates notebook", async () => {
    jest
      .spyOn(GitHubClient.prototype, "getContentsAsync")
      .mockReturnValue(Promise.resolve({ status: HttpStatusCodes.OK, data: sampleFile }));
    jest
      .spyOn(GitHubClient.prototype, "renameFileAsync")
      .mockReturnValue(Promise.resolve({ status: HttpStatusCodes.OK, data: gitHubCommit }));

    const response = await gitHubContentProvider.update(undefined, sampleGitHubUri, sampleNotebookModel).toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(HttpStatusCodes.OK);
    expect(gitHubClient.getContentsAsync).toHaveBeenCalled();
    expect(gitHubClient.renameFileAsync).toHaveBeenCalled();
    expect(response.response.type).toEqual(sampleNotebookModel.type);
    expect(response.response.name).toEqual(sampleNotebookModel.name);
    expect(response.response.path).toEqual(sampleNotebookModel.path);
    expect(response.response.content).toBeUndefined();
  });
});

describe("GitHubContentProvider create", () => {
  it("errors on invalid path", async () => {
    jest.spyOn(GitHubClient.prototype, "createOrUpdateFileAsync");

    const response = await gitHubContentProvider.create(undefined, "invalid path", sampleNotebookModel).toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(GitHubContentProvider.SelfErrorCode);
    expect(gitHubClient.createOrUpdateFileAsync).not.toHaveBeenCalled();
  });

  it("errors on failed create", async () => {
    jest
      .spyOn(GitHubClient.prototype, "createOrUpdateFileAsync")
      .mockReturnValue(Promise.resolve({ status: 888, data: undefined }));

    const response = await gitHubContentProvider.create(undefined, sampleGitHubUri, sampleNotebookModel).toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(888);
    expect(gitHubClient.createOrUpdateFileAsync).toHaveBeenCalled();
  });

  it("creates notebook", async () => {
    jest
      .spyOn(GitHubClient.prototype, "createOrUpdateFileAsync")
      .mockReturnValue(Promise.resolve({ status: HttpStatusCodes.Created, data: gitHubCommit }));

    const response = await gitHubContentProvider.create(undefined, sampleGitHubUri, sampleNotebookModel).toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(HttpStatusCodes.Created);
    expect(gitHubClient.createOrUpdateFileAsync).toHaveBeenCalled();
    expect(response.response.type).toEqual(sampleNotebookModel.type);
    expect(response.response.name).toBeDefined();
    expect(response.response.path).toBeDefined();
    expect(response.response.content).toBeUndefined();
  });
});

describe("GitHubContentProvider save", () => {
  it("errors on invalid path", async () => {
    jest.spyOn(GitHubClient.prototype, "getContentsAsync");

    const response = await gitHubContentProvider.save(undefined, "invalid path", undefined).toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(GitHubContentProvider.SelfErrorCode);
    expect(gitHubClient.getContentsAsync).not.toHaveBeenCalled();
  });

  it("errors on failed read", async () => {
    jest
      .spyOn(GitHubClient.prototype, "getContentsAsync")
      .mockReturnValue(Promise.resolve({ status: 888, data: undefined }));

    const response = await gitHubContentProvider.save(undefined, sampleGitHubUri, undefined).toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(888);
    expect(gitHubClient.getContentsAsync).toHaveBeenCalled();
  });

  it("errors on failed update", async () => {
    jest
      .spyOn(GitHubClient.prototype, "getContentsAsync")
      .mockReturnValue(Promise.resolve({ status: HttpStatusCodes.OK, data: sampleFile }));
    jest
      .spyOn(GitHubClient.prototype, "createOrUpdateFileAsync")
      .mockReturnValue(Promise.resolve({ status: 888, data: undefined }));

    const response = await gitHubContentProvider.save(undefined, sampleGitHubUri, sampleNotebookModel).toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(888);
    expect(gitHubClient.getContentsAsync).toHaveBeenCalled();
    expect(gitHubClient.createOrUpdateFileAsync).toHaveBeenCalled();
  });

  it("saves notebook", async () => {
    jest
      .spyOn(GitHubClient.prototype, "getContentsAsync")
      .mockReturnValue(Promise.resolve({ status: HttpStatusCodes.OK, data: sampleFile }));
    jest
      .spyOn(GitHubClient.prototype, "createOrUpdateFileAsync")
      .mockReturnValue(Promise.resolve({ status: HttpStatusCodes.OK, data: gitHubCommit }));

    const response = await gitHubContentProvider.save(undefined, sampleGitHubUri, sampleNotebookModel).toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(HttpStatusCodes.OK);
    expect(gitHubClient.getContentsAsync).toHaveBeenCalled();
    expect(gitHubClient.createOrUpdateFileAsync).toHaveBeenCalled();
    expect(response.response.type).toEqual(sampleNotebookModel.type);
    expect(response.response.name).toEqual(sampleNotebookModel.name);
    expect(response.response.path).toEqual(sampleNotebookModel.path);
    expect(response.response.content).toBeUndefined();
  });
});

describe("GitHubContentProvider listCheckpoints", () => {
  it("errors for everything", async () => {
    const response = await gitHubContentProvider.listCheckpoints().toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(GitHubContentProvider.SelfErrorCode);
  });
});

describe("GitHubContentProvider createCheckpoint", () => {
  it("errors for everything", async () => {
    const response = await gitHubContentProvider.createCheckpoint().toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(GitHubContentProvider.SelfErrorCode);
  });
});

describe("GitHubContentProvider deleteCheckpoint", () => {
  it("errors for everything", async () => {
    const response = await gitHubContentProvider.deleteCheckpoint().toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(GitHubContentProvider.SelfErrorCode);
  });
});

describe("GitHubContentProvider restoreFromCheckpoint", () => {
  it("errors for everything", async () => {
    const response = await gitHubContentProvider.restoreFromCheckpoint().toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(GitHubContentProvider.SelfErrorCode);
  });
});
