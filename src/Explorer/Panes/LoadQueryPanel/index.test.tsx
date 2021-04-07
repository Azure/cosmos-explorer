import { shallow } from "enzyme";
import React from "react";
import Explorer from "../../Explorer";
import { LoadQueryPanel } from "./index";

describe("Load Query Pane", () => {
  it("should render Default properly", () => {
    const fakeExplorer = {} as Explorer;
    const props = {
      explorer: fakeExplorer,
      closePanel: (): void => undefined,
    };

    const wrapper = shallow(<LoadQueryPanel {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
