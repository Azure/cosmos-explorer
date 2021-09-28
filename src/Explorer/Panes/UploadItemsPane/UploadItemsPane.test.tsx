import { shallow } from "enzyme";
import React from "react";
import { UploadItemsPane } from "./UploadItemsPane";

describe("Upload Items Pane", () => {
  it("should render Default properly", () => {
    const wrapper = shallow(<UploadItemsPane />);
    expect(wrapper).toMatchSnapshot();
  });
});
