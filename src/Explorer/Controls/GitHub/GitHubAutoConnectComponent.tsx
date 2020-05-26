import * as React from "react";

export interface GitHubAutoConnectComponentProps {
  oauthUrl: string;
}

export class GitHubAutoConnectComponent extends React.Component<GitHubAutoConnectComponentProps> {
  public render(): JSX.Element {
    const params: React.IframeHTMLAttributes<HTMLIFrameElement> = {
      src: this.props.oauthUrl || "about:blank",
      width: 0,
      height: 0,
      tabIndex: 0,
      style: {
        display: "none"
      }
    };

    return <iframe {...params} />;
  }
}
