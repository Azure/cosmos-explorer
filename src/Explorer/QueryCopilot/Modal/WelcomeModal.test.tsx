import { shallow } from "enzyme";
import { withHooks } from "jest-react-hooks-shallow";
import React from "react";
import { WelcomeModal } from "./WelcomeModal";

describe("Query Copilot Carousel snapshot test", () => {
  it("should render when isOpen is true", () => {
    withHooks(() => {
      const spy = jest.spyOn(localStorage, "setItem");
      spy.mockClear();
      const wrapper = shallow(<WelcomeModal visible={true} />);

      expect(wrapper.props().children.props.isOpen).toBeTruthy();
      expect(wrapper).toMatchSnapshot();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenLastCalledWith("hideWelcomeModal", "true");
    });
  });
  it("should not render when isOpen is false", () => {
    withHooks(() => {
      const spy = jest.spyOn(localStorage, "setItem");
      spy.mockClear();
      const wrapper = shallow(<WelcomeModal visible={false} />);

      expect(wrapper.props().children.props.isOpen).toBeFalsy();

      expect(spy).not.toHaveBeenCalled();
      expect(spy.mock.instances.length).toBe(0);
    });
  });
});
