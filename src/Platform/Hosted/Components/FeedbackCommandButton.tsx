import * as React from "react";
import FeedbackIcon from "../../../../images/Feedback.svg";

export const FeedbackCommandButton: React.FunctionComponent = () => {
  const onClick = () => {
    window.open("https://aka.ms/cosmosdbfeedback?subject=Cosmos%20DB%20Hosted%20Data%20Explorer%20Feedback");
  };

  return (
    <div className="feedbackConnectSettingIcons">
      <div className="commandButtonReact">
        <a href="#" title="Send feedback" aria-haspopup="dialog" onClick={onClick}>
          <img src={FeedbackIcon} alt="Send feedback" />
        </a>
      </div>
    </div>
  );
};
