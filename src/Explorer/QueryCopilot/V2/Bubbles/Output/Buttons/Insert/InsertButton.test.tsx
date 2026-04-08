import { InsertButton } from "Explorer/QueryCopilot/V2/Bubbles/Output/Buttons/Insert/InsertButton";
import { shallow } from "enzyme";
import React from "react";

describe("Insert button snapshot tests", () => {
  it("should click and update state", () => {
    const wrapper = shallow(<InsertButton sqlQuery={""} />);
    expect(wrapper).toMatchSnapshot();
  });
});
