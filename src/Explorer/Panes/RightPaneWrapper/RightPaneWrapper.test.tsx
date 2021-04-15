import { fireEvent, render, screen } from "@testing-library/react";
import { mount, ReactWrapper } from "enzyme";
import React from "react";
import Explorer from "../../Explorer";
import { RightPaneWrapper } from "./RightPaneWrapper";

const onClose = jest.fn();
const onSubmit = jest.fn();

const props = {
  closePanel: (): void => undefined,
  container: new Explorer(),
  formError: "",
  formErrorDetail: "",
  id: "loadQueryPane",
  isExecuting: false,
  title: "Load Query Pane",
  submitButtonText: "Load",
  onClose,
  onSubmit,
};

describe("Load Query Pane", () => {
  let wrapper: ReactWrapper;

  it("should render Default properly", () => {
    wrapper = mount(<RightPaneWrapper {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
  it("should call close method click cancel icon", () => {
    render(<RightPaneWrapper {...props} />);
    fireEvent.click(screen.getByTestId("closePaneBtn"));
    expect(onClose).toHaveBeenCalled();
  });
  it("should call submit method enter in form", () => {
    render(<RightPaneWrapper {...props} />);
    fireEvent.click(screen.getByTestId("submit"));
    expect(onSubmit).toHaveBeenCalled();
  });
  it("should call submit method click on submit button", () => {
    render(<RightPaneWrapper {...props} />);
    fireEvent.click(screen.getByTestId("submit"));
    expect(onSubmit).toHaveBeenCalled();
  });
  it("should render error in header", () => {
    render(<RightPaneWrapper {...props} formError="file already Exist" />);
    expect(screen.getByTestId("errorIcon")).toBeDefined();
    expect(screen.getByTestId("panelmessage").innerHTML).toEqual("file already Exist");
  });
});
