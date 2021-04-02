import React from "react";
import IFrameHTML from "./IFrameHTML";

interface Props {
  /**
   * The JavaScript code that we would like to execute.
   */
  data: string;
  /**
   * The media type associated with our component.
   */
  mediaType: "text/javascript";
}

export class IFrameJavaScript extends React.PureComponent<Props> {
  static defaultProps = {
    data: "",
    mediaType: "application/javascript"
  };

  render() {
    return (
      <IFrameHTML data={`<script>${this.props.data}</script>`} />
    );
  }
}

export default IFrameJavaScript;