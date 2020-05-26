import ko from "knockout";
import { HttpStatusCodes } from "../Common/Constants";
import { GitHubClient, IGitHubBranch, IGitHubRepo } from "./GitHubClient";

const invalidTokenCallback = jest.fn();
// Use a dummy token to get around API rate limit (same as AZURESAMPLESCOSMOSDBPAT in webpack.config.js)
const gitHubClient = new GitHubClient("99e38770e29b4a61d7c49f188780504efd35cc86", invalidTokenCallback);
const samplesRepo: IGitHubRepo = {
  name: "cosmos-notebooks",
  owner: {
    login: "Azure-Samples"
  },
  private: false
};
const samplesBranch: IGitHubBranch = {
  name: "master"
};
const sampleFilePath = ".gitignore";
const sampleDirPath = ".github";

describe.skip("GitHubClient", () => {
  it("getRepoAsync returns valid repo", async () => {
    const response = await gitHubClient.getRepoAsync(samplesRepo.owner.login, samplesRepo.name);
    expect(response.status).toBe(HttpStatusCodes.OK);
    expect(response.data.name).toBe(samplesRepo.name);
    expect(response.data.owner.login).toBe(samplesRepo.owner.login);
  });

  it("getReposAsync returns repos for authenticated user", async () => {
    const response = await gitHubClient.getReposAsync(1, 1);
    expect(response.status).toBe(HttpStatusCodes.OK);
    expect(response.data.length).toBe(1);
  });

  it("getBranchesAsync returns branches for a repo", async () => {
    const response = await gitHubClient.getBranchesAsync(samplesRepo.owner.login, samplesRepo.name, 1, 1);
    expect(response.status).toBe(HttpStatusCodes.OK);
    expect(response.data.length).toBe(1);
  });

  it("getCommitsAsync returns commits for a file", async () => {
    const response = await gitHubClient.getCommitsAsync(
      samplesRepo.owner.login,
      samplesRepo.name,
      samplesBranch.name,
      sampleFilePath,
      1,
      1
    );
    expect(response.status).toBe(HttpStatusCodes.OK);
    expect(response.data.length).toBe(1);
  });

  it("getDirContentsAsync returns files in the repo", async () => {
    const response = await gitHubClient.getDirContentsAsync(
      samplesRepo.owner.login,
      samplesRepo.name,
      samplesBranch.name,
      ""
    );
    expect(response.status).toBe(HttpStatusCodes.OK);
    expect(response.data.length).toBeGreaterThan(0);
    expect(response.data[0].repo).toEqual(samplesRepo);
    expect(response.data[0].branch).toEqual(samplesBranch);
  });

  it("getDirContentsAsync returns files in a dir", async () => {
    const response = await gitHubClient.getDirContentsAsync(
      samplesRepo.owner.login,
      samplesRepo.name,
      samplesBranch.name,
      sampleDirPath
    );
    expect(response.status).toBe(HttpStatusCodes.OK);
    expect(response.data.length).toBeGreaterThan(0);
    expect(response.data[0].repo).toEqual(samplesRepo);
    expect(response.data[0].branch).toEqual(samplesBranch);
  });

  it("getFileContentsAsync returns a file", async () => {
    const response = await gitHubClient.getFileContentsAsync(
      samplesRepo.owner.login,
      samplesRepo.name,
      samplesBranch.name,
      sampleFilePath
    );
    expect(response.status).toBe(HttpStatusCodes.OK);
    expect(response.data.path).toBe(sampleFilePath);
    expect(response.data.repo).toEqual(samplesRepo);
    expect(response.data.branch).toEqual(samplesBranch);
  });
});
