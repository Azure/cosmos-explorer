import { shallow, ShallowWrapper } from "enzyme";
import Explorer from "Explorer/Explorer";
import {
  AddGlobalSecondaryIndexPanel,
  AddGlobalSecondaryIndexPanelProps,
} from "Explorer/Panes/AddGlobalSecondaryIndexPanel/AddGlobalSecondaryIndexPanel";
import React, { Component } from "react";

const props: AddGlobalSecondaryIndexPanelProps = {
  explorer: new Explorer(),
};

describe("AddGlobalSecondaryIndexPanel", () => {
  it("render default panel", () => {
    const wrapper: ShallowWrapper<AddGlobalSecondaryIndexPanelProps, object, Component> = shallow(
      <AddGlobalSecondaryIndexPanel {...props} />,
    );
    expect(wrapper).toMatchSnapshot();
  });

  it("should render form", () => {
    const wrapper: ShallowWrapper<AddGlobalSecondaryIndexPanelProps, object, Component> = shallow(
      <AddGlobalSecondaryIndexPanel {...props} />,
    );
    const form = wrapper.find("form").first();
    expect(form).toBeDefined();
  });
});
