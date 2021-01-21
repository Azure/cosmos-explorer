import { shallow } from "enzyme";
import React from "react";
import { ToolTipLabelComponent, ToolTipLabelComponentProps } from "./ToolTipLabelComponent";

describe("ToolTipLabelComponent", () => {
  const props: ToolTipLabelComponentProps = {
    label: "sample tool tip label",
    toolTipElement: <span>sample tool tip text</span>
  };

  it("renders", () => {
    const wrapper = shallow(<ToolTipLabelComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
