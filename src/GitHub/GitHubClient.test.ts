import { HttpStatusCodes } from "../Common/Constants";
import { GitHubClient, IGitHubFile } from "./GitHubClient";
import { SamplesRepo, SamplesBranch, SamplesContentsQueryResponse } from "../Explorer/Notebook/NotebookSamples";

const invalidTokenCallback = jest.fn();
// Use a dummy token to get around API rate limit (something which doesn't affect the API quota for AZURESAMPLESCOSMOSDBPAT in Config.ts)
const gitHubClient = new GitHubClient("cd1906b9534362fab6ce45d6db6c76b59e55bc50", invalidTokenCallback);

const validateGitHubFile = (file: IGitHubFile) => {
  expect(file.branch).toEqual(SamplesBranch);
  expect(file.commit).toBeDefined();
  expect(file.name).toBeDefined();
  expect(file.path).toBeDefined();
  expect(file.repo).toEqual(SamplesRepo);
  expect(file.type).toBeDefined();

  switch (file.type) {
    case "blob":
      expect(file.sha).toBeDefined();
      expect(file.size).toBeDefined();
      break;

    case "tree":
      expect(file.sha).toBeUndefined();
      expect(file.size).toBeUndefined();
      break;

    default:
      throw new Error(`Unsupported github file type: ${file.type}`);
  }
};

describe("GitHubClient", () => {
  it("getRepoAsync returns valid repo", async () => {
    const response = await gitHubClient.getRepoAsync(SamplesRepo.owner, SamplesRepo.name);
    expect(response).toEqual({
      status: HttpStatusCodes.OK,
      data: SamplesRepo
    });
  });

  it("getReposAsync returns repos for authenticated user", async () => {
    const response = await gitHubClient.getReposAsync(1);
    expect(response.status).toBe(HttpStatusCodes.OK);
    expect(response.data).toBeDefined();
    expect(response.data.length).toBe(1);
    expect(response.pageInfo).toBeDefined();
  });

  it("getBranchesAsync returns branches for a repo", async () => {
    const response = await gitHubClient.getBranchesAsync(SamplesRepo.owner, SamplesRepo.name, 1);
    expect(response.status).toBe(HttpStatusCodes.OK);
    expect(response.data).toEqual([SamplesBranch]);
    expect(response.pageInfo).toBeDefined();
  });

  it("getContentsAsync returns files in the repo", async () => {
    const response = await gitHubClient.getContentsAsync(SamplesRepo.owner, SamplesRepo.name, SamplesBranch.name);
    expect(response.status).toBe(HttpStatusCodes.OK);
    expect(response.data).toBeDefined();

    const data = response.data as IGitHubFile[];
    expect(data.length).toBeGreaterThan(0);
    data.forEach(content => validateGitHubFile(content));
  });

  it("getContentsAsync returns files in a dir", async () => {
    const samplesDir = SamplesContentsQueryResponse.repository.object.entries.find(file => file.type === "tree");
    const response = await gitHubClient.getContentsAsync(
      SamplesRepo.owner,
      SamplesRepo.name,
      SamplesBranch.name,
      samplesDir.name
    );

    expect(response.status).toBe(HttpStatusCodes.OK);
    expect(response.data).toBeDefined();

    const data = response.data as IGitHubFile[];
    expect(data.length).toBeGreaterThan(0);
    data.forEach(content => validateGitHubFile(content));
  });

  it("getContentsAsync returns a file", async () => {
    const samplesFile = SamplesContentsQueryResponse.repository.object.entries.find(file => file.type === "blob");
    const response = await gitHubClient.getContentsAsync(
      SamplesRepo.owner,
      SamplesRepo.name,
      SamplesBranch.name,
      samplesFile.name
    );

    expect(response.status).toBe(HttpStatusCodes.OK);
    expect(response.data).toBeDefined();

    const file = response.data as IGitHubFile;
    expect(file.type).toBe("blob");
    validateGitHubFile(file);
    expect(file.content).toBeUndefined();
  });

  it("getBlobAsync returns file content", async () => {
    const samplesFile = SamplesContentsQueryResponse.repository.object.entries.find(file => file.type === "blob");
    const response = await gitHubClient.getBlobAsync(SamplesRepo.owner, SamplesRepo.name, samplesFile.object.oid);

    expect(response.status).toBe(HttpStatusCodes.OK);
    expect(response.data).toBeDefined();
    expect(typeof response.data).toBe("string");
  });
});
