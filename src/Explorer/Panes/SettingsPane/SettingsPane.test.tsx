import { shallow } from "enzyme";
import React from "react";
import { DatabaseAccount } from "../../../Contracts/DataModels";
import { updateUserContext } from "../../../UserContext";
import { SettingsPane } from "./SettingsPane";

describe("Settings Pane", () => {
  beforeEach(() => {
    updateUserContext({
      sessionId: "1234-5678",
    });
  });

  it("should render Default properly", () => {
    const wrapper = shallow(<SettingsPane explorer={null} />);
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
    const wrapper = shallow(<SettingsPane explorer={null} />);
    expect(wrapper).toMatchSnapshot();
  });
});
