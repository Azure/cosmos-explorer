import * as React from "react";
import InfoIcon from "../../../../images/info_color.svg";
import "./InfoBox.less";

export interface InfoBoxComponentProps {
  message: string;
  url: string;
  title?: string;
}

export const InfoBoxComponent: React.FunctionComponent<InfoBoxComponentProps> = (
  props: InfoBoxComponentProps
): JSX.Element => {
  return (
    <div className="infoBoxContent">
      <span>
        <img className="infoBoxIcon" src={InfoIcon} alt="message" />
      </span>
      <span className="infoBoxDetails">
        <span className="infoBoxMessage" title={props.title}>
          {props.message}
        </span>
        <a
          className="underlinedLink"
          aria-label={props.message}
          target="_blank"
          rel="noreferrer"
          href={props.url}
          tabIndex={0}
        >
          More details
        </a>
      </span>
    </div>
  );
};
