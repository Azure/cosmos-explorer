import { fireEvent, render, screen } from "@testing-library/react";
import { mount, ReactWrapper } from "enzyme";
import React from "react";
import { RightPaneForm } from "./RightPaneForm";

const onSubmit = jest.fn();
const expandConsole = jest.fn();

const props = {
  expandConsole,
  formError: "",
  isExecuting: false,
  submitButtonText: "Load",
  onSubmit,
};

describe("Right Pane Form", () => {
  let wrapper: ReactWrapper;

  it("should render Default properly", () => {
    wrapper = mount(<RightPaneForm {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
  it("should call submit method enter in form", () => {
    render(<RightPaneForm {...props} />);
    fireEvent.click(screen.getByLabelText("Load"));
    expect(onSubmit).toHaveBeenCalled();
  });
  it("should call submit method click on submit button", () => {
    render(<RightPaneForm {...props} />);
    fireEvent.click(screen.getByLabelText("Load"));
    expect(onSubmit).toHaveBeenCalled();
  });
  it("should render error in header", () => {
    render(<RightPaneForm {...props} formError="file already Exist" />);
    expect(screen.getByLabelText("error")).toBeDefined();
    expect(screen.getByLabelText("message").innerHTML).toEqual("file already Exist");
  });
});
