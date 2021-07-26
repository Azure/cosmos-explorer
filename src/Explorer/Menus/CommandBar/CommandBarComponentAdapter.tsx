/**
 * This adapter is responsible to render the React component
 * If the component signals a change through the callback passed in the properties, it must render the React component when appropriate
 * and update any knockout observables passed from the parent.
 */
import { CommandBar as FluentCommandBar, ICommandBarItemProps } from "@fluentui/react";
import * as React from "react";
import create, { UseStore } from "zustand";
import { StyleConstants } from "../../../Common/Constants";
import * as ViewModels from "../../../Contracts/ViewModels";
import { useTabs } from "../../../hooks/useTabs";
import { CommandButtonComponentProps } from "../../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../../Explorer";
import { useSelectedNode } from "../../useSelectedNode";
import * as CommandBarComponentButtonFactory from "./CommandBarComponentButtonFactory";
import * as CommandBarUtil from "./CommandBarUtil";

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

  const staticButtons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(container, selectedNodeState);
  const contextButtons = (buttons || []).concat(
    CommandBarComponentButtonFactory.createContextCommandBarButtons(container, selectedNodeState)
  );
  const controlButtons = CommandBarComponentButtonFactory.createControlCommandBarButtons(container);

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

  if (useTabs.getState().activeTab?.tabKind === ViewModels.CollectionTabKind.NotebookV2) {
    uiFabricControlButtons.unshift(CommandBarUtil.createMemoryTracker("memoryTracker"));
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
