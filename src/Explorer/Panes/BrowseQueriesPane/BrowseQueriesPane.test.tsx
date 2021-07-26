import { mount } from "enzyme";
import * as ko from "knockout";
import React from "react";
import { SavedQueries } from "../../../Common/Constants";
import { QueriesClient } from "../../../Common/QueriesClient";
import { Query } from "../../../Contracts/DataModels";
import { Collection, Database } from "../../../Contracts/ViewModels";
import Explorer from "../../Explorer";
import { useDatabases } from "../../useDatabases";
import { BrowseQueriesPane } from "./BrowseQueriesPane";

describe("Browse queries panel", () => {
  const fakeExplorer = {} as Explorer;
  const fakeClientQuery = {} as QueriesClient;
  const fakeQueryData = [] as Query[];
  fakeClientQuery.getQueries = async () => fakeQueryData;
  fakeExplorer.queriesClient = fakeClientQuery;
  const props = {
    explorer: fakeExplorer,
    closePanel: (): void => undefined,
  };
  useDatabases.getState().addDatabases([
    {
      id: ko.observable(SavedQueries.DatabaseName),
      collections: ko.observableArray([
        {
          id: ko.observable(SavedQueries.CollectionName),
        } as Collection,
      ]),
    } as Database,
  ]);

  it("Should render Default properly", () => {
    const wrapper = mount(<BrowseQueriesPane {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("Should show empty view when query is empty []", () => {
    const wrapper = mount(<BrowseQueriesPane {...props} />);
    expect(wrapper.exists("#emptyQueryBanner")).toBe(true);
  });
});
