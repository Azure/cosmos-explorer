import { IconButton, Spinner, SpinnerSize } from "@fluentui/react";
import * as React from "react";
import { PassedPromptProps } from "./Prompt";
import "./Prompt.less";

export const promptContent = (props: PassedPromptProps): JSX.Element => {
  if (props.status === "busy") {
    const stopButtonText = "Stop cell execution";
    return (
      <div
        style={{ position: "sticky", width: "100%", maxHeight: "100%", left: 0, top: 0, zIndex: 300 }}
        className={props.isHovered ? "" : "greyStopButton"}
      >
        <IconButton
          className="runCellButton"
          iconProps={{ iconName: "CircleStopSolid" }}
          title={stopButtonText}
          ariaLabel={stopButtonText}
          onClick={props.stopCell}
          style={{ position: "absolute" }}
        />
        <Spinner size={SpinnerSize.large} style={{ position: "absolute", width: "100%", paddingTop: 5 }} />
      </div>
    );
  } else if (props.isHovered) {
    const playButtonText = "Run cell";
    return (
      <IconButton
        className="runCellButton"
        iconProps={{ iconName: "MSNVideosSolid" }}
        title={playButtonText}
        ariaLabel={playButtonText}
        onClick={props.runCell}
      />
    );
  } else {
    return <div style={{ paddingTop: 7 }}>{promptText(props)}</div>;
  }
};

/**
 * Generate what text goes inside the prompt based on the props to the prompt
 */
const promptText = (props: PassedPromptProps): string => {
  if (props.status === "busy") {
    return "[*]";
  }
  if (props.status === "queued") {
    return "[…]";
  }
  if (typeof props.executionCount === "number") {
    return `[${props.executionCount}]`;
  }
  return "[ ]";
};
