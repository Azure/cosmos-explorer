import * as ko from "knockout";
import * as React from "react";
import { ReactAdapter } from "../../../Bindings/ReactBindingHandler";
import * as ViewModels from "../../../Contracts/ViewModels";
import { NotificationConsoleComponent } from "./NotificationConsoleComponent";
import { ConsoleData } from "./NotificationConsoleComponent";
import Explorer from "../../Explorer";

export class NotificationConsoleComponentAdapter implements ReactAdapter {
  public parameters: ko.Observable<number>;
  public container: Explorer;
  private consoleData: ko.ObservableArray<ConsoleData>;

  constructor(container: Explorer) {
    this.container = container;

    this.consoleData = container.notificationConsoleData;
    this.consoleData.subscribe((newValue: ConsoleData[]) => this.triggerRender());
    container.isNotificationConsoleExpanded.subscribe(() => this.triggerRender());
    this.parameters = ko.observable(Date.now());
  }

  private onConsoleExpandedChange(isExpanded: boolean): void {
    isExpanded ? this.container.expandConsole() : this.container.collapseConsole();
    this.triggerRender();
  }

  private onConsoleDataChange(consoleData: ConsoleData[]): void {
    this.consoleData(consoleData);
    this.triggerRender();
  }

  public renderComponent(): JSX.Element {
    return (
      <NotificationConsoleComponent
        isConsoleExpanded={this.container.isNotificationConsoleExpanded()}
        onConsoleExpandedChange={this.onConsoleExpandedChange.bind(this)}
        consoleData={this.consoleData()}
        onConsoleDataChange={this.onConsoleDataChange.bind(this)}
      />
    );
  }

  private triggerRender() {
    window.requestAnimationFrame(() => this.parameters(Date.now()));
  }
}
