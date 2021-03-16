import { shallow } from "enzyme";
import React from "react";
import { SettingsPane } from ".";
import { DatabaseAccount } from "../../../Contracts/DataModels";
import { updateUserContext } from "../../../UserContext";
const props = {
  closePanel: (): void => undefined,
  openNotificationConsole: (): void => undefined,
};
describe("Settings Pane", () => {
  it("should render Default properly", () => {
    const wrapper = shallow(<SettingsPane {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("should render Gremlin properly", () => {
    updateUserContext({
      databaseAccount: {
        properties: {
          capabilities: [{ name: "EnableGremlin" }],
        },
      } as DatabaseAccount,
    });
    const wrapper = shallow(<SettingsPane {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("should render an setting as heading ", () => {
    const wrapper = shallow(<SettingsPane {...props} />);
    expect(wrapper.find('span[role="heading"]').text()).toEqual("Settings");
  });
});
