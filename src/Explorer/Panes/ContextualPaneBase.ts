import * as ko from "knockout";

import * as ViewModels from "../../Contracts/ViewModels";
import * as Constants from "../../Common/Constants";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import { KeyCodes } from "../../Common/Constants";
import { WaitsForTemplateViewModel } from "../WaitsForTemplateViewModel";
import TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import DocumentClientUtilityBase from "../../Common/DocumentClientUtilityBase";

// TODO: Use specific actions for logging telemetry data
export abstract class ContextualPaneBase extends WaitsForTemplateViewModel implements ViewModels.ContextualPane {
  public id: string;
  public container: ViewModels.Explorer;
  public firstFieldHasFocus: ko.Observable<boolean>;
  public formErrorsDetails: ko.Observable<string>;
  public formErrors: ko.Observable<string>;
  public title: ko.Observable<string>;
  public visible: ko.Observable<boolean>;
  public documentClientUtility: DocumentClientUtilityBase;
  public isExecuting: ko.Observable<boolean>;

  constructor(options: ViewModels.PaneOptions) {
    super();
    this.id = options.id;
    this.container = options.container;
    this.documentClientUtility = options.documentClientUtility;
    this.visible = options.visible || ko.observable(false);
    this.firstFieldHasFocus = ko.observable<boolean>(false);
    this.formErrors = ko.observable<string>();
    this.title = ko.observable<string>();
    this.formErrorsDetails = ko.observable<string>();
    this.isExecuting = ko.observable<boolean>(false);
    this.container.isNotificationConsoleExpanded.subscribe((isExpanded: boolean) => {
      this.resizePane();
    });
    this.container.isNotificationConsoleExpanded.extend({ rateLimit: 10 });
  }

  public cancel() {
    this.close();
    this.container.isAccountReady() &&
      TelemetryProcessor.trace(Action.ContextualPane, ActionModifiers.Close, {
        databaseAccountName: this.container.databaseAccount().name,
        defaultExperience: this.container.defaultExperience(),
        dataExplorerArea: Constants.Areas.ContextualPane,
        paneTitle: this.title()
      });
  }

  public close() {
    this.visible(false);
    this.isExecuting(false);
    this.resetData();
  }

  public open() {
    this.visible(true);
    this.firstFieldHasFocus(true);
    this.resizePane();
    this.container.isAccountReady() &&
      TelemetryProcessor.trace(Action.ContextualPane, ActionModifiers.Open, {
        databaseAccountName: this.container.databaseAccount().name,
        defaultExperience: this.container.defaultExperience(),
        dataExplorerArea: Constants.Areas.ContextualPane,
        paneTitle: this.title()
      });
  }

  public resetData() {
    this.firstFieldHasFocus(false);
    this.formErrors(null);
    this.formErrorsDetails(null);
  }

  public showErrorDetails() {
    this.container.expandConsole();
  }

  public submit() {
    this.close();
    event.stopPropagation();
    this.container.isAccountReady() &&
      TelemetryProcessor.trace(Action.ContextualPane, ActionModifiers.Submit, {
        databaseAccountName: this.container.databaseAccount().name,
        defaultExperience: this.container.defaultExperience(),
        dataExplorerArea: Constants.Areas.ContextualPane,
        paneTitle: this.title()
      });
  }

  public onCloseKeyPress(source: any, event: KeyboardEvent): boolean {
    if (event.keyCode === KeyCodes.Enter || event.keyCode === KeyCodes.Space) {
      this.close();
      event.stopPropagation();
      return false;
    }

    return true;
  }

  public onPaneKeyDown(source: any, event: KeyboardEvent): boolean {
    if (event.keyCode === KeyCodes.Escape) {
      this.close();
      event.stopPropagation();
      return false;
    }

    return true;
  }

  public onSubmitKeyPress(source: any, event: KeyboardEvent): boolean {
    if (event.keyCode === KeyCodes.Enter || event.keyCode === KeyCodes.Space) {
      this.submit();
      event.stopPropagation();
      return false;
    }

    return true;
  }

  private resizePane(): void {
    const paneElement: HTMLElement = document.getElementById(this.id);
    const notificationConsoleElement: HTMLElement = document.getElementById("explorerNotificationConsole");
    const newPaneElementHeight = window.innerHeight - $(notificationConsoleElement).height();

    $(paneElement).height(newPaneElementHeight);
  }
}
