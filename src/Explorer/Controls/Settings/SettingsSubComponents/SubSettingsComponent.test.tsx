import { shallow } from "enzyme";
import React from "react";
import { SubSettingsComponent, SubSettingsComponentProps } from "./SubSettingsComponent";
import { container, collection } from "../TestUtils";
import { TtlType, GeospatialConfigType, ChangeFeedPolicyState } from "../SettingsUtils";
import ko from "knockout";
import Explorer from "../../../Explorer";

describe("SubSettingsComponent", () => {
  container.isPreferredApiDocumentDB = ko.computed(() => true);

  const baseProps: SubSettingsComponentProps = {
    collection: collection,
    container: container,

    timeToLive: TtlType.On,
    timeToLiveBaseline: TtlType.On,
    onTtlChange: () => {
      return;
    },
    timeToLiveSeconds: 1000,
    timeToLiveSecondsBaseline: 1000,
    onTimeToLiveSecondsChange: () => {
      return;
    },

    geospatialConfigType: GeospatialConfigType.Geography,
    geospatialConfigTypeBaseline: GeospatialConfigType.Geography,
    onGeoSpatialConfigTypeChange: () => {
      return;
    },

    isAnalyticalStorageEnabled: true,
    analyticalStorageTtlSelection: TtlType.On,
    analyticalStorageTtlSelectionBaseline: TtlType.On,
    onAnalyticalStorageTtlSelectionChange: () => {
      return;
    },
    analyticalStorageTtlSeconds: 2000,
    analyticalStorageTtlSecondsBaseline: 2000,
    onAnalyticalStorageTtlSecondsChange: () => {
      return;
    },

    changeFeedPolicyVisible: true,
    changeFeedPolicy: ChangeFeedPolicyState.On,
    changeFeedPolicyBaseline: ChangeFeedPolicyState.On,

    onChangeFeedPolicyChange: () => {
      return;
    },
    onSubSettingsSaveableChange: () => {
      return;
    },
    onSubSettingsDiscardableChange: () => {
      return;
    }
  };

  it("renders", () => {
    const wrapper = shallow(<SubSettingsComponent {...baseProps} />);
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.exists("#timeToLive")).toEqual(true);
    expect(wrapper.exists("#timeToLiveSeconds")).toEqual(true);
    expect(wrapper.exists("#geoSpatialConfig")).toEqual(true);
    expect(wrapper.exists("#analyticalStorageTimeToLive")).toEqual(true);
    expect(wrapper.exists("#analyticalStorageTimeToLiveSeconds")).toEqual(true);
    expect(wrapper.exists("#changeFeedPolicy")).toEqual(true);
  });

  it("timeToLiveSeconds hidden", () => {
    const props = { ...baseProps, timeToLive: TtlType.Off };
    const wrapper = shallow(<SubSettingsComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.exists("#timeToLive")).toEqual(true);
    expect(wrapper.exists("#timeToLiveSeconds")).toEqual(false);
  });

  it("analyticalTimeToLive hidden", () => {
    const props = { ...baseProps, isAnalyticalStorageEnabled: false };
    const wrapper = shallow(<SubSettingsComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.exists("#analyticalStorageTimeToLive")).toEqual(false);
    expect(wrapper.exists("#analyticalStorageTimeToLiveSeconds")).toEqual(false);
  });

  it("analyticalTimeToLiveSeconds hidden", () => {
    const props = { ...baseProps, analyticalStorageTtlSelection: TtlType.OnNoDefault };
    const wrapper = shallow(<SubSettingsComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.exists("#analyticalStorageTimeToLive")).toEqual(true);
    expect(wrapper.exists("#analyticalStorageTimeToLiveSeconds")).toEqual(false);
  });

  it("changeFeedPolicy hidden", () => {
    const props = { ...baseProps, changeFeedPolicyVisible: false };
    const wrapper = shallow(<SubSettingsComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.exists("#changeFeedPolicy")).toEqual(false);
  });

  it("partitionKey is visible", () => {
    const subSettingsComponent = new SubSettingsComponent(baseProps);
    expect(subSettingsComponent.getPartitionKeyVisible()).toEqual(true);
  });

  it("partitionKey not visible", () => {
    const newContainer = new Explorer({
      notificationsClient: undefined,
      isEmulator: false
    });

    newContainer.isPreferredApiCassandra = ko.computed(() => true);
    const props = { ...baseProps, container: newContainer };
    const subSettingsComponent = new SubSettingsComponent(props);
    expect(subSettingsComponent.getPartitionKeyVisible()).toEqual(false);
  });

  it("largePartitionKey is enabled", () => {
    const subSettingsComponent = new SubSettingsComponent(baseProps);
    expect(subSettingsComponent.isLargePartitionKeyEnabled()).toEqual(true);
  });

  it("sub settings saveable and discardable are set", () => {
    let subSettingsComponent = new SubSettingsComponent(baseProps)
    let isComponentDirtyResult = subSettingsComponent.IsComponentDirty()
    expect(isComponentDirtyResult.isSaveable).toEqual(false)
    expect(isComponentDirtyResult.isDiscardable).toEqual(false)

    const newProps = {...baseProps, timeToLive: TtlType.OnNoDefault}
    subSettingsComponent = new SubSettingsComponent(newProps)
    isComponentDirtyResult = subSettingsComponent.IsComponentDirty()
    expect(isComponentDirtyResult.isSaveable).toEqual(true)
    expect(isComponentDirtyResult.isDiscardable).toEqual(true)
  });
});
