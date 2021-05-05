import { shallow } from "enzyme";
import React from "react";
import Explorer from "../../Explorer";
import { AddDatabasePanelF } from "./AddDatabasePanel";

const props = {
  explorer: new Explorer(),
  closePanel: (): void => undefined,
  openNotificationConsole: (): void => undefined,
};

describe("AddDatabasePane Pane", () => {
  it("should render Default properly", () => {
    const wrapper = shallow(<AddDatabasePanelF {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
