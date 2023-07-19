import { IconButton } from "@fluentui/react";
import { shallow } from "enzyme";
import React from "react";
import { CopyPopup } from "./CopyPopup";

describe("Copy Popup snapshot test", () => {
  const setShowCopyPopupMock = jest.fn();
  it("should render when showCopyPopup is true", () => {
    const wrapper = shallow(<CopyPopup showCopyPopup={true} setShowCopyPopup={setShowCopyPopupMock} />);
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.prop("setShowCopyPopup")).toBeUndefined();
    expect(wrapper).toMatchSnapshot();
  });

  it("should render when showCopyPopup is false", () => {
    const wrapper = shallow(<CopyPopup showCopyPopup={false} setShowCopyPopup={setShowCopyPopupMock} />);
    expect(wrapper.prop("showCopyPopup")).toBeFalsy();
    expect(wrapper.prop("setShowCopyPopup")).toBeUndefined();
    expect(wrapper).toMatchSnapshot();
  });

  it("should call setShowCopyPopup(false) when close button is clicked", () => {
    const wrapper = shallow(<CopyPopup showCopyPopup={true} setShowCopyPopup={setShowCopyPopupMock} />);

    const closeButton = wrapper.find(IconButton);
    closeButton.props().onClick?.({} as React.MouseEvent<HTMLButtonElement, MouseEvent>);

    expect(setShowCopyPopupMock).toHaveBeenCalledWith(false);
  });

  it("should have the correct inline styles", () => {
    const wrapper = shallow(<CopyPopup showCopyPopup={true} setShowCopyPopup={setShowCopyPopupMock} />);

    const stackStyle = wrapper.find("Stack").first().props().style;

    expect(stackStyle).toEqual({
      position: "fixed",
      width: 345,
      height: 66,
      padding: 10,
      gap: 5,
      top: 75,
      right: 20,
      background: "#FFFFFF",
      boxShadow: "0 2px 6px rgba(0, 0, 0, 0.16)",
    });
  });
});
