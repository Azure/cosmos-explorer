import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import * as ViewModels from "../../../Contracts/ViewModels";
import { NewVertexComponent } from "./NewVertexComponent";

describe("New Vertex Component", () => {
  beforeEach(() => {
    const fakeNewVertexData: ViewModels.NewVertexData = {
      label: "",
      properties: [
        {
          key: "test1",
          values: [
            {
              value: "",
              type: "string",
            },
          ],
        },
      ],
    };
    const props = {
      newVertexDataProp: fakeNewVertexData,
      partitionKeyPropertyProp: "test1",
      onChangeProp: (): void => undefined,
    };

    render(<NewVertexComponent {...props} />);
  });

  it("should render default prpoerty", () => {
    const fakeNewVertexData: ViewModels.NewVertexData = {
      label: "",
      properties: [],
    };
    const props = {
      newVertexDataProp: fakeNewVertexData,
      partitionKeyPropertyProp: "",
      onChangeProp: (): void => undefined,
    };

    const { asFragment } = render(<NewVertexComponent {...props} />);
    expect(asFragment).toMatchSnapshot();
  });

  it("should render Add property button", () => {
    const span = screen.getByText("Add Property");
    expect(span).toBeDefined();
  });

  it("should call onAddNewProperty method on span click", () => {
    const onAddNewProperty = jest.fn();
    const span = screen.getByText("Add Property");
    span.onclick = onAddNewProperty();
    fireEvent.click(span);
    expect(onAddNewProperty).toHaveBeenCalled();
  });

  it("should call onAddNewPropertyKeyPress method on span keyPress", () => {
    const onAddNewPropertyKeyPress = jest.fn();
    const span = screen.getByText("Add Property");
    span.onkeypress = onAddNewPropertyKeyPress();
    fireEvent.keyPress(span, { key: "Enter", code: 13, charCode: 13 });
    expect(onAddNewPropertyKeyPress).toHaveBeenCalled();
  });

  it("should call onLabelChange method on input change", () => {
    const onLabelChange = jest.fn();
    const input = screen.getByLabelText("Label");
    input.onchange = onLabelChange();
    fireEvent.change(input, { target: { value: "Label" } });
    expect(onLabelChange).toHaveBeenCalled();
  });

  it("should call onKeyChange method on key input change", () => {
    const onKeyChange = jest.fn();
    const input = screen.queryByPlaceholderText("Key");
    input.onchange = onKeyChange();
    fireEvent.change(input, { target: { value: "pk1" } });
    expect(onKeyChange).toHaveBeenCalled();
  });

  it("should call onValueChange method on value input change", () => {
    const onValueChange = jest.fn();
    const input = screen.queryByPlaceholderText("Value");
    input.onchange = onValueChange();
    fireEvent.change(input, { target: { value: "abc" } });
    expect(onValueChange).toHaveBeenCalled();
  });

  it("should call removeNewVertexProperty method on remove button click", () => {
    const removeNewVertexProperty = jest.fn();
    const div = screen.getAllByRole("button");
    div[0].onclick = removeNewVertexProperty();
    fireEvent.click(div[0]);
    expect(removeNewVertexProperty).toHaveBeenCalled();
  });

  it("should call removeNewVertexProperty method on remove button keyPress", () => {
    const removeNewVertexPropertyKeyPress = jest.fn();
    const div = screen.getAllByRole("button");
    div[0].onkeypress = removeNewVertexPropertyKeyPress();
    fireEvent.keyPress(div[0], { key: "Enter", code: 13, charCode: 13 });
    expect(removeNewVertexPropertyKeyPress).toHaveBeenCalled();
  });

  it("should call onTypeChange method on type dropdown change", () => {
    const DOWN_ARROW = { keyCode: 40 };
    const onTypeChange = jest.fn();
    const dropdown = screen.getByRole("combobox");
    dropdown.onclick = onTypeChange();
    dropdown.onkeydown = onTypeChange();

    fireEvent.keyDown(screen.getByRole("combobox"), DOWN_ARROW);
    fireEvent.click(screen.getByText(/number/));
    expect(onTypeChange).toHaveBeenCalled();
  });
});
