import { IconButton } from "@fluentui/react";
import { shallow } from "enzyme";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import React from "react";
import { Header } from "./Header";

describe("Header snapshot test", () => {
  it("should close on button click ", () => {
    const wrapper = shallow(<Header />);

    const iconButton = wrapper.find(IconButton).first();
    iconButton.simulate("click", {});

    expect(useQueryCopilot.getState().showCopilotSidebar).toBeFalsy();
    expect(wrapper).toMatchSnapshot();
  });
});
