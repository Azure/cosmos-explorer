import { shallow } from "enzyme";
import React from "react";
import { WelcomeSidebarModal } from "./WelcomeSidebarModal";

describe("WelcomeSidebarModal snapshot test", () => {
  it("should render ", () => {
    const wrapper = shallow(<WelcomeSidebarModal />);
    expect(wrapper).toMatchSnapshot();
  });
});
