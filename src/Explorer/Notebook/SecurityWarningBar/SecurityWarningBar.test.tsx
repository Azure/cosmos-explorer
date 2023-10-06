import { shallow } from "enzyme";
import React from "react";
import { SecurityWarningBar } from "./SecurityWarningBar";

describe("SecurityWarningBar", () => {
  it("renders if notebook is untrusted", () => {
    const wrapper = shallow(
      <SecurityWarningBar
        contentRef={"contentRef"}
        isNotebookUntrusted={true}
        markNotebookAsTrusted={undefined}
        saveNotebook={undefined}
      />,
    );

    expect(wrapper).toMatchSnapshot();
  });

  it("renders if notebook is trusted", () => {
    const wrapper = shallow(
      <SecurityWarningBar
        contentRef={"contentRef"}
        isNotebookUntrusted={false}
        markNotebookAsTrusted={undefined}
        saveNotebook={undefined}
      />,
    );

    expect(wrapper).toMatchSnapshot();
  });
});
