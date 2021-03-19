import { shallow } from "enzyme";
import React from "react";
import { CollapsibleSectionComponent, CollapsibleSectionProps } from "./CollapsibleSectionComponent";

describe("CollapsibleSectionComponent", () => {
  it("renders", () => {
    const props: CollapsibleSectionProps = {
      title: "Sample title",
      isExpandedByDefault: true,
    };

    const wrapper = shallow(<CollapsibleSectionComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
