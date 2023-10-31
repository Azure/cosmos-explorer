import { getCollectionName } from "../../../../Utils/APITypeUtils";
import AddCollectionIcon from "../../../../images/AddCollection.svg";
import { CommandButtonComponentProps } from "../../../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../../../Explorer";

export function createNewCollectionGroup(container: Explorer): CommandButtonComponentProps {
  const label = `New ${getCollectionName()}`;
  return {
    iconSrc: AddCollectionIcon,
    iconAlt: label,
    onCommandClick: () => container.onNewCollectionClicked(),
    commandButtonLabel: label,
    ariaLabel: label,
    hasPopup: true,
    id: "createNewContainerCommandButton",
  };
}
