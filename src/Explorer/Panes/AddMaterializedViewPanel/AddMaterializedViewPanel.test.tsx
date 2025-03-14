import { shallow, ShallowWrapper } from "enzyme";
import Explorer from "Explorer/Explorer";
import {
  AddMaterializedViewPanel,
  AddMaterializedViewPanelProps,
} from "Explorer/Panes/AddMaterializedViewPanel/AddMaterializedViewPanel";
import React, { Component } from "react";

const props: AddMaterializedViewPanelProps = {
  explorer: new Explorer(),
};

describe("AddMaterializedViewPanel", () => {
  it("render default panel", () => {
    const wrapper: ShallowWrapper<AddMaterializedViewPanelProps, object, Component> = shallow(
      <AddMaterializedViewPanel {...props} />,
    );
    expect(wrapper).toMatchSnapshot();
  });

  it("should render form", () => {
    const wrapper: ShallowWrapper<AddMaterializedViewPanelProps, object, Component> = shallow(
      <AddMaterializedViewPanel {...props} />,
    );
    const form = wrapper.find("form").first();
    expect(form).toBeDefined();
  });
});
