/**
 * This adapter is responsible to render the React component
 * If the component signals a change through the callback passed in the properties, it must render the React component when appropriate
 * and update any knockout observables passed from the parent.
 */
import * as ko from "knockout";
import { CommandBar, ICommandBarItemProps } from "office-ui-fabric-react/lib/CommandBar";
import * as React from "react";
import { StyleConstants } from "../../../Common/Constants";
import { CommandButtonComponentProps } from "../../Controls/CommandButton/CommandButtonComponent";
import * as CommandBarComponentButtonFactory from "./CommandBarComponentButtonFactory";
import * as CommandBarUtil from "./CommandBarUtil";

export interface CommandBarComponentProps {
  isNotebookTabActive: boolean;
  tabsButtons: CommandButtonComponentProps[];
}

export const CommandBarComponent: React.FunctionComponent = ({ isNotebookTabActive, tabsButtons }: CommandBarComponentProps) {

  constructor(props: CommandBarComponentProps) {
    super(props);
    this.state = {
      isNotebookTabActive: false
    }

    this.container = container;
    this.tabsButtons = [];
    // this.isNotebookTabActive = ko.computed(() =>
    //   container.tabsManager.isTabActive(ViewModels.CollectionTabKind.NotebookV2)
    // );

    // These are the parameters watched by the react binding that will trigger a renderComponent() if one of the ko mutates
    const toWatch = [
      container.isPreferredApiTable,
      container.isPreferredApiMongoDB,
      container.isPreferredApiDocumentDB,
      container.isPreferredApiCassandra,
      container.isPreferredApiGraph,
      container.deleteCollectionText,
      container.deleteDatabaseText,
      container.addCollectionText,
      container.addDatabaseText,
      container.isDatabaseNodeOrNoneSelected,
      container.isDatabaseNodeSelected,
      container.isNoneSelected,
      container.isResourceTokenCollectionNodeSelected,
      container.isHostedDataExplorerEnabled,
      container.isSynapseLinkUpdating,
      container.databaseAccount,
      this.isNotebookTabActive,
      container.isServerlessEnabled,
    ];

    ko.computed(() => ko.toJSON(toWatch)).subscribe(() => this.triggerRender());
    this.parameters = ko.observable(Date.now());
  }

  public onUpdateTabsButtons(buttons: CommandButtonComponentProps[]): void {
  this.tabsButtons = buttons;
  this.triggerRender();
}

const backgroundColor = StyleConstants.BaseLight;

const staticButtons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(this.container);
const contextButtons = (this.tabsButtons || []).concat(
  CommandBarComponentButtonFactory.createContextCommandBarButtons(this.container)
);
const controlButtons = CommandBarComponentButtonFactory.createControlCommandBarButtons(this.container);

const uiFabricStaticButtons = CommandBarUtil.convertButton(staticButtons, backgroundColor);
if (this.tabsButtons && this.tabsButtons.length > 0) {
  uiFabricStaticButtons.forEach((btn: ICommandBarItemProps) => (btn.iconOnly = true));
}

const uiFabricTabsButtons: ICommandBarItemProps[] = CommandBarUtil.convertButton(contextButtons, backgroundColor);

if (uiFabricTabsButtons.length > 0) {
  uiFabricStaticButtons.push(CommandBarUtil.createDivider("commandBarDivider"));
}

const uiFabricControlButtons = CommandBarUtil.convertButton(controlButtons, backgroundColor);
uiFabricControlButtons.forEach((btn: ICommandBarItemProps) => (btn.iconOnly = true));

if (props.isNotebookTabActive) {
  uiFabricControlButtons.unshift(
    CommandBarUtil.createMemoryTracker("memoryTracker", this.container.memoryUsageInfo)
  );
}

return (
  <React.Fragment>
    <div className="commandBarContainer">
      <CommandBar
        ariaLabel="Use left and right arrow keys to navigate between commands"
        items={uiFabricStaticButtons.concat(uiFabricTabsButtons)}
        farItems={uiFabricControlButtons}
        styles={{
          root: { backgroundColor: backgroundColor },
        }}
        overflowButtonProps={{ ariaLabel: "More commands" }}
      />
    </div>
  </React.Fragment>
);
}
