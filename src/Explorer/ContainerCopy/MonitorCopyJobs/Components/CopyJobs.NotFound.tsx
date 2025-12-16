import { ActionButton, Image } from "@fluentui/react";
import Explorer from "Explorer/Explorer";
import React from "react";
import CopyJobIcon from "../../../../../images/ContainerCopy/copy-jobs.svg";
import * as Actions from "../../Actions/CopyJobActions";
import ContainerCopyMessages from "../../ContainerCopyMessages";

interface CopyJobsNotFoundProps {
  explorer: Explorer;
}

const CopyJobsNotFound: React.FC<CopyJobsNotFoundProps> = ({ explorer }) => {
  return (
    <div className="notFoundContainer flexContainer centerContent">
      <Image src={CopyJobIcon} alt={ContainerCopyMessages.noCopyJobsTitle} width={100} height={100} />
      <h4 className="noCopyJobsMessage">{ContainerCopyMessages.noCopyJobsTitle}</h4>
      <ActionButton
        allowDisabledFocus
        className="createCopyJobButton"
        onClick={() => Actions.openCreateCopyJobPanel(explorer)}
      >
        {ContainerCopyMessages.createCopyJobButtonText}
      </ActionButton>
    </div>
  );
};

export default React.memo(CopyJobsNotFound);
