import * as Constants from "../../Common/Constants";
import * as ko from "knockout";
import * as ViewModels from "../../Contracts/ViewModels";
import { ConsoleDataType } from "../Menus/NotificationConsole/NotificationConsoleComponent";
import { ContextualPaneBase } from "./ContextualPaneBase";
import { LocalStorageUtility, StorageKey } from "../../Shared/StorageUtility";
import * as NotificationConsoleUtils from "../../Utils/NotificationConsoleUtils";
import * as StringUtility from "../../Shared/StringUtility";
import { configContext } from "../../ConfigContext";

export class SettingsPane extends ContextualPaneBase {
  public pageOption: ko.Observable<string>;
  public customItemPerPage: ko.Observable<number>;
  public crossPartitionQueryEnabled: ko.Observable<boolean>;
  public maxDegreeOfParallelism: ko.Observable<number>;
  public explorerVersion: string;
  public shouldShowQueryPageOptions: ko.Computed<boolean>;
  public shouldShowGraphAutoVizOption: ko.Computed<boolean>;

  private graphAutoVizDisabled: ko.Observable<string>;
  private shouldShowCrossPartitionOption: ko.Computed<boolean>;
  private shouldShowParallelismOption: ko.Computed<boolean>;

  constructor(options: ViewModels.PaneOptions) {
    super(options);
    this.title("Settings");
    this.resetData();

    this.pageOption = ko.observable<string>();
    this.customItemPerPage = ko.observable<number>();

    const crossPartitionQueryEnabledState: boolean = LocalStorageUtility.hasItem(
      StorageKey.IsCrossPartitionQueryEnabled
    )
      ? LocalStorageUtility.getEntryString(StorageKey.IsCrossPartitionQueryEnabled) === "true"
      : true;
    this.crossPartitionQueryEnabled = ko.observable<boolean>(crossPartitionQueryEnabledState);

    const maxDegreeOfParallelismState: number = LocalStorageUtility.hasItem(StorageKey.MaxDegreeOfParellism)
      ? LocalStorageUtility.getEntryNumber(StorageKey.MaxDegreeOfParellism)
      : Constants.Queries.DefaultMaxDegreeOfParallelism;
    this.maxDegreeOfParallelism = ko.observable<number>(maxDegreeOfParallelismState);

    const isGraphAutoVizDisabled: boolean = LocalStorageUtility.hasItem(StorageKey.IsGraphAutoVizDisabled)
      ? LocalStorageUtility.getEntryBoolean(StorageKey.IsGraphAutoVizDisabled)
      : false;
    this.graphAutoVizDisabled = ko.observable<string>(`${isGraphAutoVizDisabled}`);

    this.explorerVersion = configContext.gitSha;
    this.shouldShowQueryPageOptions = ko.computed<boolean>(() => this.container.isPreferredApiDocumentDB());
    this.shouldShowCrossPartitionOption = ko.computed<boolean>(() => !this.container.isPreferredApiGraph());
    this.shouldShowParallelismOption = ko.computed<boolean>(() => !this.container.isPreferredApiGraph());
    this.shouldShowGraphAutoVizOption = ko.computed<boolean>(() => this.container.isPreferredApiGraph());
  }

  public open() {
    this._loadSettings();
    super.open();
    const pageOptionsFocus = document.getElementById("custom-selection");
    const displayQueryFocus = document.getElementById("graph-display");
    const maxDegreeFocus = document.getElementById("max-degree");
    if (this.container.isPreferredApiGraph()) {
      displayQueryFocus && displayQueryFocus.focus();
    } else if (this.container.isPreferredApiTable()) {
      maxDegreeFocus && maxDegreeFocus.focus();
    }
    pageOptionsFocus && pageOptionsFocus.focus();
  }

  public submit() {
    this.formErrors("");
    this.isExecuting(true);

    LocalStorageUtility.setEntryNumber(
      StorageKey.ActualItemPerPage,
      this.isCustomPageOptionSelected() ? this.customItemPerPage() : Constants.Queries.unlimitedItemsPerPage
    );
    LocalStorageUtility.setEntryNumber(StorageKey.CustomItemPerPage, this.customItemPerPage());
    LocalStorageUtility.setEntryString(
      StorageKey.IsCrossPartitionQueryEnabled,
      this.crossPartitionQueryEnabled().toString()
    );
    LocalStorageUtility.setEntryNumber(StorageKey.MaxDegreeOfParellism, this.maxDegreeOfParallelism());

    if (this.shouldShowGraphAutoVizOption()) {
      LocalStorageUtility.setEntryBoolean(
        StorageKey.IsGraphAutoVizDisabled,
        StringUtility.toBoolean(this.graphAutoVizDisabled())
      );
    }

    this.isExecuting(false);
    NotificationConsoleUtils.logConsoleMessage(
      ConsoleDataType.Info,
      `Updated items per page setting to ${LocalStorageUtility.getEntryNumber(StorageKey.ActualItemPerPage)}`
    );
    NotificationConsoleUtils.logConsoleMessage(
      ConsoleDataType.Info,
      `${this.crossPartitionQueryEnabled() ? "Enabled" : "Disabled"} cross-partition query feed option`
    );
    NotificationConsoleUtils.logConsoleMessage(
      ConsoleDataType.Info,
      `Updated the max degree of parallelism query feed option to ${LocalStorageUtility.getEntryNumber(
        StorageKey.MaxDegreeOfParellism
      )}`
    );

    if (this.shouldShowGraphAutoVizOption()) {
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Info,
        `Graph result will be displayed as ${
          LocalStorageUtility.getEntryBoolean(StorageKey.IsGraphAutoVizDisabled) ? "JSON" : "Graph"
        }`
      );
    }

    NotificationConsoleUtils.logConsoleMessage(
      ConsoleDataType.Info,
      `Updated query setting to ${LocalStorageUtility.getEntryString(StorageKey.SetPartitionKeyUndefined)}`
    );

    this.close();
  }

  public isCustomPageOptionSelected = (): boolean => {
    return this.pageOption() === Constants.Queries.CustomPageOption;
  };

  public isUnlimitedPageOptionSelected = (): boolean => {
    return this.pageOption() === Constants.Queries.UnlimitedPageOption;
  };

  public onUnlimitedPageOptionKeyDown(source: any, event: KeyboardEvent): boolean {
    if (event.keyCode === Constants.KeyCodes.Enter || event.keyCode === Constants.KeyCodes.Space) {
      this.pageOption(Constants.Queries.UnlimitedPageOption);
      event.stopPropagation();
      return false;
    }
    return true;
  }

  public onCustomPageOptionsKeyDown(source: any, event: KeyboardEvent): boolean {
    if (event.keyCode === Constants.KeyCodes.Enter || event.keyCode === Constants.KeyCodes.Space) {
      this.pageOption(Constants.Queries.CustomPageOption);
      event.stopPropagation();
      return false;
    }
    return true;
  }

  public onJsonDisplayResultsKeyDown(source: any, event: KeyboardEvent): boolean {
    if (event.keyCode === Constants.KeyCodes.Enter || event.keyCode === Constants.KeyCodes.Space) {
      this.graphAutoVizDisabled("true");
      event.stopPropagation();
      return false;
    }
    return true;
  }

  public onGraphDisplayResultsKeyDown(source: any, event: KeyboardEvent): boolean {
    if (event.keyCode === Constants.KeyCodes.Enter || event.keyCode === Constants.KeyCodes.Space) {
      this.graphAutoVizDisabled("false");
      event.stopPropagation();
      return false;
    }
    return true;
  }

  private _loadSettings() {
    this.isExecuting(true);
    try {
      this.pageOption(
        LocalStorageUtility.getEntryNumber(StorageKey.ActualItemPerPage) == Constants.Queries.unlimitedItemsPerPage
          ? Constants.Queries.UnlimitedPageOption
          : Constants.Queries.CustomPageOption
      );
      this.customItemPerPage(LocalStorageUtility.getEntryNumber(StorageKey.CustomItemPerPage));
    } catch (exception) {
      this.formErrors("Unable to load your settings");
      this.formErrorsDetails(exception);
    } finally {
      this.isExecuting(false);
    }
  }
}
