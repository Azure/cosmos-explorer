import { AadAuthFailure } from "hooks/useAADAuth";
import * as React from "react";
import ConnectImage from "../../../../images/HdeConnectCosmosDB.svg";

interface Props {
  authFailure: AadAuthFailure;
}

export const AadAuthorizationFailure: React.FunctionComponent<Props> = ({ authFailure }: Props) => {
  return (
    <div id="aadAuthorizationFailure" className="connectExplorerContainer" style={{ display: "flex" }}>
      <div className="connectExplorerFormContainer">
        <div className="connectExplorer">
          <p className="connectExplorerContent">
            <img src={ConnectImage} alt="Azure Cosmos DB" />
          </p>
          <p className="welcomeText">Authorization Failure</p>
          <p className="welcomeText">{authFailure.failureMessage}</p>
          {authFailure.failureLinkTitle && (
            <p className="switchConnectTypeText" onClick={authFailure.failureLinkAction}>
              {authFailure.failureLinkTitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
