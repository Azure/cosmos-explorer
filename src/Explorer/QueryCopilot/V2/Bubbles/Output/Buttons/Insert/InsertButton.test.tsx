import { ActionButton } from "@fluentui/react";
import { InsertButton } from "Explorer/QueryCopilot/V2/Bubbles/Output/Buttons/Insert/InsertButton";
import { shallow } from "enzyme";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import React from "react";

describe("Insert button snapshot tests", () => {
  it("should click and update state", () => {
    const testQuery = "test query";
    useQueryCopilot.getState().setGeneratedQuery(testQuery);
    const wrapper = shallow(<InsertButton />);

    const button = wrapper.find(ActionButton).first();
    button.simulate("click");

    expect(useQueryCopilot.getState().query).toEqual(testQuery);
    expect(wrapper).toMatchSnapshot();
  });
});
