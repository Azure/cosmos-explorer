import { shallow } from "enzyme";
import React from "react";
import { WelcomeBubble } from "./WelcomeBubble";

const mockedDate = new Date(2023, 7, 15);
jest.spyOn(global, "Date").mockImplementation(() => mockedDate);

describe("Welcome Bubble snapshot test", () => {
  it("should render", () => {
    const wrapper = shallow(<WelcomeBubble />);
    expect(wrapper).toMatchSnapshot();
  });
});
