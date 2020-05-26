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
import { CollectionStub, DatabaseStub, ExplorerStub } from "../OpenActionsStubs";
import { TreeNode } from "../../Contracts/ViewModels";

describe("Delete Collection Confirmation Pane", () => {
  describe("Explorer.isLastCollection()", () => {
    let explorer: ViewModels.Explorer;

    beforeEach(() => {
      explorer = new Explorer({ documentClientUtility: null, notificationsClient: null, isEmulator: false });
    });

    it("should be true if 1 database and 1 collection", () => {
      let database: ViewModels.Database = new DatabaseStub({});
      database.collections = ko.observableArray<ViewModels.Collection>([new CollectionStub({})]);
      explorer.databases = ko.observableArray<ViewModels.Database>([database]);
      expect(explorer.isLastCollection()).toBe(true);
    });

    it("should be false if if 1 database and 2 collection", () => {
      let database: ViewModels.Database = new DatabaseStub({});
      database.collections = ko.observableArray<ViewModels.Collection>([
        new CollectionStub({}),
        new CollectionStub({})
      ]);
      explorer.databases = ko.observableArray<ViewModels.Database>([database]);
      expect(explorer.isLastCollection()).toBe(false);
    });

    it("should be false if 2 database and 1 collection each", () => {
      let database: ViewModels.Database = new DatabaseStub({});
      database.collections = ko.observableArray<ViewModels.Collection>([new CollectionStub({})]);
      let database2: ViewModels.Database = new DatabaseStub({});
      database2.collections = ko.observableArray<ViewModels.Collection>([new CollectionStub({})]);
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
      let fakeExplorer = sinon.createStubInstance<ExplorerStub>(ExplorerStub as any);
      sinon.stub(fakeExplorer, "isNotificationConsoleExpanded").value(ko.observable<boolean>(false));

      let pane = new DeleteCollectionConfirmationPane({
        documentClientUtility: fakeDocumentClientUtility as any,
        id: "deletecollectionconfirmationpane",
        visible: ko.observable<boolean>(false),
        container: fakeExplorer as any
      });

      fakeExplorer.isLastCollection.returns(true);
      fakeExplorer.isSelectedDatabaseShared.returns(false);
      pane.container = fakeExplorer as any;
      expect(pane.shouldRecordFeedback()).toBe(true);

      fakeExplorer.isLastCollection.returns(true);
      fakeExplorer.isSelectedDatabaseShared.returns(true);
      pane.container = fakeExplorer as any;
      expect(pane.shouldRecordFeedback()).toBe(false);

      fakeExplorer.isLastCollection.returns(false);
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

    it("it should log feedback if last collection and database is not shared", () => {
      let selectedCollectionId = "testCol";
      let fakeDocumentClientUtility = sinon.createStubInstance<DocumentClientUtilityBase>(
        DocumentClientUtilityBase as any
      );
      fakeDocumentClientUtility.deleteCollection.returns(Q.resolve(null));
      let fakeExplorer = sinon.createStubInstance<ExplorerStub>(ExplorerStub as any);
      fakeExplorer.findSelectedCollection.returns(
        new CollectionStub({
          id: ko.observable<string>(selectedCollectionId),
          rid: "test"
        })
      );
      sinon.stub(fakeExplorer, "isNotificationConsoleExpanded").value(ko.observable<boolean>(false));
      sinon.stub(fakeExplorer, "selectedCollectionId").value(ko.observable<string>(selectedCollectionId));
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
      fakeExplorer.isLastCollection.returns(true);
      fakeExplorer.isSelectedDatabaseShared.returns(false);

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
