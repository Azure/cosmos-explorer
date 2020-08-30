import { shallow } from "enzyme";
import React from "react";
import { SettingsComponentProps, SettingsComponent } from "./SettingsComponent";
import * as DataModels from "../../../Contracts/DataModels";
import * as ViewModels from "../../../Contracts/ViewModels";
import ko from "knockout";
import Explorer from "../../Explorer";
import SettingsTabV2 from "../../Tabs/SettingsTabV2";

describe("SettingsComponent", () => {
  let settingsTabV2: SettingsTabV2;
  const mockedGetTabIdFn = jest.fn();
  mockedGetTabIdFn.mockReturnValue("tabId");

  it("renders", () => {
    settingsTabV2 = new SettingsTabV2({
      tabKind: ViewModels.CollectionTabKind.SettingsV2,
      title: "Scale & Settings",
      tabPath: "",
      collection: {
        container: new Explorer({
          notificationsClient: undefined,
          isEmulator: false
        }),
        databaseId: "test",
        id: ko.observable<string>("test"),
        defaultTtl: ko.observable<number>(5),
        analyticalStorageTtl: ko.observable<number>(5),
        indexingPolicy: ko.observable<DataModels.IndexingPolicy>({
          automatic: true,
          indexingMode: "default",
          includedPaths: [],
          excludedPaths: []
        }),
        uniqueKeyPolicy: {} as DataModels.UniqueKeyPolicy,
        quotaInfo: ko.observable<DataModels.CollectionQuotaInfo>({} as DataModels.CollectionQuotaInfo),
        offer: ko.observable<DataModels.Offer>({} as DataModels.Offer),
        conflictResolutionPolicy: ko.observable<DataModels.ConflictResolutionPolicy>(
          {} as DataModels.ConflictResolutionPolicy
        ),
        changeFeedPolicy: ko.observable<DataModels.ChangeFeedPolicy>({} as DataModels.ChangeFeedPolicy),
        geospatialConfig: ko.observable<DataModels.GeospatialConfig>({} as DataModels.GeospatialConfig),
        getDatabase: () => undefined
      } as ViewModels.Collection,
      node: undefined,
      selfLink: undefined,
      hashLocation: "settings",
      isActive: ko.observable(false),
      onUpdateTabsButtons: undefined
    });

    settingsTabV2.getTabId = mockedGetTabIdFn;

    const props: SettingsComponentProps = {
      settingsTab: settingsTabV2
    };

    const wrapper = shallow(<SettingsComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
