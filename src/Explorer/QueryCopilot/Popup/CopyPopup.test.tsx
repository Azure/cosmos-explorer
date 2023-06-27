import { shallow } from "enzyme";
import React from "react";
import { any } from "underscore";
import { CopyPopup } from "./CopyPopup";

describe("Copy Popup snapshot test", () => {
  it("should render when showCopyPopup is true", () => {
    const wrapper = shallow(<CopyPopup showCopyPopup={true} setShowCopyPopup={() => any} />);
    expect(wrapper).toMatchSnapshot();
  });
});
