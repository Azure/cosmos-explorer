import * as ko from "knockout";
import * as sinon from "sinon";
import Q from "q";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import DeleteDatabaseConfirmationPane from "./DeleteDatabaseConfirmationPane";
import DeleteFeedback from "../../Common/DeleteFeedback";
import DocumentClientUtilityBase from "../../Common/DocumentClientUtilityBase";
import Explorer from "../Explorer";
import { CollectionStub, DatabaseStub, ExplorerStub } from "../OpenActionsStubs";
import TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { TreeNode } from "../../Contracts/ViewModels";
import { TabsManager } from "../Tabs/TabsManager";

describe("Delete Database Confirmation Pane", () => {
  describe("Explorer.isLastDatabase() and Explorer.isLastNonEmptyDatabase()", () => {
    let explorer: ViewModels.Explorer;

    beforeEach(() => {
      explorer = new Explorer({ documentClientUtility: null, notificationsClient: null, isEmulator: false });
    });

    it("should be true if only 1 database", () => {
      let database: ViewModels.Database = new DatabaseStub({});
      explorer.databases = ko.observableArray<ViewModels.Database>([database]);
      expect(explorer.isLastDatabase()).toBe(true);
    });

    it("should be false if only 2 databases", () => {
      let database: ViewModels.Database = new DatabaseStub({});
      let database2: ViewModels.Database = new DatabaseStub({});
      explorer.databases = ko.observableArray<ViewModels.Database>([database, database2]);
      expect(explorer.isLastDatabase()).toBe(false);
    });

    it("should be false if not last empty database", () => {
      let database: ViewModels.Database = new DatabaseStub({});
      explorer.databases = ko.observableArray<ViewModels.Database>([database]);
      expect(explorer.isLastNonEmptyDatabase()).toBe(false);
    });

    it("should be true if last non empty database", () => {
      let database: ViewModels.Database = new DatabaseStub({});
      database.collections = ko.observableArray<ViewModels.Collection>([new CollectionStub({})]);
      explorer.databases = ko.observableArray<ViewModels.Database>([database]);
      expect(explorer.isLastNonEmptyDatabase()).toBe(true);
    });
  });

  describe("shouldRecordFeedback()", () => {
    it("should return true if last non empty database or is last database that has shared throughput, else false", () => {
      let fakeDocumentClientUtility = sinon.createStubInstance<DocumentClientUtilityBase>(
        DocumentClientUtilityBase as any
      );
      let fakeExplorer = sinon.createStubInstance<ExplorerStub>(ExplorerStub as any);
      sinon.stub(fakeExplorer, "isNotificationConsoleExpanded").value(ko.observable<boolean>(false));

      let pane = new DeleteDatabaseConfirmationPane({
        documentClientUtility: fakeDocumentClientUtility as any,
        id: "deletedatabaseconfirmationpane",
        visible: ko.observable<boolean>(false),
        container: fakeExplorer as any
      });

      fakeExplorer.isLastNonEmptyDatabase.returns(true);
      pane.container = fakeExplorer as any;
      expect(pane.shouldRecordFeedback()).toBe(true);

      fakeExplorer.isLastDatabase.returns(true);
      fakeExplorer.isSelectedDatabaseShared.returns(true);
      pane.container = fakeExplorer as any;
      expect(pane.shouldRecordFeedback()).toBe(true);

      fakeExplorer.isLastNonEmptyDatabase.returns(false);
      fakeExplorer.isLastDatabase.returns(true);
      fakeExplorer.isSelectedDatabaseShared.returns(false);
      pane.container = fakeExplorer as any;
      expect(pane.shouldRecordFeedback()).toBe(false);
    });
  });

  describe("submit()", () => {
    let telemetryProcessorSpy: sinon.SinonSpy;

    beforeEach(() => {
      telemetryProcessorSpy = sinon.spy(TelemetryProcessor, "trace");
    });

    afterEach(() => {
      telemetryProcessorSpy.restore();
    });

    it("on submit() it should log feedback if last non empty database or is last database that has shared throughput", () => {
      let selectedDatabaseId = "testDB";
      let fakeDocumentClientUtility = sinon.createStubInstance<DocumentClientUtilityBase>(
        DocumentClientUtilityBase as any
      );
      fakeDocumentClientUtility.deleteDatabase.returns(Q.resolve(null));
      let fakeExplorer = sinon.createStubInstance<ExplorerStub>(ExplorerStub as any);
      fakeExplorer.findSelectedDatabase.returns(
        new DatabaseStub({
          id: ko.observable<string>(selectedDatabaseId),
          rid: "test",
          collections: ko.observableArray<ViewModels.Collection>()
        })
      );
      sinon.stub(fakeExplorer, "isNotificationConsoleExpanded").value(ko.observable<boolean>(false));
      sinon.stub(fakeExplorer, "selectedDatabaseId").value(ko.observable<string>(selectedDatabaseId));
      fakeExplorer.isSelectedDatabaseShared.returns(false);
      const SubscriptionId = "testId";
      const AccountName = "testAccount";
      sinon.stub(fakeExplorer, "databaseAccount").value(
        ko.observable<ViewModels.DatabaseAccount>({
          id: SubscriptionId,
          name: AccountName
        } as ViewModels.DatabaseAccount)
      );
      sinon.stub(fakeExplorer, "defaultExperience").value(ko.observable<string>("DocumentDB"));
      sinon.stub(fakeExplorer, "isPreferredApiCassandra").value(
        ko.computed(() => {
          return false;
        })
      );
      sinon.stub(fakeExplorer, "documentClientUtility").value(fakeDocumentClientUtility);
      sinon.stub(fakeExplorer, "selectedNode").value(ko.observable<TreeNode>());
      sinon.stub(fakeExplorer, "tabsManager").value(new TabsManager());
      fakeExplorer.isLastNonEmptyDatabase.returns(true);

      let pane = new DeleteDatabaseConfirmationPane({
        documentClientUtility: fakeDocumentClientUtility as any,
        id: "deletedatabaseconfirmationpane",
        visible: ko.observable<boolean>(false),
        container: fakeExplorer as any
      });
      pane.databaseIdConfirmation = ko.observable<string>(selectedDatabaseId);
      const Feedback = "my feedback";
      pane.databaseDeleteFeedback(Feedback);

      return pane.submit().then(() => {
        expect(telemetryProcessorSpy.called).toBe(true);
        let deleteFeedback = new DeleteFeedback(SubscriptionId, AccountName, DataModels.ApiKind.SQL, Feedback);
        expect(
          telemetryProcessorSpy.calledWith(
            Action.DeleteDatabase,
            ActionModifiers.Mark,
            JSON.stringify(deleteFeedback, Object.getOwnPropertyNames(deleteFeedback))
          )
        ).toBe(true);
      });
    });
  });
});
