import { shallow } from "enzyme";
import * as ko from "knockout";
import React from "react";
import { SavedQueries } from "../../../Common/Constants";
import { Collection, Database } from "../../../Contracts/ViewModels";
import Explorer from "../../Explorer";
import { useDatabases } from "../../useDatabases";
import { SaveQueryPane } from "./SaveQueryPane";

describe("Save Query Pane", () => {
  const fakeExplorer = {} as Explorer;

  const props = {
    explorer: fakeExplorer,
    closePanel: (): void => undefined,
  };

  it("should render Default properly", () => {
    const wrapper = shallow(<SaveQueryPane {...props} />);
    expect(wrapper.exists("#saveQueryInput")).toBe(false);
    expect(wrapper).toMatchSnapshot();
  });

  it("should return true if can save Queries else false", () => {
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
    const wrapper = shallow(<SaveQueryPane {...props} />);
    expect(wrapper.exists("#saveQueryInput")).toBe(true);
  });
});
