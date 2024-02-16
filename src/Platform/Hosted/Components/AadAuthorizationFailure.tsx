import { AadAuthFailure } from "hooks/useAADAuth";
import * as React from "react";
import ConnectImage from "../../../../images/HdeConnectCosmosDB.svg";
import "../AadAuthorizationFailure.less";

interface Props {
  authFailure: AadAuthFailure;
}

export const AadAuthorizationFailure: React.FunctionComponent<Props> = ({ authFailure }: Props) => {
  return (
    <div id="connectExplorer" className="connectExplorerContainer" style={{ display: "flex" }}>
      <div className="connectExplorerFormContainer">
        <div className="connectExplorer">
          <p className="connectExplorerContent">
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
