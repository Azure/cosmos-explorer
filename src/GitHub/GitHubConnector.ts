import postRobot from "post-robot";

export interface IGitHubConnectorParams {
  state: string;
  code: string;
}

export const GitHubConnectorMsgType = "GitHubConnectorMsgType";

window.addEventListener("load", async () => {
  const openerWindow = window.opener;
  if (openerWindow) {
    const params = new URLSearchParams(document.location.search);
    await postRobot.send(
      openerWindow,
      GitHubConnectorMsgType,
      {
        state: params.get("state"),
        code: params.get("code"),
      } as IGitHubConnectorParams,
      {
        domain: window.location.origin,
      },
    );
    window.close();
  }
});
