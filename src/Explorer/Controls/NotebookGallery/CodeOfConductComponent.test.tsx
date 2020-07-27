import { shallow } from "enzyme";
import React from "react";
import { CodeOfConductComponent, CodeOfConductComponentProps } from "./CodeOfConductComponent";

describe("CodeOfConductComponent", () => {
  it("renders", () => {
    const props: CodeOfConductComponentProps = {
      junoClient: undefined,
      onAcceptCodeOfConduct: undefined
    };

    const wrapper = shallow(<CodeOfConductComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
