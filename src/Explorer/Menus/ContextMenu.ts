import * as ko from "knockout";
import * as ViewModels from "../../Contracts/ViewModels";
import { CommandButtonOptions } from "./../Controls/CommandButton/CommandButton";

export default class ContextMenu implements ViewModels.ContextMenu {
  public container: ViewModels.Explorer;
  public visible: ko.Observable<boolean>;
  public elementId: string;
  public options: ko.ObservableArray<CommandButtonOptions>;
  public tabIndex: ko.Observable<number>;

  constructor(container: ViewModels.Explorer, rid: string) {
    this.container = container;
    this.visible = ko.observable<boolean>(false);
    this.elementId = `contextMenu${rid}`;
    this.options = ko.observableArray<CommandButtonOptions>([]);
    this.tabIndex = ko.observable<number>(0);
  }

  public show(source: ViewModels.TreeNode, event: MouseEvent) {
    if (source && source.contextMenu && source.contextMenu.visible && source.contextMenu.visible()) {
      return;
    }

    this.container.selectedNode(source);
    const elementId = source.contextMenu.elementId;
    const htmlElement = document.getElementById(elementId);
    htmlElement.style.left = `${event.clientX}px`;
    htmlElement.style.top = `${event.clientY}px`;

    !!source.contextMenu && source.contextMenu.visible(true);
    source.contextMenu.tabIndex(0);
    htmlElement.focus();
  }

  public hide(source: ViewModels.TreeNode, event: MouseEvent) {
    if (!source || !source.contextMenu || !source.contextMenu.visible || !source.contextMenu.visible()) {
      return;
    }
    source.contextMenu.tabIndex(-1);
    source.contextMenu.visible(false);
  }
}
