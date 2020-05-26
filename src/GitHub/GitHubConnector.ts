export interface IGitHubConnectorParams {
  state: string;
  code: string;
}

export const GitHubConnectorMsgType = "GitHubConnectorMsgType";

export class GitHubConnector {
  public start(params: URLSearchParams, mainWindow: Window) {
    console.log(`Posting message to ${mainWindow.location}`);

    mainWindow.postMessage(
      {
        type: GitHubConnectorMsgType,
        data: {
          state: params.get("state"),
          code: params.get("code")
        } as IGitHubConnectorParams
      },
      mainWindow.location.origin
    );
  }
}

var connector = new GitHubConnector();
window.addEventListener("load", () => {
  const mainWindow = window.opener || window;
  if (mainWindow) {
    connector.start(new URLSearchParams(document.location.search), mainWindow);
    window.close();
  }
});
