import * as ko from "knockout";
import Q from "q";
import * as Constants from "../../Common/Constants";
import * as ViewModels from "../../Contracts/ViewModels";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import { RouteHandler } from "../../RouteHandlers/RouteHandler";
import { WaitsForTemplateViewModel } from "../WaitsForTemplateViewModel";
import TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import ThemeUtility from "../../Common/ThemeUtility";
import DocumentClientUtilityBase from "../../Common/DocumentClientUtilityBase";

// TODO: Use specific actions for logging telemetry data
export default class TabsBase extends WaitsForTemplateViewModel implements ViewModels.Tab {
  public closeTabButton: ViewModels.Button;
  public documentClientUtility: DocumentClientUtilityBase;
  public node: ViewModels.TreeNode;
  public collection: ViewModels.CollectionBase;
  public database: ViewModels.Database;
  public rid: string;
  public hasFocus: ko.Observable<boolean>;
  public isActive: ko.Observable<boolean>;
  public isMouseOver: ko.Observable<boolean>;
  public tabId: string;
  public tabKind: ViewModels.CollectionTabKind;
  public tabTitle: ko.Observable<string>;
  public tabPath: ko.Observable<string>;
  public nextTab: ko.Observable<ViewModels.Tab>;
  public previousTab: ko.Observable<ViewModels.Tab>;
  public closeButtonTabIndex: ko.Computed<number>;
  public errorDetailsTabIndex: ko.Computed<number>;
  public hashLocation: ko.Observable<string>;
  public isExecutionError: ko.Observable<boolean>;
  public isExecuting: ko.Observable<boolean>;

  protected _theme: string;
  public onLoadStartKey: number;

  constructor(options: ViewModels.TabOptions) {
    super();
    const id = new Date().getTime().toString();

    this._theme = ThemeUtility.getMonacoTheme(options.theme);
    this.documentClientUtility = options.documentClientUtility;
    this.node = options.node;
    this.collection = options.collection;
    this.database = options.database;
    this.rid = options.rid || (this.collection && this.collection.rid) || "";
    this.hasFocus = ko.observable<boolean>(false);
    this.isActive = options.isActive || ko.observable<boolean>(false);
    this.isMouseOver = ko.observable<boolean>(false);
    this.tabId = `tab${id}`;
    this.tabKind = options.tabKind;
    this.tabTitle = ko.observable<string>(options.title);
    this.tabPath =
      (options.tabPath && ko.observable<string>(options.tabPath)) ||
      (this.collection &&
        ko.observable<string>(`${this.collection.databaseId}>${this.collection.id()}>${this.tabTitle()}`));
    this.nextTab = ko.observable<ViewModels.Tab>();
    this.previousTab = ko.observable<ViewModels.Tab>();
    this.closeButtonTabIndex = ko.computed<number>(() => (this.isActive() ? 0 : null));
    this.errorDetailsTabIndex = ko.computed<number>(() => (this.isActive() ? 0 : null));
    this.isExecutionError = ko.observable<boolean>(false);
    this.isExecuting = ko.observable<boolean>(false);
    this.onLoadStartKey = options.onLoadStartKey;
    this.hashLocation = ko.observable<string>(options.hashLocation || "");
    this.hashLocation.subscribe((newLocation: string) => this.updateGlobalHash(newLocation));

    this.isActive.subscribe((isActive: boolean) => {
      if (isActive) {
        this.onActivate();
      }
    });

    this.closeTabButton = {
      enabled: ko.computed<boolean>(() => {
        return true;
      }),

      visible: ko.computed<boolean>(() => {
        return true;
      }),
    };

    const openedTabs = options.openedTabs;
    if (openedTabs && openedTabs.length && openedTabs.length > 0) {
      const lastTab = openedTabs[openedTabs.length - 1];
      lastTab && lastTab.nextTab(this);
      this.previousTab(lastTab);
    }
  }

  public onCloseTabButtonClick(): Q.Promise<any> {
    const previousTab = this.previousTab();
    const nextTab = this.nextTab();

    previousTab && previousTab.nextTab(nextTab);
    nextTab && nextTab.previousTab(previousTab);

    this.getContainer().openedTabs.remove((tab) => tab.tabId === this.tabId);

    const tabToActivate = nextTab || previousTab;

    if (!tabToActivate) {
      this.getContainer().selectedNode(null);
      this.getContainer().onUpdateTabsButtons([]);
      this.getContainer().activeTab(null);
    } else {
      tabToActivate.isActive(true);
      this.getContainer().activeTab(tabToActivate);
    }

    TelemetryProcessor.trace(Action.Tab, ActionModifiers.Close, {
      databaseAccountName: this.getContainer().databaseAccount().name,
      defaultExperience: this.getContainer().defaultExperience(),
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: this.tabTitle(),
    });
    return Q();
  }

  public onTabClick(): Q.Promise<any> {
    for (let i = 0; i < this.getContainer().openedTabs().length; i++) {
      const tab = this.getContainer().openedTabs()[i];
      tab.isActive(false);
    }
    this.isActive(true);
    this.getContainer().activeTab(this);
    return Q();
  }

  protected updateSelectedNode(): void {
    const relatedDatabase = (this.collection && this.collection.getDatabase()) || this.database;
    if (relatedDatabase && !relatedDatabase.isDatabaseExpanded()) {
      this.getContainer().selectedNode(relatedDatabase);
    } else if (this.collection && !this.collection.isCollectionExpanded()) {
      this.getContainer().selectedNode(this.collection);
    } else {
      this.getContainer().selectedNode(this.node);
    }
  }

  private onSpaceOrEnterKeyPress(event: KeyboardEvent, callback: () => void): boolean {
    if (event.keyCode === Constants.KeyCodes.Space || event.keyCode === Constants.KeyCodes.Enter) {
      callback();
      event.stopPropagation();
      return false;
    }

    return true;
  }

  public onKeyPressActivate = (source: any, event: KeyboardEvent): boolean => {
    return this.onSpaceOrEnterKeyPress(event, () => this.onTabClick());
  };

  public onKeyPressClose = (source: any, event: KeyboardEvent): boolean => {
    return this.onSpaceOrEnterKeyPress(event, () => this.onCloseTabButtonClick());
  };

  public onActivate(): Q.Promise<any> {
    this.updateSelectedNode();
    if (!!this.collection) {
      this.collection.selectedSubnodeKind(this.tabKind);
    }

    if (!!this.database) {
      this.database.selectedSubnodeKind(this.tabKind);
    }

    this.hasFocus(true);
    this.updateGlobalHash(this.hashLocation());

    this.updateNavbarWithTabsButtons();

    TelemetryProcessor.trace(Action.Tab, ActionModifiers.Open, {
      databaseAccountName: this.getContainer().databaseAccount().name,
      defaultExperience: this.getContainer().defaultExperience(),
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: this.tabTitle(),
    });
    return Q();
  }

  public onErrorDetailsClick = (src: any, event: MouseEvent): boolean => {
    if (this.collection && this.collection.container) {
      this.collection.container.expandConsole();
    }

    if (this.database && this.database.container) {
      this.database.container.expandConsole();
    }
    return false;
  };

  public onErrorDetailsKeyPress = (src: any, event: KeyboardEvent): boolean => {
    if (event.keyCode === Constants.KeyCodes.Space || event.keyCode === Constants.KeyCodes.Enter) {
      this.onErrorDetailsClick(src, null);
      return false;
    }

    return true;
  };

  public refresh(): Q.Promise<any> {
    location.reload();
    return Q();
  }

  protected getContainer(): ViewModels.Explorer {
    return (this.collection && this.collection.container) || (this.database && this.database.container);
  }

  /** Renders a Javascript object to be displayed inside Monaco Editor */
  protected renderObjectForEditor(value: any, replacer: any, space: string | number): string {
    return JSON.stringify(value, replacer, space);
  }

  private updateGlobalHash(newHash: string): void {
    RouteHandler.getInstance().updateRouteHashLocation(newHash);
  }

  /**
   * @return buttons that are displayed in the navbar
   */
  protected getTabsButtons(): ViewModels.NavbarButtonConfig[] {
    return [];
  }

  protected updateNavbarWithTabsButtons = (): void => {
    if (this.isActive()) {
      this.getContainer().onUpdateTabsButtons(this.getTabsButtons());
    }
  };
}

interface EditorPosition {
  line: number;
  column: number;
}
