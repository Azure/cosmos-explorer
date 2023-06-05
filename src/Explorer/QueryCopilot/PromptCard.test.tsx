import { shallow } from "enzyme";
import React from "react";
import { PromptCard } from "./PromptCard";

describe("Prompt card snapshot test", () => {
  it("should render properly if isSelected is true", () => {
    const wrapper = shallow(
      <PromptCard header="TestHeader" description="TestDescription" isSelected={true} onSelect={() => undefined} />
    );
    expect(wrapper).toMatchSnapshot();
  });

  it("should render properly if isSelected is false", () => {
    const wrapper = shallow(
      <PromptCard header="TestHeader" description="TestDescription" isSelected={false} onSelect={() => undefined} />
    );
    expect(wrapper).toMatchSnapshot();
  });
});
