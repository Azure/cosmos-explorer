import ko from "knockout";
import { HttpStatusCodes } from "../Common/Constants";
import * as DataModels from "../Contracts/DataModels";
import { JunoClient } from "../Juno/JunoClient";
import { GitHubConnector, IGitHubConnectorParams } from "./GitHubConnector";
import { GitHubOAuthService } from "./GitHubOAuthService";
import { ConsoleDataType } from "../Explorer/Menus/NotificationConsole/NotificationConsoleComponent";
import NotebookManager from "../Explorer/Notebook/NotebookManager";
import Explorer from "../Explorer/Explorer";

const sampleDatabaseAccount: DataModels.DatabaseAccount = {
  id: "id",
  name: "name",
  location: "location",
  type: "type",
  kind: "kind",
  tags: [],
  properties: {
    documentEndpoint: "documentEndpoint",
    gremlinEndpoint: "gremlinEndpoint",
    tableEndpoint: "tableEndpoint",
    cassandraEndpoint: "cassandraEndpoint",
  },
};

describe("GitHubOAuthService", () => {
  let junoClient: JunoClient;
  let gitHubOAuthService: GitHubOAuthService;
  let originalDataExplorer: Explorer;

  beforeEach(() => {
    junoClient = new JunoClient(ko.observable<DataModels.DatabaseAccount>(sampleDatabaseAccount));
    gitHubOAuthService = new GitHubOAuthService(junoClient);
    originalDataExplorer = window.dataExplorer;
    window.dataExplorer = {
      ...originalDataExplorer,
      logConsoleData: (data): void =>
        data.type === ConsoleDataType.Error ? console.error(data.message) : console.log(data.message),
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
    expect(deleteAppAuthorizationCallback).toBeCalled();
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
    expect(windowOpenCallback).toBeCalled();

    const initialParams = new URLSearchParams(new URL(url).search);
    expect(initialParams.get("state")).toBeDefined();

    await gitHubOAuthService.startOAuth("another scope");
    expect(windowOpenCallback).toBeCalled();

    const newParams = new URLSearchParams(new URL(url).search);
    expect(newParams.get("state")).toBeDefined();
    expect(newParams.get("state")).not.toEqual(initialParams.get("state"));
  });

  it("finishOAuth is called whenever GitHubConnector is started", async () => {
    const finishOAuthCallback = jest.fn().mockImplementation();
    gitHubOAuthService.finishOAuth = finishOAuthCallback;

    const params: IGitHubConnectorParams = {
      state: "state",
      code: "code",
    };
    const searchParams = new URLSearchParams({ ...params });

    const gitHubConnector = new GitHubConnector();
    gitHubConnector.start(searchParams, window);

    // GitHubConnector uses Window.postMessage and there's no good way to know when the message has received
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(finishOAuthCallback).toBeCalledWith(params);
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

    expect(getGitHubTokenCallback).toBeCalledWith("code");
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

    expect(getGitHubTokenCallback).toBeCalledWith("code");
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
