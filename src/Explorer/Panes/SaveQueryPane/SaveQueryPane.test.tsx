import { shallow } from "enzyme";
import * as ko from "knockout";
import React from "react";
import Explorer from "../../Explorer";
import { SaveQueryPane } from "./SaveQueryPane";

describe("Save Query Pane", () => {
  const fakeExplorer = {} as Explorer;
  fakeExplorer.canSaveQueries = ko.computed<boolean>(() => true);

  const props = {
    explorer: fakeExplorer,
    closePanel: (): void => undefined,
  };

  const wrapper = shallow(<SaveQueryPane {...props} />);

  it("should return true if can save Queries else false", () => {
    fakeExplorer.canSaveQueries = ko.computed<boolean>(() => true);
    wrapper.setProps(props);
    expect(wrapper.exists("#saveQueryInput")).toBe(true);

    fakeExplorer.canSaveQueries = ko.computed<boolean>(() => false);
    wrapper.setProps(props);
    expect(wrapper.exists("#saveQueryInput")).toBe(false);
  });

  it("should render Default properly", () => {
    const wrapper = shallow(<SaveQueryPane {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
