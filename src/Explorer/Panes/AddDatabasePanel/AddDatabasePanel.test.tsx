import { shallow } from "enzyme";
import React from "react";
import Explorer from "../../Explorer";
import { AddDatabasePane } from "../AddDatabasePane";
const props = {
  explorer: new Explorer(),
  closePanel: (): void => undefined,
  openNotificationConsole: (): void => undefined,
};
describe("AddDatabasePane Pane", () => {
  it("should render Default properly", () => {
    const wrapper = shallow(<AddDatabasePane {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
