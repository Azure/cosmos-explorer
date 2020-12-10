import * as ko from "knockout";

import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import { DirectoryListProps } from "../Controls/Directory/DirectoryListComponent";
import { DefaultDirectoryDropdownProps } from "../Controls/Directory/DefaultDirectoryDropdownComponent";
import { DirectoryComponentAdapter } from "../Controls/Directory/DirectoryComponentAdapter";
import SwitchDirectoryPaneTemplate from "./SwitchDirectoryPane.html";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";

class PaneComponent {
  constructor(data: any) {
    return data.data;
  }
}

export class SwitchDirectoryPaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: SwitchDirectoryPaneTemplate,
    };
  }
}

export class SwitchDirectoryPane {
  public id: string;
  public firstFieldHasFocus: ko.Observable<boolean>;
  public title: ko.Observable<string>;
  public visible: ko.Observable<boolean>;

  public directoryComponentAdapter: DirectoryComponentAdapter;

  constructor(
    dropdownProps: ko.Observable<DefaultDirectoryDropdownProps>,
    listProps: ko.Observable<DirectoryListProps>
  ) {
    this.id = "switchdirectorypane";
    this.title = ko.observable("Switch directory");
    this.visible = ko.observable(false);
    this.firstFieldHasFocus = ko.observable(false);
    this.resetData();
    this.directoryComponentAdapter = new DirectoryComponentAdapter(dropdownProps, listProps);
  }

  public open() {
    this.visible(true);
    this.firstFieldHasFocus(true);
    this.resizePane();
    TelemetryProcessor.trace(Action.ContextualPane, ActionModifiers.Open, {
      paneTitle: this.title(),
    });

    this.directoryComponentAdapter.forceRender();
  }

  public close() {
    this.visible(false);
    this.resetData();
    this.directoryComponentAdapter.forceRender();
  }

  public resetData() {
    this.firstFieldHasFocus(false);
  }

  public onCloseKeyPress(source: any, event: KeyboardEvent): void {
    if (event.key === " " || event.key === "Enter") {
      this.close();
    }
  }

  public onPaneKeyDown(source: any, event: KeyboardEvent): boolean {
    if (event.key === "Escape") {
      this.close();
      return false;
    }

    return true;
  }

  private resizePane(): void {
    const paneElement: HTMLElement = document.getElementById(this.id);
    const headerElement: HTMLElement = document.getElementsByTagName("header")[0];
    const newPaneElementHeight = window.innerHeight - headerElement.offsetHeight;

    paneElement.style.height = `${newPaneElementHeight}px`;
  }
}
