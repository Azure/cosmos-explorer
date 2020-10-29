import * as ViewModels from "../../Contracts/ViewModels";
import * as DataModels from "../../Contracts/DataModels";
import TabsBase from "./TabsBase";
import { SettingsComponentAdapter } from "../Controls/Settings/SettingsComponentAdapter";
import { SettingsComponentProps } from "../Controls/Settings/SettingsComponent";
import Explorer from "../Explorer";
import { traceFailure } from "../../Shared/Telemetry/TelemetryProcessor";
import ko from "knockout";
import * as Constants from "../../Common/Constants";
import { Action } from "../../Shared/Telemetry/TelemetryConstants";
import { logConsoleError } from "../../Utils/NotificationConsoleUtils";

export default class SettingsTabV2 extends TabsBase {
  public settingsComponentAdapter: SettingsComponentAdapter;
  private notificationRead: ko.Observable<boolean>;
  private notification: DataModels.Notification;
  private offerRead: ko.Observable<boolean>;
  private currentCollection: ViewModels.Collection;
  private options: ViewModels.SettingsTabV2Options;

  constructor(options: ViewModels.SettingsTabV2Options) {
    super(options);
    this.options = options;
    this.tabId = "SettingsV2-" + this.tabId;
    const props: SettingsComponentProps = {
      settingsTab: this
    };
    this.settingsComponentAdapter = new SettingsComponentAdapter(props);
    this.currentCollection = this.collection as ViewModels.Collection;
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

  public onActivate(): Q.Promise<unknown> {
    this.isExecuting(true);
    this.currentCollection.loadOffer().then(
      () => {
        // passed in options and set by parent as "Settings" by default
        this.tabTitle("Scale & Settings");
        this.offerRead(true);
        this.options.getPendingNotification.then(
          (data: DataModels.Notification) => {
            this.notification = data;
            this.notificationRead(true);
            this.isExecuting(false);
          },
          error => {
            this.notification = undefined;
            this.notificationRead(true);
            this.isExecuting(false);
            traceFailure(
              Action.Tab,
              {
                databaseAccountName: this.options.collection.container.databaseAccount().name,
                databaseName: this.options.collection.databaseId,
                collectionName: this.options.collection.id(),
                defaultExperience: this.options.collection.container.defaultExperience(),
                dataExplorerArea: Constants.Areas.Tab,
                tabTitle: this.tabTitle,
                error: error
              },
              this.options.onLoadStartKey
            );
            logConsoleError(
              `Error while fetching container settings for container ${this.options.collection.id()}: ${JSON.stringify(
                error
              )}`
            );
            throw error;
          }
        );
      },
      () => {
        this.offerRead(true);
        this.isExecuting(false);
      }
    );

    return super.onActivate().then(() => {
      this.collection.selectedSubnodeKind(ViewModels.CollectionTabKind.SettingsV2);
    });
  }

  public getSettingsTabContainer(): Explorer {
    return this.getContainer();
  }
}
