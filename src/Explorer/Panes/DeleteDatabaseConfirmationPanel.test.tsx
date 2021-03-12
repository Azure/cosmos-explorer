jest.mock("../../Common/dataAccess/deleteDatabase");
jest.mock("../../Shared/Telemetry/TelemetryProcessor");
import { shallow } from "enzyme";
import * as ko from "knockout";
import React from "react";
import { deleteDatabase } from "../../Common/dataAccess/deleteDatabase";
import * as ViewModels from "../../Contracts/ViewModels";
import Explorer from "../Explorer";
import { DeleteDatabaseConfirmationPanel } from "./DeleteDatabaseConfirmationPanel";

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
      const database = {} as ViewModels.Database;
      explorer.databases = ko.observableArray<ViewModels.Database>([database]);
      expect(explorer.isLastDatabase()).toBe(true);
    });

    it("should be false if only 2 databases", () => {
      const database = {} as ViewModels.Database;
      const database2 = {} as ViewModels.Database;
      explorer.databases = ko.observableArray<ViewModels.Database>([database, database2]);
      expect(explorer.isLastDatabase()).toBe(false);
    });

    it("should be false if not last empty database", () => {
      const database = {} as ViewModels.Database;
      explorer.databases = ko.observableArray<ViewModels.Database>([database]);
      expect(explorer.isLastNonEmptyDatabase()).toBe(false);
    });

    it("should be true if last non empty database", () => {
      const database = {} as ViewModels.Database;
      database.collections = ko.observableArray<ViewModels.Collection>([{} as ViewModels.Collection]);
      explorer.databases = ko.observableArray<ViewModels.Database>([database]);
      expect(explorer.isLastNonEmptyDatabase()).toBe(true);
    });
  });

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
      expect(wrapper.exists(".deleteCollectionFeedback")).toBe(false);
    });
  });
});
