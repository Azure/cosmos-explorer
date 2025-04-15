import { shallow } from "enzyme";
import React from "react";
import Explorer from "../../Explorer";
import { AddCollectionPanel } from "./AddCollectionPanel";

const props = {
  explorer: new Explorer(),
};

describe("AddCollectionPanel", () => {
  it("should render Default properly", () => {
    const wrapper = shallow(<AddCollectionPanel {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
