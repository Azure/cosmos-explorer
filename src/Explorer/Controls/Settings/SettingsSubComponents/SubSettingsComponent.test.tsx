import { shallow } from "enzyme";
import React from "react";
import { SubSettingsComponent, SubSettingsComponentProps } from "./SubSettingsComponent";
import { container, collection } from "../TestUtils";
import { StatefulValue } from "../../StatefulValue/StatefulValue";
import { TtlType, GeospatialConfigType, ChangeFeedPolicyState } from "../SettingsUtils";
import ko from "knockout";

describe("SubSettingsComponent", () => {
  container.isPreferredApiDocumentDB = ko.computed(() => true);

  const baseProps: SubSettingsComponentProps = {
    collection: collection,
    container: container,

    timeToLive: new StatefulValue<TtlType>(TtlType.On),
    onTtlChange: () => {
      return;
    },
    onTtlFocusChange: () => {
      return;
    },
    timeToLiveSeconds: new StatefulValue<number>(1000),
    onTimeToLiveSecondsChange: () => {
      return;
    },

    geospatialConfigType: new StatefulValue<GeospatialConfigType>(GeospatialConfigType.Geography),
    onGeoSpatialConfigTypeChange: () => {
      return;
    },

    isAnalyticalStorageEnabled: true,
    analyticalStorageTtlSelection: new StatefulValue<TtlType>(TtlType.On),
    onAnalyticalStorageTtlSelectionChange: () => {
      return;
    },
    analyticalStorageTtlSeconds: new StatefulValue<number>(2000),
    onAnalyticalStorageTtlSecondsChange: () => {
      return;
    },

    changeFeedPolicyVisible: true,
    changeFeedPolicy: new StatefulValue<ChangeFeedPolicyState>(ChangeFeedPolicyState.On),
    onChangeFeedPolicyChange: () => {
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
    const props = { ...baseProps };
    props.timeToLive.current = TtlType.Off;
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
    const props = { ...baseProps };
    props.analyticalStorageTtlSelection.current = TtlType.OnNoDefault;
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
});
