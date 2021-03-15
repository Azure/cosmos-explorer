jest.mock("../../Common/dataAccess/deleteDatabase");
jest.mock("../../Shared/Telemetry/TelemetryProcessor");
import { shallow } from "enzyme";
import React from "react";
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
});
