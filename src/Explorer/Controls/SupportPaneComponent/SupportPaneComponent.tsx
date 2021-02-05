import * as _ from "underscore";
import React from "react";
import ReactWebChat, { createDirectLine } from "botframework-webchat";

export interface SupportPaneComponentProps {
  directLineToken: string;
  userToken: string;
  subId: string;
  rg:string;
  accName:string;
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
    
    const directLine = createDirectLine({ token: this.props.directLineToken  });
       const dl =
  {
    ...directLine,
    postActivity: (activity: any) => {
      // Add whatever needs to be added.                  
       activity.channelData.token = this.props.userToken;
       activity.channelData.subId = this.props.subId;
       activity.channelData.rg = this.props.rg;
       activity.channelData.accName = this.props.accName;
       
      //activity.channelData.MyKey = "hello";
      return directLine.postActivity(activity)
    }
  }

    return <ReactWebChat directLine={dl} userid={this.userId} styleOptions={styleOptions}/>;
    
  }
}
