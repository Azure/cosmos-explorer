import { CommandBar as FluentCommandBar, ICommandBarItemProps } from "@fluentui/react";
import React from "react";
import { StyleConstants } from "../../../Common/StyleConstants";
import { CommandButtonComponentProps } from "../../Controls/CommandButton/CommandButtonComponent";
import * as CommandBarUtil from "../../Menus/CommandBar/CommandBarUtil";
import { ContainerCopyProps } from "../Types";
import { getCommandBarButtons } from "./Utils";

const backgroundColor = StyleConstants.BaseLight;
const rootStyle = {
  root: {
    backgroundColor: backgroundColor,
  },
};

const CopyJobCommandBar: React.FC<ContainerCopyProps> = ({ container }) => {
  const commandBarItems: CommandButtonComponentProps[] = getCommandBarButtons(container);
  const controlButtons: ICommandBarItemProps[] = CommandBarUtil.convertButton(commandBarItems, backgroundColor);

  return (
    <div className="commandBarContainer">
      <FluentCommandBar
        ariaLabel="Use left and right arrow keys to navigate between commands"
        styles={rootStyle}
        items={controlButtons}
      />
    </div>
  );
};

export default CopyJobCommandBar;
