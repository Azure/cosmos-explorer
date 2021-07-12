import { shallow } from "enzyme";
import React from "react";
import { NotebookTerminalComponent, NotebookTerminalComponentProps } from "./NotebookTerminalComponent";

describe("NotebookTerminalComponent", () => {
  it("renders", () => {
    const props: NotebookTerminalComponentProps = {
      databaseAccount: undefined,
      notebookServerInfo: undefined,
    };

    const wrapper = shallow(<NotebookTerminalComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
