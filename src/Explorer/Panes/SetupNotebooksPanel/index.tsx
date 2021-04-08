import React, { FunctionComponent } from "react";
import Explorer from "../../Explorer";

interface ISetupNoteBooksPanelProps {
  explorer: Explorer;
  closePanel: () => void;
}
const SetupNoteBooksPanel: FunctionComponent<ISetupNoteBooksPanelProps> = ({
  explorer,
  closePanel,
}: ISetupNoteBooksPanelProps): JSX.Element => {
  return <div>This is Setup Notebooks Panel React</div>;
};

export default SetupNoteBooksPanel;
