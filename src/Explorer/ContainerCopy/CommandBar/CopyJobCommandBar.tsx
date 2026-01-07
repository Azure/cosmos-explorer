import { CommandBar as FluentCommandBar, ICommandBarItemProps } from "@fluentui/react";
import React from "react";
import { useThemeStore } from "../../../hooks/useTheme";
import { CommandButtonComponentProps } from "../../Controls/CommandButton/CommandButtonComponent";
import * as CommandBarUtil from "../../Menus/CommandBar/CommandBarUtil";
import { getThemeTokens } from "../../Theme/ThemeUtil";
import { ContainerCopyProps } from "../Types/CopyJobTypes";
import { getCommandBarButtons } from "./Utils";

const CopyJobCommandBar: React.FC<ContainerCopyProps> = ({ explorer }) => {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const themeTokens = getThemeTokens(isDarkMode);
  const backgroundColor = themeTokens.colorNeutralBackground1;

  const rootStyle = {
    root: {
      backgroundColor: backgroundColor,
    },
  };

  const commandBarItems: CommandButtonComponentProps[] = getCommandBarButtons(explorer, isDarkMode);
  const controlButtons: ICommandBarItemProps[] = CommandBarUtil.convertButton(commandBarItems, backgroundColor);

  return (
    <div className="commandBarContainer" style={{ backgroundColor }}>
      <FluentCommandBar
        ariaLabel="Use left and right arrow keys to navigate between commands"
        styles={rootStyle}
        items={controlButtons}
      />
    </div>
  );
};

CopyJobCommandBar.displayName = "CopyJobCommandBar";

export default CopyJobCommandBar;
