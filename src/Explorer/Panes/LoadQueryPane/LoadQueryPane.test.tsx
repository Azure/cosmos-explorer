import { shallow } from "enzyme";
import React from "react";
import Explorer from "../../Explorer";
import { LoadQueryPane } from "./LoadQueryPane";

describe("Load Query Pane", () => {
  it("should render Default properly", () => {
    const fakeExplorer = {} as Explorer;
    const props = {
      explorer: fakeExplorer,
      closePanel: (): void => undefined,
    };

    const wrapper = shallow(<LoadQueryPane {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
