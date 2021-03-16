import * as ViewModels from "../../Contracts/ViewModels";
import * as DataModels from "../../Contracts/DataModels";
import TabsBase from "./TabsBase";
import { SettingsComponentAdapter } from "../Controls/Settings/SettingsComponentAdapter";
import { SettingsComponentProps } from "../Controls/Settings/SettingsComponent";
import { traceFailure } from "../../Shared/Telemetry/TelemetryProcessor";
import ko from "knockout";
import * as Constants from "../../Common/Constants";
import { Action } from "../../Shared/Telemetry/TelemetryConstants";
import { logConsoleError } from "../../Utils/NotificationConsoleUtils";
import { getErrorMessage, getErrorStack } from "../../Common/ErrorHandlingUtils";
import template from "./SettingsTabV2.html";

export class SettingsTabV2 extends TabsBase {
  public static readonly component = { name: "collection-settings-tab-v2", template };
  public settingsComponentAdapter: SettingsComponentAdapter;

  constructor(options: ViewModels.TabOptions) {
    super(options);
    const props: SettingsComponentProps = {
      settingsTab: this,
    };
    this.settingsComponentAdapter = new SettingsComponentAdapter(props);
  }
}

export class CollectionSettingsTabV2 extends SettingsTabV2 {
  private notificationRead: ko.Observable<boolean>;
  private notification: DataModels.Notification;
  private offerRead: ko.Observable<boolean>;

  constructor(options: ViewModels.TabOptions) {
    super(options);

    this.tabId = "SettingsV2-" + this.tabId;
    this.notificationRead = ko.observable(false);
    this.offerRead = ko.observable(false);
    this.settingsComponentAdapter.parameters = ko.computed<boolean>(() => {
      if (this.notificationRead() && this.offerRead()) {
        this.pendingNotification(this.notification);
        this.notification = undefined;
        this.offerRead(false);
        this.notificationRead(false);
        return true;
      }
      return false;
    });
  }

  public async onActivate(): Promise<void> {
    try {
      this.isExecuting(true);

      const collection: ViewModels.Collection = this.collection as ViewModels.Collection;
      await collection.loadOffer();
      // passed in options and set by parent as "Settings" by default
      this.tabTitle(collection.offer() ? "Settings" : "Scale & Settings");

      const data: DataModels.Notification = await collection.getPendingThroughputSplitNotification();
      this.notification = data;
      this.notificationRead(true);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.notification = undefined;
      this.notificationRead(true);
      traceFailure(
        Action.Tab,
        {
          databaseName: this.collection.databaseId,
          collectionName: this.collection.id(),

          dataExplorerArea: Constants.Areas.Tab,
          tabTitle: this.tabTitle,
          error: errorMessage,
          errorStack: getErrorStack(error),
        },
        this.onLoadStartKey
      );
      logConsoleError(`Error while fetching container settings for container ${this.collection.id()}: ${errorMessage}`);
      throw error;
    } finally {
      this.offerRead(true);
      this.isExecuting(false);
    }

    super.onActivate();
    this.collection.selectedSubnodeKind(ViewModels.CollectionTabKind.CollectionSettingsV2);
  }
}

export class DatabaseSettingsTabV2 extends SettingsTabV2 {
  public static readonly component = { name: "database-settings-tab-v2", template };
  private notificationRead: ko.Observable<boolean>;
  private notification: DataModels.Notification;

  constructor(options: ViewModels.TabOptions) {
    super(options);
    this.tabId = "DatabaseSettingsV2-" + this.tabId;
    this.notificationRead = ko.observable(false);
    this.settingsComponentAdapter.parameters = ko.computed<boolean>(() => {
      if (this.notificationRead()) {
        this.pendingNotification(this.notification);
        this.notification = undefined;
        this.notificationRead(false);
        return true;
      }
      return false;
    });
  }

  public async onActivate(): Promise<void> {
    try {
      this.isExecuting(true);

      const data: DataModels.Notification = await this.database.getPendingThroughputSplitNotification();
      this.notification = data;
      this.notificationRead(true);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.notification = undefined;
      this.notificationRead(true);
      traceFailure(
        Action.Tab,
        {
          databaseName: this.database.id(),
          dataExplorerArea: Constants.Areas.Tab,
          tabTitle: this.tabTitle,
          error: errorMessage,
          errorStack: getErrorStack(error),
        },
        this.onLoadStartKey
      );
      logConsoleError(`Error while fetching database settings for database ${this.database.id()}: ${errorMessage}`);
      throw error;
    } finally {
      this.isExecuting(false);
    }

    super.onActivate();
    this.database.selectedSubnodeKind(ViewModels.CollectionTabKind.DatabaseSettingsV2);
  }
}
