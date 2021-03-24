import * as ko from "knockout";
import Q from "q";
import * as Constants from "../../Common/Constants";
import * as ViewModels from "../../Contracts/ViewModels";
import * as DataModels from "../../Contracts/DataModels";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import { RouteHandler } from "../../RouteHandlers/RouteHandler";
import { WaitsForTemplateViewModel } from "../WaitsForTemplateViewModel";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import * as ThemeUtility from "../../Common/ThemeUtility";
import Explorer from "../Explorer";
import { CommandButtonComponentProps } from "../Controls/CommandButton/CommandButtonComponent";

// TODO: Use specific actions for logging telemetry data
export default class TabsBase extends WaitsForTemplateViewModel {
  public static readonly component = { name: "tab", template: "" };
  public closeTabButton: ViewModels.Button;
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
  public closeButtonTabIndex: ko.Computed<number>;
  public errorDetailsTabIndex: ko.Computed<number>;
  public hashLocation: ko.Observable<string>;
  public isExecutionError: ko.Observable<boolean>;
  public isExecuting: ko.Observable<boolean>;
  public pendingNotification?: ko.Observable<DataModels.Notification>;

  protected _theme: string;
  public onLoadStartKey: number;

  constructor(options: ViewModels.TabOptions) {
    super();
    const id = new Date().getTime().toString();

    this._theme = ThemeUtility.getMonacoTheme(options.theme);
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
    this.closeButtonTabIndex = ko.computed<number>(() => (this.isActive() ? 0 : null));
    this.errorDetailsTabIndex = ko.computed<number>(() => (this.isActive() ? 0 : null));
    this.isExecutionError = ko.observable<boolean>(false);
    this.isExecuting = ko.observable<boolean>(false);
    this.pendingNotification = ko.observable<DataModels.Notification>(undefined);
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
  }

  public onCloseTabButtonClick(): void {
    const explorer = this.getContainer();
    explorer.tabsManager.closeTab(this.tabId, explorer);

    TelemetryProcessor.trace(Action.Tab, ActionModifiers.Close, {
      tabName: this.constructor.name,

      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: this.tabTitle(),
      tabId: this.tabId,
    });
  }

  public onTabClick(): void {
    this.getContainer().tabsManager.activateTab(this);
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

  public onActivate(): void {
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
      tabName: this.constructor.name,

      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: this.tabTitle(),
      tabId: this.tabId,
    });
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

  public getContainer(): Explorer {
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
  protected getTabsButtons(): CommandButtonComponentProps[] {
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
