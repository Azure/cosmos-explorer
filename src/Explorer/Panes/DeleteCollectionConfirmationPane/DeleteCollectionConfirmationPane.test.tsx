jest.mock("../../../Common/dataAccess/deleteCollection");
jest.mock("../../../Shared/Telemetry/TelemetryProcessor");
import { mount, ReactWrapper, shallow } from "enzyme";
import * as ko from "knockout";
import React from "react";
import { deleteCollection } from "../../../Common/dataAccess/deleteCollection";
import DeleteFeedback from "../../../Common/DeleteFeedback";
import { ApiKind, DatabaseAccount } from "../../../Contracts/DataModels";
import { Collection, Database } from "../../../Contracts/ViewModels";
import { Action, ActionModifiers } from "../../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";
import { updateUserContext } from "../../../UserContext";
import Explorer from "../../Explorer";
import { useDatabases } from "../../useDatabases";
import { useSelectedNode } from "../../useSelectedNode";
import { DeleteCollectionConfirmationPane } from "./DeleteCollectionConfirmationPane";

describe("Delete Collection Confirmation Pane", () => {
  describe("useDatabases.isLastCollection()", () => {
    beforeAll(() => useDatabases.getState().clearDatabases());
    afterEach(() => useDatabases.getState().clearDatabases());

    it("should be true if 1 database and 1 collection", () => {
      const database = { id: ko.observable("testDB") } as Database;
      database.collections = ko.observableArray<Collection>([{ id: ko.observable("testCollection") } as Collection]);
      useDatabases.getState().addDatabases([database]);
      expect(useDatabases.getState().isLastCollection()).toBe(true);
    });

    it("should be false if if 1 database and 2 collection", () => {
      const database = { id: ko.observable("testDB") } as Database;
      database.collections = ko.observableArray<Collection>([
        { id: ko.observable("coll1") } as Collection,
        { id: ko.observable("coll2") } as Collection,
      ]);
      useDatabases.getState().addDatabases([database]);
      expect(useDatabases.getState().isLastCollection()).toBe(false);
    });

    it("should be false if 2 database and 1 collection each", () => {
      const database = { id: ko.observable("testDB") } as Database;
      database.collections = ko.observableArray<Collection>([{ id: ko.observable("coll1") } as Collection]);
      const database2 = { id: ko.observable("testDB2") } as Database;
      database2.collections = ko.observableArray<Collection>([{ id: ko.observable("coll2") } as Collection]);
      useDatabases.getState().addDatabases([database, database2]);
      expect(useDatabases.getState().isLastCollection()).toBe(false);
    });

    it("should be false if 0 databases", () => {
      expect(useDatabases.getState().isLastCollection()).toBe(false);
    });
  });

  describe("shouldRecordFeedback()", () => {
    it("should return true if last collection and database does not have shared throughput else false", () => {
      const fakeExplorer = new Explorer();
      fakeExplorer.refreshAllDatabases = () => undefined;

      const props = {
        explorer: fakeExplorer,
        closePanel: (): void => undefined,
        collectionName: "container",
      };
      const wrapper = shallow(<DeleteCollectionConfirmationPane {...props} />);
      expect(wrapper.exists(".deleteCollectionFeedback")).toBe(false);

      const database = { id: ko.observable("testDB") } as Database;
      database.collections = ko.observableArray<Collection>([{ id: ko.observable("testCollection") } as Collection]);
      useDatabases.getState().addDatabases([database]);
      wrapper.setProps(props);
      expect(wrapper.exists(".deleteCollectionFeedback")).toBe(true);

      useSelectedNode.getState().setSelectedNode({
        id: ko.observable("testDB"),
        nodeKind: "Database",
        isDatabaseShared: () => true,
      } as Database);
      wrapper.setProps(props);
      expect(wrapper.exists(".deleteCollectionFeedback")).toBe(false);
    });
  });

  describe("submit()", () => {
    let wrapper: ReactWrapper;
    const selectedCollectionId = "testCol";
    const databaseId = "testDatabase";
    const fakeExplorer = {} as Explorer;
    useSelectedNode.getState().setSelectedNode({
      id: ko.observable<string>(selectedCollectionId),
      databaseId,
      rid: "test",
    } as Collection);
    fakeExplorer.refreshAllDatabases = () => undefined;
    const database = { id: ko.observable("testDB") } as Database;
    database.collections = ko.observableArray<Collection>([{ id: ko.observable("testCollection") } as Collection]);
    useDatabases.getState().addDatabases([database]);

    beforeAll(() => {
      updateUserContext({
        databaseAccount: {
          name: "testDatabaseAccountName",
          properties: {
            cassandraEndpoint: "testEndpoint",
          },
          id: "testDatabaseAccountId",
        } as DatabaseAccount,
        apiType: "SQL",
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
      wrapper = mount(<DeleteCollectionConfirmationPane {...props} />);
    });

    it("should call delete collection", () => {
      expect(wrapper).toMatchSnapshot();

      expect(wrapper.exists("#confirmCollectionId")).toBe(true);
      wrapper
        .find("#confirmCollectionId")
        .hostNodes()
        .simulate("change", { target: { value: selectedCollectionId } });

      expect(wrapper.exists("#sidePanelOkButton")).toBe(true);
      wrapper.find("#sidePanelOkButton").hostNodes().simulate("submit");
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

      expect(wrapper.exists("#sidePanelOkButton")).toBe(true);
      wrapper.find("#sidePanelOkButton").hostNodes().simulate("submit");
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
