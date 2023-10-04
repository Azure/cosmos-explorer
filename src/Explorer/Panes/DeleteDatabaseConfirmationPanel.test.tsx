jest.mock("../../Common/dataAccess/deleteDatabase");
jest.mock("../../Shared/Telemetry/TelemetryProcessor");
import { mount, shallow } from "enzyme";
import * as ko from "knockout";
import React from "react";
import { deleteDatabase } from "../../Common/dataAccess/deleteDatabase";
import DeleteFeedback from "../../Common/DeleteFeedback";
import { ApiKind, DatabaseAccount } from "../../Contracts/DataModels";
import { Collection, Database } from "../../Contracts/ViewModels";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { updateUserContext } from "../../UserContext";
import { useDatabases } from "../useDatabases";
import { useSelectedNode } from "../useSelectedNode";
import { DeleteDatabaseConfirmationPanel } from "./DeleteDatabaseConfirmationPanel";

describe("Delete Database Confirmation Pane", () => {
  const selectedDatabaseId = "testDatabase";
  let database: Database;

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
  });

  beforeEach(() => {
    database = {} as Database;
    database.collections = ko.observableArray<Collection>([{ id: ko.observable("testCollection") } as Collection]);
    database.id = ko.observable<string>(selectedDatabaseId);
    database.nodeKind = "Database";

    useDatabases.getState().addDatabases([database]);
    useSelectedNode.getState().setSelectedNode(database);
  });

  afterEach(() => {
    useDatabases.getState().clearDatabases();
    useSelectedNode.getState().setSelectedNode(undefined);
  });

  it("shouldRecordFeedback() should return true if last non empty database or is last database that has shared throughput", () => {
    const wrapper = shallow(<DeleteDatabaseConfirmationPanel refreshDatabases={() => undefined} />);
    expect(wrapper.exists(".deleteDatabaseFeedback")).toBe(true);

    useDatabases.getState().addDatabases([database]);
    wrapper.setProps({});
    expect(wrapper.exists(".deleteDatabaseFeedback")).toBe(false);
    useDatabases.getState().clearDatabases();
  });

  it("Should call delete database", () => {
    const wrapper = mount(<DeleteDatabaseConfirmationPanel refreshDatabases={() => undefined} />);
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
    const wrapper = mount(<DeleteDatabaseConfirmationPanel refreshDatabases={() => undefined} />);
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
      feedbackText,
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(TelemetryProcessor.trace).toHaveBeenCalledWith(Action.DeleteDatabase, ActionModifiers.Mark, {
      message: JSON.stringify(deleteFeedback, Object.getOwnPropertyNames(deleteFeedback)),
    });
    wrapper.unmount();
  });
});
