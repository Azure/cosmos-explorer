import postRobot from "post-robot";

export interface IGitHubConnectorParams {
  state: string;
  code: string;
}

export const GitHubConnectorMsgType = "GitHubConnectorMsgType";

export class GitHubConnector {
  public async start(params: URLSearchParams, window: Window & typeof globalThis): Promise<void> {
    await postRobot.send(
      window,
      GitHubConnectorMsgType,
      {
        state: params.get("state"),
        code: params.get("code"),
      } as IGitHubConnectorParams,
      {
        domain: window.location.origin,
      }
    );
  }
}

var connector = new GitHubConnector();
window.addEventListener("load", async () => {
  const openerWindow = window.opener;
  if (openerWindow) {
    await connector.start(new URLSearchParams(document.location.search), openerWindow);
    window.close();
  }
});
