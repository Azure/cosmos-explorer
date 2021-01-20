export interface IGitHubConnectorParams {
  state: string;
  code: string;
}

export const GitHubConnectorMsgType = "GitHubConnectorMsgType";

export class GitHubConnector {
  public start(params: URLSearchParams, window: Window & typeof globalThis) {
    window.postMessage(
      {
        type: GitHubConnectorMsgType,
        data: {
          state: params.get("state"),
          code: params.get("code"),
        } as IGitHubConnectorParams,
      },
      window.location.origin
    );
  }
}

var connector = new GitHubConnector();
window.addEventListener("load", () => {
  const openerWindow = window.opener;
  if (openerWindow) {
    connector.start(new URLSearchParams(document.location.search), openerWindow);
    window.close();
  }
});
