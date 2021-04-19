jest.mock("../../../Common/dataAccess/deleteCollection");
jest.mock("../../../Shared/Telemetry/TelemetryProcessor");
import { mount, ReactWrapper, shallow } from "enzyme";
import * as ko from "knockout";
import React from "react";
import { DeleteCollectionConfirmationPanel } from ".";
import { deleteCollection } from "../../../Common/dataAccess/deleteCollection";
import DeleteFeedback from "../../../Common/DeleteFeedback";
import { ApiKind, DatabaseAccount } from "../../../Contracts/DataModels";
import { Collection, Database, TreeNode } from "../../../Contracts/ViewModels";
import { DefaultAccountExperienceType } from "../../../DefaultAccountExperienceType";
import { Action, ActionModifiers } from "../../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";
import { updateUserContext } from "../../../UserContext";
import Explorer from "../../Explorer";

describe("Delete Collection Confirmation Pane", () => {
  describe("Explorer.isLastCollection()", () => {
    let explorer: Explorer;

    beforeEach(() => {
      explorer = new Explorer();
    });

    it("should be true if 1 database and 1 collection", () => {
      const database = {} as Database;
      database.collections = ko.observableArray<Collection>([{} as Collection]);
      explorer.databases = ko.observableArray<Database>([database]);
      expect(explorer.isLastCollection()).toBe(true);
    });

    it("should be false if if 1 database and 2 collection", () => {
      const database = {} as Database;
      database.collections = ko.observableArray<Collection>([{} as Collection, {} as Collection]);
      explorer.databases = ko.observableArray<Database>([database]);
      expect(explorer.isLastCollection()).toBe(false);
    });

    it("should be false if 2 database and 1 collection each", () => {
      const database = {} as Database;
      database.collections = ko.observableArray<Collection>([{} as Collection]);
      const database2 = {} as Database;
      database2.collections = ko.observableArray<Collection>([{} as Collection]);
      explorer.databases = ko.observableArray<Database>([database, database2]);
      expect(explorer.isLastCollection()).toBe(false);
    });

    it("should be false if 0 databases", () => {
      const database = {} as Database;
      explorer.databases = ko.observableArray<Database>();
      database.collections = ko.observableArray<Collection>();
      expect(explorer.isLastCollection()).toBe(false);
    });
  });

  describe("shouldRecordFeedback()", () => {
    it("should return true if last collection and database does not have shared throughput else false", () => {
      const fakeExplorer = new Explorer();
      fakeExplorer.refreshAllDatabases = () => undefined;
      fakeExplorer.isLastCollection = () => true;
      fakeExplorer.isSelectedDatabaseShared = () => false;

      const props = {
        explorer: fakeExplorer,
        closePanel: (): void => undefined,
        collectionName: "container",
      };
      const wrapper = shallow(<DeleteCollectionConfirmationPanel {...props} />);
      expect(wrapper.exists(".deleteCollectionFeedback")).toBe(true);

      props.explorer.isLastCollection = () => true;
      props.explorer.isSelectedDatabaseShared = () => true;
      wrapper.setProps(props);
      expect(wrapper.exists(".deleteCollectionFeedback")).toBe(false);

      props.explorer.isLastCollection = () => false;
      props.explorer.isSelectedDatabaseShared = () => false;
      wrapper.setProps(props);
      expect(wrapper.exists(".deleteCollectionFeedback")).toBe(false);
    });
  });

  describe("submit()", () => {
    let wrapper: ReactWrapper;
    const selectedCollectionId = "testCol";
    const databaseId = "testDatabase";
    const fakeExplorer = {} as Explorer;
    fakeExplorer.findSelectedCollection = () => {
      return {
        id: ko.observable<string>(selectedCollectionId),
        databaseId,
        rid: "test",
      } as Collection;
    };
    fakeExplorer.selectedCollectionId = ko.computed<string>(() => selectedCollectionId);
    fakeExplorer.selectedNode = ko.observable<TreeNode>();
    fakeExplorer.refreshAllDatabases = () => undefined;
    fakeExplorer.isLastCollection = () => true;
    fakeExplorer.isSelectedDatabaseShared = () => false;

    beforeAll(() => {
      updateUserContext({
        databaseAccount: {
          name: "testDatabaseAccountName",
          properties: {
            cassandraEndpoint: "testEndpoint",
          },
          id: "testDatabaseAccountId",
        } as DatabaseAccount,
        defaultExperience: DefaultAccountExperienceType.DocumentDB,
      });
      (deleteCollection as jest.Mock).mockResolvedValue(undefined);
      (TelemetryProcessor.trace as jest.Mock).mockReturnValue(undefined);
    });

    beforeEach(() => {
      const props = {
        explorer: fakeExplorer,
        closePanel: (): void => undefined,
        collectionName: "container",
      };
      wrapper = mount(<DeleteCollectionConfirmationPanel {...props} />);
    });

    it("should call delete collection", () => {
      expect(wrapper).toMatchSnapshot();

      expect(wrapper.exists("#confirmCollectionId")).toBe(true);
      wrapper
        .find("#confirmCollectionId")
        .hostNodes()
        .simulate("change", { target: { value: selectedCollectionId } });

      expect(wrapper.exists(".genericPaneSubmitBtn")).toBe(true);
      wrapper.find(".genericPaneSubmitBtn").hostNodes().simulate("click");
      expect(deleteCollection).toHaveBeenCalledWith(databaseId, selectedCollectionId);

      wrapper.unmount();
    });

    it("should record feedback", async () => {
      expect(wrapper.exists("#confirmCollectionId")).toBe(true);
      wrapper
        .find("#confirmCollectionId")
        .hostNodes()
        .simulate("change", { target: { value: selectedCollectionId } });

      expect(wrapper.exists("#deleteCollectionFeedbackInput")).toBe(true);
      const feedbackText = "Test delete collection feedback text";
      wrapper
        .find("#deleteCollectionFeedbackInput")
        .hostNodes()
        .simulate("change", { target: { value: feedbackText } });

      expect(wrapper.exists(".genericPaneSubmitBtn")).toBe(true);
      wrapper.find(".genericPaneSubmitBtn").hostNodes().simulate("click");
      expect(deleteCollection).toHaveBeenCalledWith(databaseId, selectedCollectionId);

      const deleteFeedback = new DeleteFeedback(
        "testDatabaseAccountId",
        "testDatabaseAccountName",
        ApiKind.SQL,
        feedbackText
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(TelemetryProcessor.trace).toHaveBeenCalledWith(Action.DeleteCollection, ActionModifiers.Mark, {
        message: JSON.stringify(deleteFeedback, Object.getOwnPropertyNames(deleteFeedback)),
      });

      wrapper.unmount();
    });
  });
});
