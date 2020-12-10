import { shallow } from "enzyme";
import React from "react";
import { CollapsibleSectionComponent, CollapsibleSectionProps } from "./CollapsibleSectionComponent";

describe("CollapsibleSectionComponent", () => {
  it("renders", () => {
    const props: CollapsibleSectionProps = {
      title: "Sample title",
    };

    const wrapper = shallow(<CollapsibleSectionComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
