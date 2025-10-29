import { IndexingPolicy } from "@azure/cosmos";
import { act } from "@testing-library/react";
import { AuthType } from "AuthType";
import { shallow } from "enzyme";
import { useIndexingPolicyStore } from "Explorer/Tabs/QueryTab/ResultsView";
import ko from "knockout";
import React from "react";
import { updateCollection } from "../../../Common/dataAccess/updateCollection";
import { updateOffer } from "../../../Common/dataAccess/updateOffer";
import * as DataModels from "../../../Contracts/DataModels";
import * as ViewModels from "../../../Contracts/ViewModels";
import { updateUserContext } from "../../../UserContext";
import Explorer from "../../Explorer";
import { CollectionSettingsTabV2 } from "../../Tabs/SettingsTabV2";
import { SettingsComponent, SettingsComponentProps, SettingsComponentState } from "./SettingsComponent";
import { TtlType, isDirty } from "./SettingsUtils";
import { collection } from "./TestUtils";
jest.mock("../../../Common/dataAccess/getIndexTransformationProgress", () => ({
  getIndexTransformationProgress: jest.fn().mockReturnValue(undefined),
}));
jest.mock("../../../Common/dataAccess/updateCollection", () => ({
  updateCollection: jest.fn().mockReturnValue({
    id: undefined,
    defaultTtl: undefined,
    indexingPolicy: undefined,
    conflictResolutionPolicy: undefined,
    changeFeedPolicy: undefined,
    analyticalStorageTtl: undefined,
    geospatialConfig: undefined,
    dataMaskingPolicy: {
      includedPaths: [],
      excludedPaths: ["/excludedPath"],
      isPolicyEnabled: true,
    },
    indexes: [],
  }),
}));
jest.mock("../../../Common/dataAccess/updateOffer", () => ({
  updateOffer: jest.fn().mockReturnValue({} as DataModels.Offer),
}));

describe("SettingsComponent", () => {
  const baseProps: SettingsComponentProps = {
    settingsTab: new CollectionSettingsTabV2({
      collection: collection,
      tabKind: ViewModels.CollectionTabKind.CollectionSettingsV2,
      title: "Scale & Settings",
      tabPath: "",
      node: undefined,
    }),
  };

  it("renders", () => {
    const wrapper = shallow(<SettingsComponent {...baseProps} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("dirty value enables save button and discard button", () => {
    const wrapper = shallow(<SettingsComponent {...baseProps} />);
    const settingsComponentInstance = wrapper.instance() as SettingsComponent;
    expect(settingsComponentInstance.isSaveSettingsButtonEnabled()).toEqual(false);
    expect(settingsComponentInstance.isDiscardSettingsButtonEnabled()).toEqual(false);
    wrapper.setState({ isScaleSaveable: true, isScaleDiscardable: true });
    wrapper.update();
    expect(settingsComponentInstance.isSaveSettingsButtonEnabled()).toEqual(true);
    expect(settingsComponentInstance.isDiscardSettingsButtonEnabled()).toEqual(true);
    wrapper.setState({
      isScaleSaveable: false,
      isScaleDiscardable: false,
      isSubSettingsSaveable: true,
      isSubSettingsDiscardable: true,
    });
    wrapper.update();
    expect(settingsComponentInstance.isSaveSettingsButtonEnabled()).toEqual(true);
    expect(settingsComponentInstance.isDiscardSettingsButtonEnabled()).toEqual(true);
    wrapper.setState({ isSubSettingsSaveable: false, isSubSettingsDiscardable: false, isIndexingPolicyDirty: true });
    wrapper.update();
    expect(settingsComponentInstance.isSaveSettingsButtonEnabled()).toEqual(true);
    expect(settingsComponentInstance.isDiscardSettingsButtonEnabled()).toEqual(true);
    wrapper.setState({ isIndexingPolicyDirty: false, isConflictResolutionDirty: true });
    wrapper.update();
    expect(settingsComponentInstance.isSaveSettingsButtonEnabled()).toEqual(true);
    expect(settingsComponentInstance.isDiscardSettingsButtonEnabled()).toEqual(true);
  });

  it("auto pilot helper functions pass on correct value", () => {
    const newCollection = { ...collection };
    newCollection.offer = ko.observable<DataModels.Offer>({
      autoscaleMaxThroughput: 10000,
      manualThroughput: undefined,
      minimumThroughput: 400,
      id: "test",
      offerReplacePending: false,
    });

    const props = { ...baseProps };
    props.settingsTab.collection = newCollection;

    const wrapper = shallow(<SettingsComponent {...props} />);
    const settingsComponentInstance = wrapper.instance() as SettingsComponent;
    expect(settingsComponentInstance.hasProvisioningTypeChanged()).toEqual(false);
    wrapper.setState({
      isAutoPilotSelected: true,
      wasAutopilotOriginallySet: false,
      autoPilotThroughput: 1000,
    });
    wrapper.update();
    expect(settingsComponentInstance.hasProvisioningTypeChanged()).toEqual(true);
  });

  it("shouldShowKeyspaceSharedThroughputMessage", () => {
    let settingsComponentInstance = new SettingsComponent(baseProps);
    expect(settingsComponentInstance.shouldShowKeyspaceSharedThroughputMessage()).toEqual(false);

    const newContainer = new Explorer();
    updateUserContext({
      databaseAccount: {
        properties: {
          capabilities: [{ name: "EnableCassandra" }],
        },
      } as DataModels.DatabaseAccount,
    });

    const newCollection = { ...collection };
    newCollection.container = newContainer;
    const newDatabase = {
      nodeKind: undefined,
      rid: undefined,
      container: newContainer,
      self: undefined,
      id: undefined,
      collections: undefined,
      offer: undefined,
      isDatabaseExpanded: undefined,
      isDatabaseShared: ko.computed(() => true),
      selectedSubnodeKind: undefined,
      expandDatabase: undefined,
      collapseDatabase: undefined,
      loadCollections: undefined,
      findCollectionWithId: undefined,
      openAddCollection: undefined,
      readSettings: undefined,
      onSettingsClick: undefined,
      loadOffer: undefined,
    } as ViewModels.Database;
    newCollection.getDatabase = () => newDatabase;
    newCollection.offer = ko.observable(undefined);

    const props = { ...baseProps };
    props.settingsTab.collection = newCollection;

    settingsComponentInstance = new SettingsComponent(props);
    expect(settingsComponentInstance.shouldShowKeyspaceSharedThroughputMessage()).toEqual(true);
  });

  it("hasConflictResolution", () => {
    let settingsComponentInstance = new SettingsComponent(baseProps);
    expect(settingsComponentInstance.hasConflictResolution()).toEqual(undefined);

    const newContainer = new Explorer();
    updateUserContext({
      databaseAccount: {
        id: undefined,
        name: undefined,
        location: undefined,
        type: undefined,
        kind: undefined,
        properties: {
          documentEndpoint: undefined,
          tableEndpoint: undefined,
          gremlinEndpoint: undefined,
          cassandraEndpoint: undefined,
          enableMultipleWriteLocations: true,
        },
      },
    });
    const newCollection = { ...collection };
    newCollection.container = newContainer;
    newCollection.conflictResolutionPolicy = ko.observable({
      mode: DataModels.ConflictResolutionMode.Custom,
      conflictResolutionProcedure: undefined,
    } as DataModels.ConflictResolutionPolicy);

    const props = { ...baseProps };
    props.settingsTab.collection = newCollection;

    settingsComponentInstance = new SettingsComponent(props);
    expect(settingsComponentInstance.hasConflictResolution()).toEqual(true);
  });

  it("save calls updateCollection, updateMongoDBCollectionThroughRP and updateOffer", async () => {
    const wrapper = shallow(<SettingsComponent {...baseProps} />);
    wrapper.setState({ isSubSettingsSaveable: true, isScaleSaveable: true, isMongoIndexingPolicySaveable: true });
    wrapper.update();
    const settingsComponentInstance = wrapper.instance() as SettingsComponent;
    settingsComponentInstance.mongoDBCollectionResource = {
      id: "id",
    };
    await settingsComponentInstance.onSaveClick();
    expect(updateCollection).toHaveBeenCalled();
    expect(updateOffer).toHaveBeenCalled();
  });

  it("revert resets state values", async () => {
    const wrapper = shallow(<SettingsComponent {...baseProps} />);
    wrapper.setState({ timeToLive: TtlType.OnNoDefault, throughput: 10 });
    wrapper.update();
    let state = wrapper.state() as SettingsComponentState;
    expect(isDirty(state.timeToLive, state.timeToLiveBaseline)).toEqual(true);
    expect(isDirty(state.throughput, state.throughputBaseline)).toEqual(true);

    const settingsComponentInstance = wrapper.instance() as SettingsComponent;
    settingsComponentInstance.onRevertClick();
    state = wrapper.state() as SettingsComponentState;
    expect(isDirty(state.timeToLive, state.timeToLiveBaseline)).toEqual(false);
    expect(isDirty(state.throughput, state.throughputBaseline)).toEqual(false);
  });

  it("getAnalyticalStorageTtl", () => {
    const newCollection = { ...collection };
    newCollection.analyticalStorageTtl = ko.observable(10);
    const props = { ...baseProps };
    props.settingsTab.collection = newCollection;
    const wrapper = shallow(<SettingsComponent {...props} />);
    const settingsComponentInstance = wrapper.instance() as SettingsComponent;
    expect(settingsComponentInstance.getAnalyticalStorageTtl()).toEqual(10);
    wrapper.setState({ analyticalStorageTtlSelection: TtlType.Off });
    wrapper.update();
    expect(settingsComponentInstance.getAnalyticalStorageTtl()).toEqual(-1);
  });

  it("getUpdatedConflictResolutionPolicy", () => {
    const wrapper = shallow(<SettingsComponent {...baseProps} />);
    const conflictResolutionPolicyPath = "/_ts";
    const conflictResolutionPolicyProcedure = "sample_sproc";
    const expectSprocPath =
      "/dbs/" + collection.databaseId + "/colls/" + collection.id() + "/sprocs/" + conflictResolutionPolicyProcedure;

    wrapper.setState({
      conflictResolutionPolicyMode: DataModels.ConflictResolutionMode.LastWriterWins,
      conflictResolutionPolicyPath: conflictResolutionPolicyPath,
    });
    wrapper.update();
    const settingsComponentInstance = wrapper.instance() as SettingsComponent;
    let conflictResolutionPolicy = settingsComponentInstance.getUpdatedConflictResolutionPolicy();
    expect(conflictResolutionPolicy.mode).toEqual(DataModels.ConflictResolutionMode.LastWriterWins);
    expect(conflictResolutionPolicy.conflictResolutionPath).toEqual(conflictResolutionPolicyPath);

    wrapper.setState({
      conflictResolutionPolicyMode: DataModels.ConflictResolutionMode.Custom,
      conflictResolutionPolicyProcedure: conflictResolutionPolicyProcedure,
    });
    wrapper.update();
    conflictResolutionPolicy = settingsComponentInstance.getUpdatedConflictResolutionPolicy();
    expect(conflictResolutionPolicy.mode).toEqual(DataModels.ConflictResolutionMode.Custom);
    expect(conflictResolutionPolicy.conflictResolutionProcedure).toEqual(expectSprocPath);
  });

  it("should save throughput bucket changes when Save button is clicked", async () => {
    updateUserContext({
      apiType: "SQL",
      throughputBucketsEnabled: true,
      authType: AuthType.AAD,
    });

    const wrapper = shallow(<SettingsComponent {...baseProps} />);

    const settingsComponentInstance = wrapper.instance() as SettingsComponent;
    const isEnabled = settingsComponentInstance["throughputBucketsEnabled"];
    expect(isEnabled).toBe(true);

    wrapper.setState({
      isThroughputBucketsSaveable: true,
      throughputBuckets: [
        { id: 1, maxThroughputPercentage: 70 },
        { id: 2, maxThroughputPercentage: 60 },
      ],
    });

    await settingsComponentInstance.onSaveClick();

    expect(updateOffer).toHaveBeenCalledWith({
      databaseId: collection.databaseId,
      collectionId: collection.id(),
      currentOffer: expect.any(Object),
      autopilotThroughput: collection.offer().autoscaleMaxThroughput,
      manualThroughput: collection.offer().manualThroughput,
      throughputBuckets: [
        { id: 1, maxThroughputPercentage: 70 },
        { id: 2, maxThroughputPercentage: 60 },
      ],
    });

    expect(wrapper.state("isThroughputBucketsSaveable")).toBe(false);
  });

  it("should handle data masking policy updates correctly", async () => {
    updateUserContext({
      apiType: "SQL",
      authType: AuthType.AAD,
    });

    const wrapper = shallow(<SettingsComponent {...baseProps} />);
    const settingsComponentInstance = wrapper.instance() as SettingsComponent;

    wrapper.setState({
      dataMaskingContent: {
        includedPaths: [],
        excludedPaths: ["/excludedPath"],
        isPolicyEnabled: true,
      },
      dataMaskingContentBaseline: {
        includedPaths: [],
        excludedPaths: [],
        isPolicyEnabled: false,
      },
      isDataMaskingDirty: true,
    });

    await settingsComponentInstance.onSaveClick();

    // The test needs to match what onDataMaskingContentChange returns
    expect(updateCollection).toHaveBeenCalled();

    expect(wrapper.state("isDataMaskingDirty")).toBe(false);
    expect(wrapper.state("dataMaskingContentBaseline")).toEqual({
      includedPaths: [],
      excludedPaths: ["/excludedPath"],
      isPolicyEnabled: true,
    });
  });

  it("should validate data masking policy content", () => {
    const wrapper = shallow(<SettingsComponent {...baseProps} />);
    const settingsComponentInstance = wrapper.instance() as SettingsComponent;

    // Test with invalid data structure
    // Use invalid data type for testing validation
    type InvalidPolicy = Omit<DataModels.DataMaskingPolicy, "includedPaths"> & { includedPaths: string };
    const invalidPolicy: InvalidPolicy = {
      includedPaths: "invalid",
      excludedPaths: [],
      isPolicyEnabled: false,
    };
    // Use type assertion since we're deliberately testing with invalid data
    settingsComponentInstance["onDataMaskingContentChange"](invalidPolicy as unknown as DataModels.DataMaskingPolicy);

    // State should update with the content but also set validation errors
    expect(wrapper.state("dataMaskingContent")).toEqual({
      includedPaths: "invalid",
      excludedPaths: [],
      isPolicyEnabled: false,
    });
    expect(wrapper.state("dataMaskingValidationErrors")).toEqual(["includedPaths must be an array"]);

    // Test with valid data
    const validPolicy = {
      includedPaths: [
        {
          path: "/path1",
          strategy: "mask",
          startPosition: 0,
          length: 4,
        },
      ],
      excludedPaths: ["/excludedPath"],
      isPolicyEnabled: true,
    };

    settingsComponentInstance["onDataMaskingContentChange"](validPolicy);

    // State should update with valid data and no validation errors
    expect(wrapper.state("dataMaskingContent")).toEqual(validPolicy);
    expect(wrapper.state("dataMaskingValidationErrors")).toEqual([]);
  });

  it("should handle data masking discard correctly", () => {
    const wrapper = shallow(<SettingsComponent {...baseProps} />);
    const settingsComponentInstance = wrapper.instance() as SettingsComponent;

    const baselinePolicy = {
      includedPaths: [
        {
          path: "/basePath",
          strategy: "mask",
          startPosition: 0,
          length: 4,
        },
      ],
      excludedPaths: ["/excludedPath1"],
      isPolicyEnabled: false,
    };

    const modifiedPolicy = {
      includedPaths: [
        {
          path: "/newPath",
          strategy: "mask",
          startPosition: 1,
          length: 5,
        },
      ],
      excludedPaths: ["/excludedPath2"],
      isPolicyEnabled: true,
    };

    // Set initial state
    wrapper.setState({
      dataMaskingContent: modifiedPolicy,
      dataMaskingContentBaseline: baselinePolicy,
      isDataMaskingDirty: true,
    });

    // Call revert
    settingsComponentInstance.onRevertClick();

    // Verify state is reset
    expect(wrapper.state("dataMaskingContent")).toEqual(baselinePolicy);
    expect(wrapper.state("isDataMaskingDirty")).toBe(false);
    expect(wrapper.state("shouldDiscardDataMasking")).toBe(true);
  });

  it("should disable save button when data masking has validation errors", () => {
    const wrapper = shallow(<SettingsComponent {...baseProps} />);
    const settingsComponentInstance = wrapper.instance() as SettingsComponent;

    // Initially, save button should be disabled
    expect(settingsComponentInstance.isSaveSettingsButtonEnabled()).toBe(false);

    // Make data masking dirty with valid data
    wrapper.setState({
      isDataMaskingDirty: true,
      dataMaskingValidationErrors: [],
    });
    expect(settingsComponentInstance.isSaveSettingsButtonEnabled()).toBe(true);

    // Add validation errors - save should be disabled
    wrapper.setState({
      dataMaskingValidationErrors: ["includedPaths must be an array"],
    });
    expect(settingsComponentInstance.isSaveSettingsButtonEnabled()).toBe(false);

    // Clear validation errors - save should be enabled again
    wrapper.setState({
      dataMaskingValidationErrors: [],
    });
    expect(settingsComponentInstance.isSaveSettingsButtonEnabled()).toBe(true);
  });
});

describe("SettingsComponent - indexing policy subscription", () => {
  const baseProps: SettingsComponentProps = {
    settingsTab: new CollectionSettingsTabV2({
      collection: collection,
      tabKind: ViewModels.CollectionTabKind.CollectionSettingsV2,
      title: "Scale & Settings",
      tabPath: "",
      node: undefined,
    }),
  };

  it("subscribes to the correct container's indexing policy and updates state on change", async () => {
    const containerId = collection.id();
    const mockIndexingPolicy: IndexingPolicy = {
      automatic: false,
      indexingMode: "lazy",
      includedPaths: [{ path: "/foo/*" }],
      excludedPaths: [{ path: "/bar/*" }],
      compositeIndexes: [],
      spatialIndexes: [],
      vectorIndexes: [],
      fullTextIndexes: [],
    };

    const wrapper = shallow(<SettingsComponent {...baseProps} />);
    const instance = wrapper.instance() as SettingsComponent;

    await act(async () => {
      useIndexingPolicyStore.setState({
        indexingPolicies: {
          [containerId]: mockIndexingPolicy,
        },
      });
    });

    wrapper.update();

    expect(wrapper.state("indexingPolicyContent")).toEqual(mockIndexingPolicy);
    expect(wrapper.state("indexingPolicyContentBaseline")).toEqual(mockIndexingPolicy);
    // @ts-expect-error: rawDataModel is intentionally accessed for test validation
    expect(instance.collection.rawDataModel.indexingPolicy).toEqual(mockIndexingPolicy);
  });
});
