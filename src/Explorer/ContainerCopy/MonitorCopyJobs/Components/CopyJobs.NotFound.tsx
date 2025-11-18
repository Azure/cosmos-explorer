import { ActionButton, Image } from "@fluentui/react";
import React, { useCallback } from "react";
import CopyJobIcon from "../../../../../images/ContainerCopy/copy-jobs.svg";
import * as Actions from "../../Actions/CopyJobActions";
import ContainerCopyMessages from "../../ContainerCopyMessages";

interface CopyJobsNotFoundProps {}

const CopyJobsNotFound: React.FC<CopyJobsNotFoundProps> = () => {
  const handleCreateCopyJob = useCallback(Actions.openCreateCopyJobPanel, []);
  return (
    <div className="notFoundContainer flexContainer centerContent">
      <Image src={CopyJobIcon} alt={ContainerCopyMessages.noCopyJobsTitle} width={100} height={100} />
      <h4 className="noCopyJobsMessage">{ContainerCopyMessages.noCopyJobsTitle}</h4>
      <ActionButton allowDisabledFocus className="createCopyJobButton" onClick={handleCreateCopyJob}>
        {ContainerCopyMessages.createCopyJobButtonText}
      </ActionButton>
    </div>
  );
};

export default CopyJobsNotFound;
