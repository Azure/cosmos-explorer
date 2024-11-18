/**
 * This adapter is responsible to render the React component
 * If the component signals a change through the callback passed in the properties, it must render the React component when appropriate
 * and update any knockout observables passed from the parent.
 */
import { CommandBar as FluentCommandBar, ICommandBarItemProps } from "@fluentui/react";
import {
  createPlatformButtons,
  createStaticCommandBarButtons,
} from "Explorer/Menus/CommandBar/CommandBarComponentButtonFactory";
import { useCommandBar } from "Explorer/Menus/CommandBar/useCommandBar";
import { useNotebook } from "Explorer/Notebook/useNotebook";
import { KeyboardActionGroup, useKeyboardActionGroup } from "KeyboardShortcuts";
import * as React from "react";
import { ConnectionStatusType, PoolIdType } from "../../../Common/Constants";
import { StyleConstants } from "../../../Common/StyleConstants";
import { Platform, configContext } from "../../../ConfigContext";
import Explorer from "../../Explorer";
import { useSelectedNode } from "../../useSelectedNode";
import * as CommandBarUtil from "./CommandBarUtil";

interface Props {
  container: Explorer;
}

export const CommandBar: React.FC<Props> = ({ container }: Props) => {
  const selectedNodeState = useSelectedNode();
  const contextButtons = useCommandBar((state) => state.contextButtons);
  const isHidden = useCommandBar((state) => state.isHidden);
  const backgroundColor = StyleConstants.BaseLight;
  const setKeyboardHandlers = useKeyboardActionGroup(KeyboardActionGroup.COMMAND_BAR);
  const staticButtons = createStaticCommandBarButtons(selectedNodeState);
  const platformButtons = createPlatformButtons();

  const uiFabricStaticButtons = CommandBarUtil.convertButton(staticButtons, backgroundColor, container);
  if (contextButtons?.length > 0) {
    uiFabricStaticButtons.forEach((btn: ICommandBarItemProps) => (btn.iconOnly = true));
  }

  const uiFabricTabsButtons: ICommandBarItemProps[] = CommandBarUtil.convertButton(
    contextButtons || [],
    backgroundColor,
    container,
  );

  if (uiFabricTabsButtons.length > 0) {
    uiFabricStaticButtons.push(CommandBarUtil.createDivider("commandBarDivider"));
  }

  const uiFabricPlatformButtons = CommandBarUtil.convertButton(platformButtons || [], backgroundColor, container);
  uiFabricPlatformButtons.forEach((btn: ICommandBarItemProps) => (btn.iconOnly = true));

  const connectionInfo = useNotebook((state) => state.connectionInfo);

  if (
    (useNotebook.getState().isPhoenixNotebooks || useNotebook.getState().isPhoenixFeatures) &&
    connectionInfo?.status !== ConnectionStatusType.Connect
  ) {
    uiFabricPlatformButtons.unshift(
      CommandBarUtil.createConnectionStatus(container, PoolIdType.DefaultPoolId, "connectionStatus"),
    );
  }

  const rootStyle =
    configContext.platform === Platform.Fabric
      ? {
          root: {
            backgroundColor: "transparent",
            padding: "2px 8px 0px 8px",
          },
        }
      : {
          root: {
            backgroundColor: backgroundColor,
          },
        };

  const allButtons = staticButtons.concat(contextButtons).concat(platformButtons);
  const keyboardHandlers = CommandBarUtil.createKeyboardHandlers(allButtons, container);
  setKeyboardHandlers(keyboardHandlers);

  return (
    <div className="commandBarContainer" style={{ display: isHidden ? "none" : "initial" }}>
      <FluentCommandBar
        ariaLabel="Use left and right arrow keys to navigate between commands"
        items={uiFabricStaticButtons.concat(uiFabricTabsButtons)}
        farItems={uiFabricPlatformButtons}
        styles={rootStyle}
        overflowButtonProps={{ ariaLabel: "More commands" }}
      />
    </div>
  );
};
