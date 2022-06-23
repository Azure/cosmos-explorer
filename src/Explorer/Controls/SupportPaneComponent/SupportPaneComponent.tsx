import { Activity } from "botframework-directlinejs";
import ReactWebChat, { createDirectLine } from "botframework-webchat";
import React from "react";
import * as _ from "underscore";
export interface SupportPaneComponentProps {
  directLineToken: string;
  userToken: string;
  subId: string;
  rg: string;
  accName: string;
}

export class SupportPaneComponent extends React.Component<SupportPaneComponentProps> {
  private readonly userId: string = _.uniqueId();

  constructor(props: SupportPaneComponentProps) {
    super(props);
  }

  public render(): JSX.Element {
    const styleOptions = {
      bubbleBackground: "rgba(0, 0, 255, .1)",
      bubbleFromUserBackground: "rgba(0, 255, 0, .1)",
    };

    const directLine = createDirectLine({ token: this.props.directLineToken });
    const dl = {
      ...directLine,
      postActivity: (activity: Activity) => {
        activity.channelData.token = this.props.userToken;
        activity.channelData.subId = this.props.subId;
        activity.channelData.rg = this.props.rg;
        activity.channelData.accName = this.props.accName;

        return directLine.postActivity(activity);
      },
    };

    return <ReactWebChat directLine={dl} userID={this.userId} styleOptions={styleOptions} />;
  }
}
