import { mount } from "enzyme";
import * as ko from "knockout";
import React from "react";
import { QueriesClient } from "../../../Common/QueriesClient";
import { Query } from "../../../Contracts/DataModels";
import Explorer from "../../Explorer";
import { BrowseQueriesPanel } from "./index";

describe("Browse queries panel", () => {
  const fakeExplorer = {} as Explorer;
  fakeExplorer.canSaveQueries = ko.computed<boolean>(() => true);
  const fakeClientQuery = {} as QueriesClient;
  const fakeQueryData = [] as Query[];
  fakeClientQuery.getQueries = async () => fakeQueryData;
  fakeExplorer.queriesClient = fakeClientQuery;
  const props = {
    explorer: fakeExplorer,
    closePanel: (): void => undefined,
  };

  it("Should render Default properly", () => {
    const wrapper = mount(<BrowseQueriesPanel {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("Should show empty view when query is empty []", () => {
    const wrapper = mount(<BrowseQueriesPanel {...props} />);
    expect(wrapper.exists("#emptyQueryBanner")).toBe(true);
  });
});
