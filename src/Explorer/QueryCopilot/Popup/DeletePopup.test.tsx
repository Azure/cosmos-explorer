import { shallow } from "enzyme";
import React from "react";
import { any } from "underscore";
import { DeletePopup } from "./DeletePopup";

describe("Delete Popup snapshot test", () => {
  it("should render when showDeletePopup is true", () => {
    const wrapper = shallow(
      <DeletePopup
        showDeletePopup={true}
        setShowDeletePopup={() => any}
        setQuery={() => any}
        clearFeedback={() => any}
        showFeedbackBar={() => any}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });
});
