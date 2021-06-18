jest.mock("../../Common/dataAccess/deleteDatabase");
jest.mock("../../Shared/Telemetry/TelemetryProcessor");
import { mount, ReactWrapper, shallow } from "enzyme";
import * as ko from "knockout";
import React from "react";
import { deleteDatabase } from "../../Common/dataAccess/deleteDatabase";
import DeleteFeedback from "../../Common/DeleteFeedback";
import { ApiKind, DatabaseAccount } from "../../Contracts/DataModels";
import { Collection, Database } from "../../Contracts/ViewModels";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { updateUserContext } from "../../UserContext";
import Explorer from "../Explorer";
import { TabsManager } from "../Tabs/TabsManager";
import { useDatabases } from "../useDatabases";
import { DeleteDatabaseConfirmationPanel } from "./DeleteDatabaseConfirmationPanel";

describe("Delete Database Confirmation Pane", () => {
  describe("shouldRecordFeedback()", () => {
    it("should return true if last non empty database or is last database that has shared throughput, else false", () => {
      const fakeExplorer = {} as Explorer;
      fakeExplorer.refreshAllDatabases = () => undefined;
      fakeExplorer.isSelectedDatabaseShared = () => false;

      const database = {} as Database;
      database.collections = ko.observableArray<Collection>([{ id: ko.observable("testCollection") } as Collection]);
      database.id = ko.observable<string>("testDatabase");

      const props = {
        explorer: fakeExplorer,
        closePanel: (): void => undefined,
        openNotificationConsole: (): void => undefined,
        selectedDatabase: database,
      };

      const wrapper = shallow(<DeleteDatabaseConfirmationPanel {...props} />);
      expect(wrapper.exists(".deleteDatabaseFeedback")).toBe(false);

      useDatabases.getState().addDatabases([database]);

      wrapper.setProps(props);
      expect(wrapper.exists(".deleteDatabaseFeedback")).toBe(true);
      useDatabases.getState().clearDatabases();
    });
  });

  describe("submit()", () => {
    const selectedDatabaseId = "testDatabse";
    const database = { id: ko.observable("testDatabase") } as Database;
    database.collections = ko.observableArray<Collection>([{ id: ko.observable("testCollection") } as Collection]);
    database.id = ko.observable<string>(selectedDatabaseId);
    const fakeExplorer = {} as Explorer;
    fakeExplorer.refreshAllDatabases = () => undefined;
    fakeExplorer.isSelectedDatabaseShared = () => false;
    fakeExplorer.tabsManager = new TabsManager();
    fakeExplorer.selectedNode = ko.observable();

    let wrapper: ReactWrapper;
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
      (deleteDatabase as jest.Mock).mockResolvedValue(undefined);
      (TelemetryProcessor.trace as jest.Mock).mockReturnValue(undefined);
      useDatabases.getState().addDatabases([database]);
    });

    beforeEach(() => {
      const props = {
        explorer: fakeExplorer,
        closePanel: (): void => undefined,
        openNotificationConsole: (): void => undefined,
        selectedDatabase: database,
      };

      wrapper = mount(<DeleteDatabaseConfirmationPanel {...props} />);
    });

    afterAll(() => useDatabases.getState().clearDatabases());

    it("Should call delete database", () => {
      expect(wrapper).toMatchSnapshot();
      expect(wrapper.exists("#confirmDatabaseId")).toBe(true);

      wrapper
        .find("#confirmDatabaseId")
        .hostNodes()
        .simulate("change", { target: { value: selectedDatabaseId } });
      expect(wrapper.exists("button")).toBe(true);
      wrapper.find("button").hostNodes().simulate("submit");
      expect(deleteDatabase).toHaveBeenCalledWith(selectedDatabaseId);
      wrapper.unmount();
    });

    it("should record feedback", async () => {
      expect(wrapper.exists("#confirmDatabaseId")).toBe(true);
      wrapper
        .find("#confirmDatabaseId")
        .hostNodes()
        .simulate("change", { target: { value: selectedDatabaseId } });

      expect(wrapper.exists("#deleteDatabaseFeedbackInput")).toBe(true);
      const feedbackText = "Test delete Database feedback text";
      wrapper
        .find("#deleteDatabaseFeedbackInput")
        .hostNodes()
        .simulate("change", { target: { value: feedbackText } });

      expect(wrapper.exists("#sidePanelOkButton")).toBe(true);
      wrapper.find("#sidePanelOkButton").hostNodes().simulate("submit");
      expect(deleteDatabase).toHaveBeenCalledWith(selectedDatabaseId);

      const deleteFeedback = new DeleteFeedback(
        "testDatabaseAccountId",
        "testDatabaseAccountName",
        ApiKind.SQL,
        feedbackText
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(TelemetryProcessor.trace).toHaveBeenCalledWith(Action.DeleteDatabase, ActionModifiers.Mark, {
        message: JSON.stringify(deleteFeedback, Object.getOwnPropertyNames(deleteFeedback)),
      });
      wrapper.unmount();
    });
  });
});
