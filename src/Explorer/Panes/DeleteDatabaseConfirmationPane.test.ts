jest.mock("../../Common/dataAccess/deleteDatabase");
jest.mock("../../Shared/Telemetry/TelemetryProcessor");
import * as ko from "knockout";
import Q from "q";
import { deleteDatabase } from "../../Common/dataAccess/deleteDatabase";
import DeleteFeedback from "../../Common/DeleteFeedback";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { TreeNode } from "../../Contracts/ViewModels";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import Explorer from "../Explorer";
import { TabsManager } from "../Tabs/TabsManager";
import DeleteDatabaseConfirmationPane from "./DeleteDatabaseConfirmationPane";

describe("Delete Database Confirmation Pane", () => {
  describe("Explorer.isLastDatabase() and Explorer.isLastNonEmptyDatabase()", () => {
    let explorer: Explorer;

    beforeAll(() => {
      (deleteDatabase as jest.Mock).mockResolvedValue(undefined);
    });

    beforeEach(() => {
      explorer = new Explorer();
    });

    it("should be true if only 1 database", () => {
      let database = {} as ViewModels.Database;
      explorer.databases = ko.observableArray<ViewModels.Database>([database]);
      expect(explorer.isLastDatabase()).toBe(true);
    });

    it("should be false if only 2 databases", () => {
      let database = {} as ViewModels.Database;
      let database2 = {} as ViewModels.Database;
      explorer.databases = ko.observableArray<ViewModels.Database>([database, database2]);
      expect(explorer.isLastDatabase()).toBe(false);
    });

    it("should be false if not last empty database", () => {
      let database = {} as ViewModels.Database;
      explorer.databases = ko.observableArray<ViewModels.Database>([database]);
      expect(explorer.isLastNonEmptyDatabase()).toBe(false);
    });

    it("should be true if last non empty database", () => {
      let database = {} as ViewModels.Database;
      database.collections = ko.observableArray<ViewModels.Collection>([{} as ViewModels.Collection]);
      explorer.databases = ko.observableArray<ViewModels.Database>([database]);
      expect(explorer.isLastNonEmptyDatabase()).toBe(true);
    });
  });

  describe("shouldRecordFeedback()", () => {
    it("should return true if last non empty database or is last database that has shared throughput, else false", () => {
      let fakeExplorer = {} as Explorer;

      let pane = new DeleteDatabaseConfirmationPane({
        id: "deletedatabaseconfirmationpane",
        visible: ko.observable<boolean>(false),
        container: fakeExplorer as any,
      });

      fakeExplorer.isLastNonEmptyDatabase = () => true;
      pane.container = fakeExplorer as any;
      expect(pane.shouldRecordFeedback()).toBe(true);

      fakeExplorer.isLastDatabase = () => true;
      fakeExplorer.isSelectedDatabaseShared = () => true;
      pane.container = fakeExplorer as any;
      expect(pane.shouldRecordFeedback()).toBe(true);

      fakeExplorer.isLastNonEmptyDatabase = () => false;
      fakeExplorer.isLastDatabase = () => true;
      fakeExplorer.isSelectedDatabaseShared = () => false;
      pane.container = fakeExplorer as any;
      expect(pane.shouldRecordFeedback()).toBe(false);
    });
  });

  describe("submit()", () => {
    it("on submit() it should log feedback if last non empty database or is last database that has shared throughput", () => {
      let selectedDatabaseId = "testDB";
      let fakeExplorer = {} as Explorer;
      fakeExplorer.findSelectedDatabase = () => {
        return {
          id: ko.observable<string>(selectedDatabaseId),
          rid: "test",
          collections: ko.observableArray<ViewModels.Collection>(),
        } as ViewModels.Database;
      };
      fakeExplorer.refreshAllDatabases = () => Q.resolve();
      fakeExplorer.selectedDatabaseId = ko.computed<string>(() => selectedDatabaseId);
      fakeExplorer.isSelectedDatabaseShared = () => false;
      const SubscriptionId = "testId";
      const AccountName = "testAccount";
      fakeExplorer.databaseAccount = ko.observable<DataModels.DatabaseAccount>({
        id: SubscriptionId,
        name: AccountName,
      } as DataModels.DatabaseAccount);
      fakeExplorer.defaultExperience = ko.observable<string>("DocumentDB");
      fakeExplorer.isPreferredApiCassandra = ko.computed(() => {
        return false;
      });
      fakeExplorer.selectedNode = ko.observable<TreeNode>();
      fakeExplorer.tabsManager = new TabsManager();
      fakeExplorer.isLastNonEmptyDatabase = () => true;

      let pane = new DeleteDatabaseConfirmationPane({
        id: "deletedatabaseconfirmationpane",
        visible: ko.observable<boolean>(false),
        container: fakeExplorer as any,
      });
      pane.databaseIdConfirmation = ko.observable<string>(selectedDatabaseId);
      const Feedback = "my feedback";
      pane.databaseDeleteFeedback(Feedback);

      return pane.submit().then(() => {
        let deleteFeedback = new DeleteFeedback(SubscriptionId, AccountName, DataModels.ApiKind.SQL, Feedback);
        expect(TelemetryProcessor.trace).toHaveBeenCalledWith(Action.DeleteDatabase, ActionModifiers.Mark, {
          message: JSON.stringify(deleteFeedback, Object.getOwnPropertyNames(deleteFeedback)),
        });
      });
    });
  });
});
