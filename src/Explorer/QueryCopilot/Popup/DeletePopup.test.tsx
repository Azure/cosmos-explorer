import { mount, shallow } from "enzyme";
import React from "react";
import { DeletePopup } from "./DeletePopup";

describe("Delete Popup snapshot test", () => {
  const setShowDeletePopupMock = jest.fn();
  const setQueryMock = jest.fn();
  const clearFeedbackMock = jest.fn();
  const showFeedbackBarMock = jest.fn();

  it("should render when showDeletePopup is true", () => {
    const wrapper = shallow(
      <DeletePopup
        showDeletePopup={true}
        setShowDeletePopup={setShowDeletePopupMock}
        setQuery={setQueryMock}
        clearFeedback={clearFeedbackMock}
        showFeedbackBar={showFeedbackBarMock}
      />
    );
    expect(wrapper.find("Modal").prop("isOpen")).toBeTruthy();
    expect(wrapper).toMatchSnapshot();
  });

  it("should not render when showDeletePopup is false", () => {
    const wrapper = shallow(
      <DeletePopup
        showDeletePopup={false}
        setShowDeletePopup={setShowDeletePopupMock}
        setQuery={setQueryMock}
        clearFeedback={clearFeedbackMock}
        showFeedbackBar={showFeedbackBarMock}
      />
    );
    expect(wrapper.props().children.props.showDeletePopup).toBeFalsy();
    expect(wrapper).toMatchSnapshot();
  });

  it("should call setQuery with an empty string and setShowDeletePopup(false) when delete button is clicked", () => {
    const wrapper = mount(
      <DeletePopup
        showDeletePopup={true}
        setShowDeletePopup={setShowDeletePopupMock}
        setQuery={setQueryMock}
        clearFeedback={clearFeedbackMock}
        showFeedbackBar={showFeedbackBarMock}
      />
    );

    wrapper.find("PrimaryButton").simulate("click");

    expect(setQueryMock).toHaveBeenCalledWith("");
    expect(setShowDeletePopupMock).toHaveBeenCalledWith(false);
  });

  it("should call setShowDeletePopup(false) when close button is clicked", () => {
    const setShowDeletePopupMock = jest.fn();
    const wrapper = mount(
      <DeletePopup
        showDeletePopup={true}
        setShowDeletePopup={setShowDeletePopupMock}
        setQuery={setQueryMock}
        clearFeedback={clearFeedbackMock}
        showFeedbackBar={showFeedbackBarMock}
      />
    );

    wrapper.find("DefaultButton").at(1).simulate("click");

    expect(setShowDeletePopupMock).toHaveBeenCalledWith(false);
  });

  it("should render the appropriate text content", () => {
    const wrapper = shallow(
      <DeletePopup
        showDeletePopup={true}
        setShowDeletePopup={setShowDeletePopupMock}
        setQuery={setQueryMock}
        clearFeedback={clearFeedbackMock}
        showFeedbackBar={showFeedbackBarMock}
      />
    );

    const textContent = wrapper.find("Text").map((text) => text.props().children);

    expect(textContent).toEqual([
      <b>Delete code?</b>,
      "This will clear the query from the query builder pane along with all comments and also reset the prompt pane",
    ]);
  });

  it("should have the correct inline style", () => {
    const wrapper = shallow(
      <DeletePopup
        showDeletePopup={true}
        setShowDeletePopup={setShowDeletePopupMock}
        setQuery={setQueryMock}
        clearFeedback={clearFeedbackMock}
        showFeedbackBar={showFeedbackBarMock}
      />
    );

    const stackStyle = wrapper.find("Stack[style]").props().style;

    expect(stackStyle).toEqual({ padding: "16px 24px", height: "auto" });
  });
});
