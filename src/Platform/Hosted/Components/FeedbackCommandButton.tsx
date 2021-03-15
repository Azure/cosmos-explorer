import * as React from "react";
import FeedbackIcon from "../../../../images/Feedback.svg";
import { CommandButtonComponent } from "../../../Explorer/Controls/CommandButton/CommandButtonComponent";

export const FeedbackCommandButton: React.FunctionComponent = () => {
  return (
    <div className="feedbackConnectSettingIcons">
      <CommandButtonComponent
        id="commandbutton-feedback"
        iconSrc={FeedbackIcon}
        iconAlt="feeback button"
        onCommandClick={() =>
          window.open("https://aka.ms/cosmosdbfeedback?subject=Cosmos%20DB%20Hosted%20Data%20Explorer%20Feedback")
        }
        ariaLabel="feeback button"
        tooltipText="Send feedback"
        hasPopup={true}
        disabled={false}
      />
    </div>
  );
};
