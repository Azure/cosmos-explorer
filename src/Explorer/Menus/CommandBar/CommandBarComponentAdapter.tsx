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
import { useObservable } from "../../../hooks/useObservable";
import { CommandButtonComponentProps } from "../../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../../Explorer";
import * as CommandBarComponentButtonFactory from "./CommandBarComponentButtonFactory";
import * as CommandBarUtil from "./CommandBarUtil";

// export class CommandBarComponentAdapter implements ReactAdapter {
//   public parameters: ko.Observable<number>;
//   public container: Explorer;
//   private tabsButtons: CommandButtonComponentProps[];
//   private isNotebookTabActive: ko.Computed<boolean>;

//   constructor(container: Explorer) {
//     this.container = container;
//     this.tabsButtons = [];
//     this.isNotebookTabActive = ko.computed(
//       () => container.tabsManager.activeTab()?.tabKind === ViewModels.CollectionTabKind.NotebookV2
//     );

//     // These are the parameters watched by the react binding that will trigger a renderComponent() if one of the ko mutates
//     const toWatch = [
//       container.isDatabaseNodeOrNoneSelected,
//       container.isDatabaseNodeSelected,
//       container.isNoneSelected,
//       container.isResourceTokenCollectionNodeSelected,
//       container.isHostedDataExplorerEnabled,
//       container.isSynapseLinkUpdating,
//       userContext?.databaseAccount,
//       this.isNotebookTabActive,
//       container.isServerlessEnabled,
//     ];
//   }

//   public onUpdateTabsButtons(buttons: CommandButtonComponentProps[]): void {
//     this.tabsButtons = buttons;
//   }

//   public renderComponent(): JSX.Element {
//     const backgroundColor = StyleConstants.BaseLight;

//     const staticButtons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(this.container);
//     const contextButtons = (this.tabsButtons || []).concat(
//       CommandBarComponentButtonFactory.createContextCommandBarButtons(this.container)
//     );
//     const controlButtons = CommandBarComponentButtonFactory.createControlCommandBarButtons(this.container);

//     const uiFabricStaticButtons = CommandBarUtil.convertButton(staticButtons, backgroundColor);
//     if (this.tabsButtons && this.tabsButtons.length > 0) {
//       uiFabricStaticButtons.forEach((btn: ICommandBarItemProps) => (btn.iconOnly = true));
//     }

//     const uiFabricTabsButtons: ICommandBarItemProps[] = CommandBarUtil.convertButton(contextButtons, backgroundColor);

//     if (uiFabricTabsButtons.length > 0) {
//       uiFabricStaticButtons.push(CommandBarUtil.createDivider("commandBarDivider"));
//     }

//     const uiFabricControlButtons = CommandBarUtil.convertButton(controlButtons, backgroundColor);
//     uiFabricControlButtons.forEach((btn: ICommandBarItemProps) => (btn.iconOnly = true));

//     if (this.container.tabsManager.activeTab()?.tabKind === ViewModels.CollectionTabKind.NotebookV2) {
//       uiFabricControlButtons.unshift(
//         CommandBarUtil.createMemoryTracker("memoryTracker", this.container.memoryUsageInfo)
//       );
//     }

//     return (
//       <div className="commandBarContainer">
//         <CommandBar
//           ariaLabel="Use left and right arrow keys to navigate between commands"
//           items={uiFabricStaticButtons.concat(uiFabricTabsButtons)}
//           farItems={uiFabricControlButtons}
//           styles={{
//             root: { backgroundColor: backgroundColor },
//           }}
//           overflowButtonProps={{ ariaLabel: "More commands" }}
//         />
//       </div>
//     );
//   }
// }

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
  useObservable(container.selectedNode);
  console.log(container.selectedNode());
  const buttons = useCommandBar((state) => state.contextButtons);
  const backgroundColor = StyleConstants.BaseLight;

  const staticButtons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(container);
  const contextButtons = (buttons || []).concat(
    CommandBarComponentButtonFactory.createContextCommandBarButtons(container)
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

  if (container.tabsManager.activeTab()?.tabKind === ViewModels.CollectionTabKind.NotebookV2) {
    uiFabricControlButtons.unshift(CommandBarUtil.createMemoryTracker("memoryTracker", container.memoryUsageInfo));
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
