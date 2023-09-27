import { IconButton } from "@fluentui/react";
import { CopyButton } from "Explorer/QueryCopilot/V2/Bubbles/Output/Buttons/Copy/CopyButton";
import { shallow } from "enzyme";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import React from "react";

document.execCommand = jest.fn();

describe("Copy button snapshot tests", () => {
  it("should render and click copy", async () => {
    const testInput = "test input query";
    useQueryCopilot.getState().setGeneratedQuery(testInput);
    const wrapper = shallow(<CopyButton sqlQuery={""} />);

    const button = wrapper.find(IconButton).first();
    button.simulate("click", {});

    expect(document.execCommand).toHaveBeenCalledWith("copy");
    expect(wrapper).toMatchSnapshot();
  });
});
