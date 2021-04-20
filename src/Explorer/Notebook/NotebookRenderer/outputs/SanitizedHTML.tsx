import { Media } from "@nteract/outputs";
import React from "react";
import sanitizeHtml from "sanitize-html";

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

export class SanitizedHTML extends React.PureComponent<Props> {
  static defaultProps = {
    data: "",
    mediaType: "text/html",
  };

  render(): JSX.Element {
    return <Media.HTML data={sanitize(this.props.data)} />;
  }
}

function sanitize(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: false, // allow all tags
    allowedAttributes: false, // allow all attrs
    transformTags: {
      iframe: "iframe-disabled", // disable iframes
    },
  });
}

export default SanitizedHTML;
