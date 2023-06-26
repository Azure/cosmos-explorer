import { shallow } from "enzyme";
import React from "react";
import Explorer from "../Explorer";
import { QueryCopilotTab } from "./QueryCopilotTab";

describe("Query copilot tab snapshot test", () => {
  it("should render with initial input", () => {
    const wrapper = shallow(
      <QueryCopilotTab initialInput="Write a query to return all records in this table" explorer={new Explorer()} />
    );
    expect(wrapper).toMatchSnapshot();
  });
});
