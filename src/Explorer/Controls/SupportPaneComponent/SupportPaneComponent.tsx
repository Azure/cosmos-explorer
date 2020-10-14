import * as _ from "underscore";
import React from "react";
import ReactWebChat, { createDirectLine } from "botframework-webchat";

export interface SupportPaneComponentProps {
  directLineToken: string;
}

export class SupportPaneComponent extends React.Component<SupportPaneComponentProps> {
  private readonly userId: string = _.uniqueId();

  constructor(props: SupportPaneComponentProps) {
    super(props);
  }

  public render(): JSX.Element {
    const styleOptions = {
      bubbleBackground: "rgba(0, 0, 255, .1)",
      bubbleFromUserBackground: "rgba(0, 255, 0, .1)"
    };
    const directLine = createDirectLine({ token: this.props.directLineToken });
    return <ReactWebChat directLine={directLine} userID={this.userId} styleOptions={styleOptions} />;
  }
}
