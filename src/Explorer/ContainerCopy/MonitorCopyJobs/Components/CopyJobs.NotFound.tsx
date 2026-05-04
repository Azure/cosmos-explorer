import { ActionButton, Image } from "@fluentui/react";
import Explorer from "Explorer/Explorer";
import React from "react";
import CopyJobIcon from "../../../../../images/ContainerCopy/copy-jobs.svg";
import { Keys, t } from "Localization";
import * as Actions from "../../Actions/CopyJobActions";

interface CopyJobsNotFoundProps {
  explorer: Explorer;
}

const CopyJobsNotFound: React.FC<CopyJobsNotFoundProps> = ({ explorer }) => {
  return (
    <div className="notFoundContainer flexContainer centerContent">
      <Image src={CopyJobIcon} alt={t(Keys.containerCopy.noCopyJobs.title)} width={100} height={100} />
      <h4 className="noCopyJobsMessage">{t(Keys.containerCopy.noCopyJobs.title)}</h4>
      <ActionButton
        allowDisabledFocus
        className="createCopyJobButton"
        onClick={() => Actions.openCreateCopyJobPanel(explorer)}
      >
        {t(Keys.containerCopy.noCopyJobs.createCopyJobButtonText)}
      </ActionButton>
    </div>
  );
};

export default React.memo(CopyJobsNotFound);
