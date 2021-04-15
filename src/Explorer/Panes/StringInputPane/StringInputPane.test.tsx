import { mount } from "enzyme";
import React from "react";
import Explorer from "../../Explorer";
import { StringInputPane } from "./StringInputPane";
const props = {
  explorer: new Explorer(),
  closePanel: (): void => undefined,
  errorMessage: "Could not create directory ",
  inProgressMessage: "Creating directory ",
  successMessage: "Created directory ",
  inputLabel: "Enter new directory name",
  paneTitle: "Create new directory",
  submitButtonLabel: "Create",
  defaultInput: "",
  onSubmit: jest.fn(),
  notebookFile: {
    name: "Untitled1123.ipynb",
    path: "notebooks/Untitled1123.ipynb",
    type: 0,
    timestamp: 1618452275805,
  },
};
describe("StringInput Pane", () => {
  it("should render Create new directory properly", () => {
    const wrapper = mount(<StringInputPane {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
