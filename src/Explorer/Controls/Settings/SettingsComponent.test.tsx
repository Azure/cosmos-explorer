import { shallow } from "enzyme";
import React from "react";
import { SettingsComponentProps, SettingsComponent } from "./SettingsComponent";
import * as ViewModels from "../../../Contracts/ViewModels";
import SettingsTabV2 from "../../Tabs/SettingsTabV2";
import { collection } from "./TestUtils";

import ko from "knockout";

describe("SettingsComponent", () => {
  it("renders", () => {
    const settingsTabV2 = new SettingsTabV2({
      collection: collection,
      tabKind: ViewModels.CollectionTabKind.SettingsV2,
      title: "Scale & Settings",
      tabPath: "",
      node: undefined,
      selfLink: undefined,
      hashLocation: "settings",
      isActive: ko.observable(false),
      onUpdateTabsButtons: undefined
    });

    const props: SettingsComponentProps = {
      settingsTab: settingsTabV2
    };

    const wrapper = shallow(<SettingsComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
