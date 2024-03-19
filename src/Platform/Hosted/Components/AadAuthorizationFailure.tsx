import { AadAuthFailure } from "hooks/useAADAuth";
import * as React from "react";
import ConnectImage from "../../../../images/HdeConnectCosmosDB.svg";
import "../AadAuthorizationFailure.less";

interface Props {
  authFailure: AadAuthFailure;
}

export const AadAuthorizationFailure: React.FunctionComponent<Props> = ({ authFailure }: Props) => {
  return (
    <div id="aadAuthFailure" className="aadAuthFailureContainer" style={{ display: "flex" }}>
      <div className="aadAuthFailureFormContainer">
        <div className="aadAuthFailure">
          <p className="aadAuthFailureContent">
            <img src={ConnectImage} alt="Azure Cosmos DB" />
          </p>
          <p className="authFailureTitle">Authorization Failure</p>
          <p className="authFailureMessage">{authFailure.failureMessage}</p>
          {authFailure.failureLinkTitle && (
            <p className="authFailureLink" onClick={authFailure.failureLinkAction}>
              {authFailure.failureLinkTitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
