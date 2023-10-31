import * as React from "react";
import { userContext } from "../../../../UserContext";
import { getDatabaseName } from "../../../../Utils/APITypeUtils";
import { useSidePanel } from "../../../../hooks/useSidePanel";
import AddDatabaseIcon from "../../../../images/AddDatabase.svg";
import { CommandButtonComponentProps } from "../../../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../../../Explorer";
import { AddDatabasePanel } from "../../../Panes/AddDatabasePanel/AddDatabasePanel";
import { useDatabases } from "../../../useDatabases";

export function createNewDatabase(container: Explorer): CommandButtonComponentProps {
  const label = "New " + getDatabaseName();
  return {
    iconSrc: AddDatabaseIcon,
    iconAlt: label,
    onCommandClick: async () => {
      const throughputCap = userContext.databaseAccount?.properties.capacity?.totalThroughputLimit;
      if (throughputCap && throughputCap !== -1) {
        await useDatabases.getState().loadAllOffers();
      }
      useSidePanel.getState().openSidePanel("New " + getDatabaseName(), <AddDatabasePanel explorer={container} />);
    },
    commandButtonLabel: label,
    ariaLabel: label,
    hasPopup: true,
  };
}
