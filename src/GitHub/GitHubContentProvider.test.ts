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
    spyOn(GitHubClient.prototype, "getContentsAsync");

    const response = await gitHubContentProvider.remove(undefined, "invalid path").toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(GitHubContentProvider.SelfErrorCode);
    expect(gitHubClient.getContentsAsync).not.toBeCalled();
  });

  it("errors on failed read", async () => {
    spyOn(GitHubClient.prototype, "getContentsAsync").and.returnValue(Promise.resolve({ status: 888 }));

    const response = await gitHubContentProvider.remove(undefined, sampleGitHubUri).toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(888);
    expect(gitHubClient.getContentsAsync).toBeCalled();
  });

  it("errors on failed delete", async () => {
    spyOn(GitHubClient.prototype, "getContentsAsync").and.returnValue(
      Promise.resolve({ status: HttpStatusCodes.OK, data: sampleFile }),
    );
    spyOn(GitHubClient.prototype, "deleteFileAsync").and.returnValue(Promise.resolve({ status: 888 }));

    const response = await gitHubContentProvider.remove(undefined, sampleGitHubUri).toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(888);
    expect(gitHubClient.getContentsAsync).toBeCalled();
    expect(gitHubClient.deleteFileAsync).toBeCalled();
  });

  it("removes notebook", async () => {
    spyOn(GitHubClient.prototype, "getContentsAsync").and.returnValue(
      Promise.resolve({ status: HttpStatusCodes.OK, data: sampleFile }),
    );
    spyOn(GitHubClient.prototype, "deleteFileAsync").and.returnValue(
      Promise.resolve({ status: HttpStatusCodes.OK, data: gitHubCommit }),
    );

    const response = await gitHubContentProvider.remove(undefined, sampleGitHubUri).toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(HttpStatusCodes.NoContent);
    expect(gitHubClient.deleteFileAsync).toBeCalled();
    expect(response.response).toBeUndefined();
  });
});

describe("GitHubContentProvider get", () => {
  it("errors on invalid path", async () => {
    spyOn(GitHubClient.prototype, "getContentsAsync");

    const response = await gitHubContentProvider.get(undefined, "invalid path", undefined).toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(GitHubContentProvider.SelfErrorCode);
    expect(gitHubClient.getContentsAsync).not.toBeCalled();
  });

  it("errors on failed read", async () => {
    spyOn(GitHubClient.prototype, "getContentsAsync").and.returnValue(Promise.resolve({ status: 888 }));

    const response = await gitHubContentProvider.get(undefined, sampleGitHubUri, undefined).toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(888);
    expect(gitHubClient.getContentsAsync).toBeCalled();
  });

  it("reads notebook", async () => {
    spyOn(GitHubClient.prototype, "getContentsAsync").and.returnValue(
      Promise.resolve({ status: HttpStatusCodes.OK, data: sampleFile }),
    );

    const response = await gitHubContentProvider.get(undefined, sampleGitHubUri, {}).toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(HttpStatusCodes.OK);
    expect(gitHubClient.getContentsAsync).toBeCalled();
    expect(response.response).toEqual(sampleNotebookModel);
  });
});

describe("GitHubContentProvider update", () => {
  it("errors on invalid path", async () => {
    spyOn(GitHubClient.prototype, "getContentsAsync");

    const response = await gitHubContentProvider.update(undefined, "invalid path", undefined).toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(GitHubContentProvider.SelfErrorCode);
    expect(gitHubClient.getContentsAsync).not.toBeCalled();
  });

  it("errors on failed read", async () => {
    spyOn(GitHubClient.prototype, "getContentsAsync").and.returnValue(Promise.resolve({ status: 888 }));

    const response = await gitHubContentProvider.update(undefined, sampleGitHubUri, undefined).toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(888);
    expect(gitHubClient.getContentsAsync).toBeCalled();
  });

  it("errors on failed rename", async () => {
    spyOn(GitHubClient.prototype, "getContentsAsync").and.returnValue(
      Promise.resolve({ status: HttpStatusCodes.OK, data: sampleFile }),
    );
    spyOn(GitHubClient.prototype, "renameFileAsync").and.returnValue(Promise.resolve({ status: 888 }));

    const response = await gitHubContentProvider.update(undefined, sampleGitHubUri, sampleNotebookModel).toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(888);
    expect(gitHubClient.getContentsAsync).toBeCalled();
    expect(gitHubClient.renameFileAsync).toBeCalled();
  });

  it("updates notebook", async () => {
    spyOn(GitHubClient.prototype, "getContentsAsync").and.returnValue(
      Promise.resolve({ status: HttpStatusCodes.OK, data: sampleFile }),
    );
    spyOn(GitHubClient.prototype, "renameFileAsync").and.returnValue(
      Promise.resolve({ status: HttpStatusCodes.OK, data: gitHubCommit }),
    );

    const response = await gitHubContentProvider.update(undefined, sampleGitHubUri, sampleNotebookModel).toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(HttpStatusCodes.OK);
    expect(gitHubClient.getContentsAsync).toBeCalled();
    expect(gitHubClient.renameFileAsync).toBeCalled();
    expect(response.response.type).toEqual(sampleNotebookModel.type);
    expect(response.response.name).toEqual(sampleNotebookModel.name);
    expect(response.response.path).toEqual(sampleNotebookModel.path);
    expect(response.response.content).toBeUndefined();
  });
});

describe("GitHubContentProvider create", () => {
  it("errors on invalid path", async () => {
    spyOn(GitHubClient.prototype, "createOrUpdateFileAsync");

    const response = await gitHubContentProvider.create(undefined, "invalid path", sampleNotebookModel).toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(GitHubContentProvider.SelfErrorCode);
    expect(gitHubClient.createOrUpdateFileAsync).not.toBeCalled();
  });

  it("errors on failed create", async () => {
    spyOn(GitHubClient.prototype, "createOrUpdateFileAsync").and.returnValue(Promise.resolve({ status: 888 }));

    const response = await gitHubContentProvider.create(undefined, sampleGitHubUri, sampleNotebookModel).toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(888);
    expect(gitHubClient.createOrUpdateFileAsync).toBeCalled();
  });

  it("creates notebook", async () => {
    spyOn(GitHubClient.prototype, "createOrUpdateFileAsync").and.returnValue(
      Promise.resolve({ status: HttpStatusCodes.Created, data: gitHubCommit }),
    );

    const response = await gitHubContentProvider.create(undefined, sampleGitHubUri, sampleNotebookModel).toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(HttpStatusCodes.Created);
    expect(gitHubClient.createOrUpdateFileAsync).toBeCalled();
    expect(response.response.type).toEqual(sampleNotebookModel.type);
    expect(response.response.name).toBeDefined();
    expect(response.response.path).toBeDefined();
    expect(response.response.content).toBeUndefined();
  });
});

describe("GitHubContentProvider save", () => {
  it("errors on invalid path", async () => {
    spyOn(GitHubClient.prototype, "getContentsAsync");

    const response = await gitHubContentProvider.save(undefined, "invalid path", undefined).toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(GitHubContentProvider.SelfErrorCode);
    expect(gitHubClient.getContentsAsync).not.toBeCalled();
  });

  it("errors on failed read", async () => {
    spyOn(GitHubClient.prototype, "getContentsAsync").and.returnValue(Promise.resolve({ status: 888 }));

    const response = await gitHubContentProvider.save(undefined, sampleGitHubUri, undefined).toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(888);
    expect(gitHubClient.getContentsAsync).toBeCalled();
  });

  it("errors on failed update", async () => {
    spyOn(GitHubClient.prototype, "getContentsAsync").and.returnValue(
      Promise.resolve({ status: HttpStatusCodes.OK, data: sampleFile }),
    );
    spyOn(GitHubClient.prototype, "createOrUpdateFileAsync").and.returnValue(Promise.resolve({ status: 888 }));

    const response = await gitHubContentProvider.save(undefined, sampleGitHubUri, sampleNotebookModel).toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(888);
    expect(gitHubClient.getContentsAsync).toBeCalled();
    expect(gitHubClient.createOrUpdateFileAsync).toBeCalled();
  });

  it("saves notebook", async () => {
    spyOn(GitHubClient.prototype, "getContentsAsync").and.returnValue(
      Promise.resolve({ status: HttpStatusCodes.OK, data: sampleFile }),
    );
    spyOn(GitHubClient.prototype, "createOrUpdateFileAsync").and.returnValue(
      Promise.resolve({ status: HttpStatusCodes.OK, data: gitHubCommit }),
    );

    const response = await gitHubContentProvider.save(undefined, sampleGitHubUri, sampleNotebookModel).toPromise();
    expect(response).toBeDefined();
    expect(response.status).toBe(HttpStatusCodes.OK);
    expect(gitHubClient.getContentsAsync).toBeCalled();
    expect(gitHubClient.createOrUpdateFileAsync).toBeCalled();
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
