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
      userCanChangeProvisioningTypes: true,
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
      // Wait for the async refreshCollectionData to complete
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    wrapper.update();

    expect(wrapper.state("indexingPolicyContent")).toEqual(mockIndexingPolicy);
    expect(wrapper.state("indexingPolicyContentBaseline")).toEqual(mockIndexingPolicy);
    // @ts-expect-error: rawDataModel is intentionally accessed for test validation
    expect(instance.collection.rawDataModel.indexingPolicy).toEqual(mockIndexingPolicy);
  });
});
