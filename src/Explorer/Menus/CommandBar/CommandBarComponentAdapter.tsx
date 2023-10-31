/**
 * This adapter is responsible to render the React component
 * If the component signals a change through the callback passed in the properties, it must render the React component when appropriate
 * and update any knockout observables passed from the parent.
 */
import { CommandBar as FluentCommandBar, ICommandBarItemProps } from "@fluentui/react";
import { AuthType } from "AuthType";
import { useNotebook } from "Explorer/Notebook/useNotebook";
import { userContext } from "UserContext";
import * as React from "react";
import create, { UseStore } from "zustand";
import { ConnectionStatusType, StyleConstants } from "../../../Common/Constants";
import { CommandButtonComponentProps } from "../../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../../Explorer";
import { useSelectedNode } from "../../useSelectedNode";
import * as CommandBarUtil from "./CommandBarUtil";
import * as createContextCommandBarButtons from "./CommandButtonsFactories/createContextCommandBarButtons";
import * as createControlCommandBarButtons from "./CommandButtonsFactories/createControlCommandBarButtons";
import * as createPostgreButtons from "./CommandButtonsFactories/createPostgreButtons";
import * as createStaticCommandBarButtons from "./CommandButtonsFactories/createStaticCommandBarButtons";
import * as createStaticCommandBarButtonsForResourceToken from "./CommandButtonsFactories/createStaticCommandBarButtonsForResourceToken";

interface Props {
  container: Explorer;
}

export interface CommandBarStore {
  contextButtons: CommandButtonComponentProps[];
  setContextButtons: (contextButtons: CommandButtonComponentProps[]) => void;
}

export const useCommandBar: UseStore<CommandBarStore> = create((set) => ({
  contextButtons: [],
  setContextButtons: (contextButtons: CommandButtonComponentProps[]) => set((state) => ({ ...state, contextButtons })),
}));

export const CommandBar: React.FC<Props> = ({ container }: Props) => {
  const selectedNodeState = useSelectedNode();
  const buttons = useCommandBar((state) => state.contextButtons);
  const backgroundColor = StyleConstants.BaseLight;

  if (userContext.apiType === "Postgres") {
    const buttons = createPostgreButtons.createPostgreButtons(container);
    return (
      <div className="commandBarContainer">
        <FluentCommandBar
          ariaLabel="Use left and right arrow keys to navigate between commands"
          items={CommandBarUtil.convertButton(buttons, backgroundColor)}
          styles={{
            root: { backgroundColor: backgroundColor },
          }}
          overflowButtonProps={{ ariaLabel: "More commands" }}
        />
      </div>
    );
  }

  const staticButtons =
    userContext.authType === AuthType.ResourceToken
      ? createStaticCommandBarButtonsForResourceToken.createStaticCommandBarButtonsForResourceToken(
          container,
          selectedNodeState
        )
      : createStaticCommandBarButtons.createStaticCommandBarButtons(container, selectedNodeState);

  const contextButtons = (buttons || []).concat(
    createContextCommandBarButtons.createContextCommandBarButtons(container, selectedNodeState)
  );
  const controlButtons = createControlCommandBarButtons.createControlCommandBarButtons(container);

  const uiFabricStaticButtons = CommandBarUtil.convertButton(staticButtons, backgroundColor);
  if (buttons && buttons.length > 0) {
    uiFabricStaticButtons.forEach((btn: ICommandBarItemProps) => (btn.iconOnly = true));
  }

  const uiFabricTabsButtons: ICommandBarItemProps[] = CommandBarUtil.convertButton(contextButtons, backgroundColor);

  if (uiFabricTabsButtons.length > 0) {
    uiFabricStaticButtons.push(CommandBarUtil.createDivider("commandBarDivider"));
  }

  const uiFabricControlButtons = CommandBarUtil.convertButton(controlButtons, backgroundColor);
  uiFabricControlButtons.forEach((btn: ICommandBarItemProps) => (btn.iconOnly = true));

  const connectionInfo = useNotebook((state) => state.connectionInfo);

  if (
    (useNotebook.getState().isPhoenixNotebooks || useNotebook.getState().isPhoenixFeatures) &&
    connectionInfo?.status !== ConnectionStatusType.Connect
  ) {
    uiFabricControlButtons.unshift(CommandBarUtil.createConnectionStatus(container, "connectionStatus"));
  }

  return (
    <div className="commandBarContainer">
      <FluentCommandBar
        ariaLabel="Use left and right arrow keys to navigate between commands"
        items={uiFabricStaticButtons.concat(uiFabricTabsButtons)}
        farItems={uiFabricControlButtons}
        styles={{
          root: { backgroundColor: backgroundColor },
        }}
        overflowButtonProps={{ ariaLabel: "More commands" }}
      />
    </div>
  );
};
