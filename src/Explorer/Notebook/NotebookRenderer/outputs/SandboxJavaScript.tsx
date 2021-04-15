import { Media } from "@nteract/outputs";
import React from "react";

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

export class SandboxJavaScript extends React.PureComponent<Props> {
  static defaultProps = {
    data: "",
    mediaType: "application/javascript",
  };

  render(): JSX.Element {
    return <Media.HTML data={`<script>${this.props.data}</script>`} />;
  }
}

export default SandboxJavaScript;
