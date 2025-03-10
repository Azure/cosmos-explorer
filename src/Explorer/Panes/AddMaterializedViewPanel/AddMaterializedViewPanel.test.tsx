import { shallow } from "enzyme";
import Explorer from "Explorer/Explorer";
import { AddMaterializedViewPanel, AddMaterializedViewPanelProps } from "Explorer/Panes/AddMaterializedViewPanel/AddMaterializedViewPanel";
import React from "react";

const props: AddMaterializedViewPanelProps = {
  explorer: new Explorer(),
  sourceContainer: new Collection()
};

describe("AddMaterializedViewPanel", () => {
    const wrapper = shallow(<AddMaterializedViewPanel {...props} />);

  it("Render default properly", () => {
    expect(wrapper).toMatchSnapshot();
  });

  it("should render form", () => {

    const form = wrapper.find("form").first();
    expect(form).toBeDefined();
  });
});