import { HttpStatusCodes } from "../Common/Constants";
import Explorer from "../Explorer/Explorer";
import NotebookManager from "../Explorer/Notebook/NotebookManager";
import { JunoClient } from "../Juno/JunoClient";
import { IGitHubConnectorParams } from "./GitHubConnector";
import { GitHubOAuthService } from "./GitHubOAuthService";

describe("GitHubOAuthService", () => {
  let junoClient: JunoClient;
  let gitHubOAuthService: GitHubOAuthService;
  let originalDataExplorer: Explorer;

  beforeEach(() => {
    junoClient = new JunoClient();
    gitHubOAuthService = new GitHubOAuthService(junoClient);
    originalDataExplorer = window.dataExplorer;
    window.dataExplorer = {
      ...originalDataExplorer,
    } as Explorer;
    window.dataExplorer.notebookManager = new NotebookManager();
    window.dataExplorer.notebookManager.junoClient = junoClient;
    window.dataExplorer.notebookManager.gitHubOAuthService = gitHubOAuthService;
  });

  afterEach(() => {
    jest.resetAllMocks();
    window.dataExplorer = originalDataExplorer;
    originalDataExplorer = undefined;
    gitHubOAuthService = undefined;
    junoClient = undefined;
  });

  it("logout deletes app authorization and resets token", async () => {
    const deleteAppAuthorizationCallback = jest.fn().mockReturnValue({ status: HttpStatusCodes.NoContent });
    junoClient.deleteAppAuthorization = deleteAppAuthorizationCallback;

    await gitHubOAuthService.logout();
    expect(deleteAppAuthorizationCallback).toHaveBeenCalled();
    expect(gitHubOAuthService.getTokenObservable()()).toBeUndefined();
  });

  it("resetToken resets token", () => {
    gitHubOAuthService.resetToken();
    expect(gitHubOAuthService.getTokenObservable()()).toBeUndefined();
  });

  it("startOAuth resets OAuth state", async () => {
    let url: string;
    const windowOpenCallback = jest.fn().mockImplementation((value: string) => {
      url = value;
    });
    window.open = windowOpenCallback;

    await gitHubOAuthService.startOAuth("scope");
    expect(windowOpenCallback).toHaveBeenCalled();

    const initialParams = new URLSearchParams(new URL(url).search);
    expect(initialParams.get("state")).toBeDefined();

    await gitHubOAuthService.startOAuth("another scope");
    expect(windowOpenCallback).toHaveBeenCalled();

    const newParams = new URLSearchParams(new URL(url).search);
    expect(newParams.get("state")).toBeDefined();
    expect(newParams.get("state")).not.toEqual(initialParams.get("state"));
  });

  it("finishOAuth updates token", async () => {
    const data = { key: "value" };
    const getGitHubTokenCallback = jest.fn().mockReturnValue({ status: HttpStatusCodes.OK, data });
    junoClient.getGitHubToken = getGitHubTokenCallback;

    const initialToken = gitHubOAuthService.getTokenObservable()();
    const state = await gitHubOAuthService.startOAuth("scope");

    const params: IGitHubConnectorParams = {
      state,
      code: "code",
    };
    await gitHubOAuthService.finishOAuth(params);
    const updatedToken = gitHubOAuthService.getTokenObservable()();

    expect(getGitHubTokenCallback).toHaveBeenCalledWith("code");
    expect(initialToken).not.toEqual(updatedToken);
  });

  it("finishOAuth updates token to error if state doesn't match", async () => {
    await gitHubOAuthService.startOAuth("scope");

    const params: IGitHubConnectorParams = {
      state: "state",
      code: "code",
    };
    await gitHubOAuthService.finishOAuth(params);

    expect(gitHubOAuthService.getTokenObservable()().error).toBeDefined();
  });

  it("finishOAuth updates token to error if unable to fetch token", async () => {
    const getGitHubTokenCallback = jest.fn().mockReturnValue({ status: HttpStatusCodes.NotFound });
    junoClient.getGitHubToken = getGitHubTokenCallback;

    const state = await gitHubOAuthService.startOAuth("scope");

    const params: IGitHubConnectorParams = {
      state,
      code: "code",
    };
    await gitHubOAuthService.finishOAuth(params);

    expect(getGitHubTokenCallback).toHaveBeenCalledWith("code");
    expect(gitHubOAuthService.getTokenObservable()().error).toBeDefined();
  });

  it("isLoggedIn returns false if resetToken is called", () => {
    gitHubOAuthService.resetToken();
    expect(gitHubOAuthService.isLoggedIn()).toBeFalsy();
  });

  it("isLoggedIn returns false if logout is called", async () => {
    const deleteAppAuthorizationCallback = jest.fn().mockReturnValue({ status: HttpStatusCodes.NoContent });
    junoClient.deleteAppAuthorization = deleteAppAuthorizationCallback;

    await gitHubOAuthService.logout();
    expect(gitHubOAuthService.isLoggedIn()).toBeFalsy();
  });
});
