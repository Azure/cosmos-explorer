import { shallow } from "enzyme";
import * as ko from "knockout";
import React from "react";
import Explorer from "../../Explorer";
import { BrowseQueriesPanel } from "./index";

describe("Browse queries panel", () => {
  const fakeExplorer = {} as Explorer;
  fakeExplorer.canSaveQueries = ko.computed<boolean>(() => true);
  const props = {
    explorer: fakeExplorer,
    closePanel: (): void => undefined,
  };

  it("should render Default properly", () => {
    const wrapper = shallow(<BrowseQueriesPanel {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
