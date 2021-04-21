import { shallow } from "enzyme";
import React from "react";
import Explorer from "../../Explorer";
import { UploadItemsPane } from "./UploadItemsPane";
const props = {
  explorer: new Explorer(),
  closePanel: (): void => undefined,
};
describe("Upload Items Pane", () => {
  it("should render Default properly", () => {
    const wrapper = shallow(<UploadItemsPane {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
