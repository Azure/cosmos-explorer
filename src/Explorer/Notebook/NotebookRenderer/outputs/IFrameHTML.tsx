import * as React from "react";
import styled from "styled-components";

interface Props {
  /**
   * The HTML string that will be rendered.
   */
  data: string;
  /**
   * The media type associated with the HTML
   * string. This defaults to text/html.
   */
  mediaType: "text/html";
}

const StyledIFrame = styled.iframe`
  width: 100%;
  border-style: unset;
`;

export class IFrameHTML extends React.PureComponent<Props> {
  static defaultProps = {
    data: "",
    mediaType: "text/html"
  };

  frame?: HTMLIFrameElement;

  appendChildDOM(): void {
    if (!this.frame) {
      return;
    }

    this.frame.contentDocument.open();
    this.frame.contentDocument.write(this.props.data);
    this.frame.contentDocument.close();
  }

  componentDidMount(): void {
    this.appendChildDOM();
  }

  componentDidUpdate(): void {
    this.appendChildDOM();
  }

  render() {
    return (
      <StyledIFrame
        ref={frame => this.frame = frame}
        allow="accelerometer; autoplay; camera; gyroscope; magnetometer; microphone; xr-spatial-tracking"
        sandbox="allow-downloads allow-forms allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-popups-to-escape-sandbox"
        onLoad={() => this.onFrameLoaded()} />
    );
  }

  onFrameLoaded() {
    this.frame.height = (this.frame.contentDocument.body.scrollHeight + 4) + "px";
    this.frame.contentDocument.body.style.margin = "0px";
  }
}

export default IFrameHTML;