import * as ko from "knockout";
import * as sinon from "sinon";
import Q from "q";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import DeleteCollectionConfirmationPane from "./DeleteCollectionConfirmationPane";
import DeleteFeedback from "../../Common/DeleteFeedback";
import DocumentClientUtilityBase from "../../Common/DocumentClientUtilityBase";
import Explorer from "../Explorer";
import TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { DatabaseStub } from "../OpenActionsStubs";
import { TreeNode } from "../../Contracts/ViewModels";

describe("Delete Collection Confirmation Pane", () => {
  describe("Explorer.isLastCollection()", () => {
    let explorer: Explorer;

    beforeEach(() => {
      explorer = new Explorer({ documentClientUtility: null, notificationsClient: null, isEmulator: false });
    });

    it("should be true if 1 database and 1 collection", () => {
      let database: ViewModels.Database = new DatabaseStub({});
      database.collections = ko.observableArray<ViewModels.Collection>([{} as ViewModels.Collection]);
      explorer.databases = ko.observableArray<ViewModels.Database>([database]);
      expect(explorer.isLastCollection()).toBe(true);
    });

    it("should be false if if 1 database and 2 collection", () => {
      let database: ViewModels.Database = new DatabaseStub({});
      database.collections = ko.observableArray<ViewModels.Collection>([
        {} as ViewModels.Collection,
        {} as ViewModels.Collection
      ]);
      explorer.databases = ko.observableArray<ViewModels.Database>([database]);
      expect(explorer.isLastCollection()).toBe(false);
    });

    it("should be false if 2 database and 1 collection each", () => {
      let database: ViewModels.Database = new DatabaseStub({});
      database.collections = ko.observableArray<ViewModels.Collection>([{} as ViewModels.Collection]);
      let database2: ViewModels.Database = new DatabaseStub({});
      database2.collections = ko.observableArray<ViewModels.Collection>([{} as ViewModels.Collection]);
      explorer.databases = ko.observableArray<ViewModels.Database>([database, database2]);
      expect(explorer.isLastCollection()).toBe(false);
    });

    it("should be false if 0 databases", () => {
      let database: ViewModels.Database = new DatabaseStub({});
      explorer.databases = ko.observableArray<ViewModels.Database>();
      database.collections = ko.observableArray<ViewModels.Collection>();
      expect(explorer.isLastCollection()).toBe(false);
    });
  });

  describe("shouldRecordFeedback()", () => {
    it("should return true if last collection and database does not have shared throughput else false", () => {
      let fakeDocumentClientUtility = sinon.createStubInstance<DocumentClientUtilityBase>(
        DocumentClientUtilityBase as any
      );
      let fakeExplorer = new Explorer({ documentClientUtility: null, notificationsClient: null, isEmulator: false });
      fakeExplorer.isNotificationConsoleExpanded = ko.observable<boolean>(false);
      fakeExplorer.refreshAllDatabases = () => Q.resolve();

      let pane = new DeleteCollectionConfirmationPane({
        documentClientUtility: fakeDocumentClientUtility as any,
        id: "deletecollectionconfirmationpane",
        visible: ko.observable<boolean>(false),
        container: fakeExplorer
      });

      fakeExplorer.isLastCollection = () => true;
      fakeExplorer.isSelectedDatabaseShared = () => false;
      expect(pane.shouldRecordFeedback()).toBe(true);

      fakeExplorer.isLastCollection = () => true;
      fakeExplorer.isSelectedDatabaseShared = () => true;
      expect(pane.shouldRecordFeedback()).toBe(false);

      fakeExplorer.isLastCollection = () => false;
      fakeExplorer.isSelectedDatabaseShared = () => false;
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

    it("it should log feedback if last collection and database is not shared", () => {
      let selectedCollectionId = "testCol";
      let fakeDocumentClientUtility = {} as DocumentClientUtilityBase;
      fakeDocumentClientUtility.deleteCollection = () => Q(null);
      let fakeExplorer = {} as Explorer;
      fakeExplorer.findSelectedCollection = () => {
        return {
          id: ko.observable<string>(selectedCollectionId),
          rid: "test"
        } as ViewModels.Collection;
      };
      fakeExplorer.isNotificationConsoleExpanded = ko.observable<boolean>(false);
      fakeExplorer.selectedCollectionId = ko.computed<string>(() => selectedCollectionId);
      fakeExplorer.isSelectedDatabaseShared = () => false;
      const SubscriptionId = "testId";
      const AccountName = "testAccount";
      fakeExplorer.databaseAccount = ko.observable<ViewModels.DatabaseAccount>({
        id: SubscriptionId,
        name: AccountName
      } as ViewModels.DatabaseAccount);

      fakeExplorer.defaultExperience = ko.observable<string>("DocumentDB");
      fakeExplorer.isPreferredApiCassandra = ko.computed(() => {
        return false;
      });

      fakeExplorer.documentClientUtility = fakeDocumentClientUtility;
      fakeExplorer.selectedNode = ko.observable<TreeNode>();
      fakeExplorer.isLastCollection = () => true;
      fakeExplorer.isSelectedDatabaseShared = () => false;
      fakeExplorer.refreshAllDatabases = () => Q.resolve();

      let pane = new DeleteCollectionConfirmationPane({
        documentClientUtility: fakeDocumentClientUtility as any,
        id: "deletecollectionconfirmationpane",
        visible: ko.observable<boolean>(false),
        container: fakeExplorer as any
      });
      pane.collectionIdConfirmation = ko.observable<string>(selectedCollectionId);
      const Feedback = "my feedback";
      pane.containerDeleteFeedback(Feedback);

      return pane.submit().then(() => {
        expect(telemetryProcessorSpy.called).toBe(true);
        let deleteFeedback = new DeleteFeedback(SubscriptionId, AccountName, DataModels.ApiKind.SQL, Feedback);
        expect(
          telemetryProcessorSpy.calledWith(
            Action.DeleteCollection,
            ActionModifiers.Mark,
            JSON.stringify(deleteFeedback, Object.getOwnPropertyNames(deleteFeedback))
          )
        ).toBe(true);
      });
    });
  });
});
