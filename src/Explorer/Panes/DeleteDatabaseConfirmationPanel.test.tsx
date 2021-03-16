jest.mock("../../Common/dataAccess/deleteDatabase");
jest.mock("../../Shared/Telemetry/TelemetryProcessor");
import { mount, ReactWrapper, shallow } from "enzyme";
import React from "react";
import { deleteDatabase } from "../../Common/dataAccess/deleteDatabase";
import { DatabaseAccount } from "../../Contracts/DataModels";
import { DefaultAccountExperienceType } from "../../DefaultAccountExperienceType";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { updateUserContext } from "../../UserContext";
import Explorer from "../Explorer";
import { DeleteDatabaseConfirmationPanel } from "./DeleteDatabaseConfirmationPanel";

describe("Delete Database Confirmation Pane", () => {
  describe("shouldRecordFeedback()", () => {
    it("should return true if last non empty database or is last database that has shared throughput, else false", () => {
      const fakeExplorer = new Explorer();
      fakeExplorer.refreshAllDatabases = () => undefined;
      fakeExplorer.isLastCollection = () => true;
      fakeExplorer.isSelectedDatabaseShared = () => false;

      const props = {
        explorer: fakeExplorer,
        closePanel: (): void => undefined,
        openNotificationConsole: (): void => undefined,
        selectedDatabase: fakeExplorer.findSelectedDatabase(),
      };

      const wrapper = shallow(<DeleteDatabaseConfirmationPanel {...props} />);
      props.explorer.isLastNonEmptyDatabase = () => true;
      wrapper.setProps(props);
      expect(wrapper.exists(".deleteDatabaseFeedback")).toBe(true);

      props.explorer.isLastNonEmptyDatabase = () => false;
      props.explorer.isLastDatabase = () => false;
      wrapper.setProps(props);
      expect(wrapper.exists(".deleteDatabaseFeedback")).toBe(false);

      props.explorer.isLastNonEmptyDatabase = () => false;
      props.explorer.isLastDatabase = () => true;
      props.explorer.isSelectedDatabaseShared = () => false;
      wrapper.setProps(props);
      expect(wrapper.exists(".deleteDatabaseFeedback")).toBe(false);
    });
  });

  describe("submit()", () => {
    const selectedDatabaseId = "testDatabse";
    const fakeExplorer = new Explorer();
    fakeExplorer.refreshAllDatabases = () => undefined;
    fakeExplorer.isLastCollection = () => true;
    fakeExplorer.isSelectedDatabaseShared = () => false;

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
        defaultExperience: DefaultAccountExperienceType.DocumentDB,
      });
      (deleteDatabase as jest.Mock).mockResolvedValue(undefined);
      (TelemetryProcessor.trace as jest.Mock).mockReturnValue(undefined);
    });

    beforeEach(() => {
      const props = {
        explorer: fakeExplorer,
        closePanel: (): void => undefined,
        openNotificationConsole: (): void => undefined,
        selectedDatabase: fakeExplorer.findSelectedDatabase(),
      };
      wrapper = mount(<DeleteDatabaseConfirmationPanel {...props} />);
      props.explorer.isLastNonEmptyDatabase = () => true;
      wrapper.setProps(props);
    });

    it("Should call delete database", () => {
      expect(wrapper).toMatchSnapshot();
      expect(wrapper.exists("#confirmDatabaseId")).toBe(true);
      expect(wrapper.exists("#sidePanelOkButton")).toBe(true);
      wrapper.find("#sidePanelOkButton").hostNodes().simulate("click");
      wrapper
        .find("#confirmDatabaseId")
        .hostNodes()
        .simulate("change", { target: { value: selectedDatabaseId } });
      wrapper.unmount();
    });

    it("should record feedback", async () => {
      expect(wrapper.exists("#confirmDatabaseId")).toBe(true);
      expect(wrapper.exists("#deleteDatabaseFeedbackInput")).toBe(true);
      const feedbackText = "Test delete Database feedback text";
      wrapper
        .find("#deleteDatabaseFeedbackInput")
        .hostNodes()
        .simulate("change", { target: { value: feedbackText } });

      expect(wrapper.exists("#sidePanelOkButton")).toBe(true);
      wrapper.find("#sidePanelOkButton").hostNodes().simulate("click");
      wrapper.unmount();
    });
  });
});
