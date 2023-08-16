import { PrimaryButton } from "@fluentui/react";
import { shallow } from "enzyme";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import { withHooks } from "jest-react-hooks-shallow";
import React from "react";
import { WelcomeSidebarModal } from "./WelcomeSidebarModal";

describe("WelcomeSidebarModal snapshot test", () => {
  it("should close on button click ", () => {
    withHooks(() => {
      const wrapper = shallow(<WelcomeSidebarModal />);
      const spy = jest.spyOn(localStorage, "setItem");
      spy.mockClear();

      const button = wrapper.find(PrimaryButton).first();
      button.simulate("click", {});

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenLastCalledWith("showWelcomeSidebar", "false");
      expect(useQueryCopilot.getState().showWelcomeSidebar).toBeFalsy();
      expect(wrapper).toMatchSnapshot();
    });
  });
  it("should not reneder with local  storage key", () => {
    withHooks(() => {
      window.localStorage.setItem("showWelcomeSidebar", "false");
      const wrapper = shallow(<WelcomeSidebarModal />);

      expect(wrapper).toMatchSnapshot();
    });
  });
});
