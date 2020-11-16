import { shallow } from "enzyme";
import React from "react";
import { SettingsComponentProps, SettingsComponent, SettingsComponentState } from "./SettingsComponent";
import * as ViewModels from "../../../Contracts/ViewModels";
import SettingsTabV2 from "../../Tabs/SettingsTabV2";
import { collection } from "./TestUtils";
import * as DataModels from "../../../Contracts/DataModels";
import ko from "knockout";
import { TtlType, isDirty } from "./SettingsUtils";
import Explorer from "../../Explorer";
jest.mock("../../../Common/dataAccess/readMongoDBCollection", () => ({
  getMongoDBCollectionIndexTransformationProgress: jest.fn().mockReturnValue(undefined)
}));
import { updateCollection, updateMongoDBCollectionThroughRP } from "../../../Common/dataAccess/updateCollection";
jest.mock("../../../Common/dataAccess/updateCollection", () => ({
  updateCollection: jest.fn().mockReturnValue({
    id: undefined,
    defaultTtl: undefined,
    indexingPolicy: undefined,
    conflictResolutionPolicy: undefined,
    changeFeedPolicy: undefined,
    analyticalStorageTtl: undefined,
    geospatialConfig: undefined
  } as DataModels.Collection),
  updateMongoDBCollectionThroughRP: jest.fn().mockReturnValue({
    id: undefined,
    shardKey: undefined,
    indexes: [],
    analyticalStorageTtl: undefined
  } as MongoDBCollectionResource)
}));
import { updateOffer } from "../../../Common/dataAccess/updateOffer";
import { MongoDBCollectionResource } from "../../../Utils/arm/generatedClients/2020-04-01/types";
jest.mock("../../../Common/dataAccess/updateOffer", () => ({
  updateOffer: jest.fn().mockReturnValue({} as DataModels.Offer)
}));

describe("SettingsComponent", () => {
  const baseProps: SettingsComponentProps = {
    settingsTab: new SettingsTabV2({
      collection: collection,
      tabKind: ViewModels.CollectionTabKind.SettingsV2,
      title: "Scale & Settings",
      tabPath: "",
      node: undefined,
      hashLocation: "settings",
      isActive: ko.observable(false),
      onUpdateTabsButtons: undefined,
      getPendingNotification: Promise.resolve(undefined)
    })
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
      isSubSettingsDiscardable: true
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
      content: {
        offerAutopilotSettings: {
          maxThroughput: 10000
        }
      }
    } as DataModels.Offer);

    const props = { ...baseProps };
    props.settingsTab.collection = newCollection;

    const wrapper = shallow(<SettingsComponent {...props} />);
    const settingsComponentInstance = wrapper.instance() as SettingsComponent;
    expect(settingsComponentInstance.hasProvisioningTypeChanged()).toEqual(false);
    wrapper.setState({
      userCanChangeProvisioningTypes: true,
      isAutoPilotSelected: true,
      wasAutopilotOriginallySet: false,
      autoPilotThroughput: 1000
    });
    wrapper.update();
    expect(settingsComponentInstance.hasProvisioningTypeChanged()).toEqual(true);
  });

  it("shouldShowKeyspaceSharedThroughputMessage", () => {
    let settingsComponentInstance = new SettingsComponent(baseProps);
    expect(settingsComponentInstance.shouldShowKeyspaceSharedThroughputMessage()).toEqual(false);

    const newContainer = new Explorer();
    newContainer.isPreferredApiCassandra = ko.computed(() => true);

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
      selectDatabase: undefined,
      expandDatabase: undefined,
      collapseDatabase: undefined,
      loadCollections: undefined,
      findCollectionWithId: undefined,
      openAddCollection: undefined,
      onDeleteDatabaseContextMenuClick: undefined,
      readSettings: undefined,
      onSettingsClick: undefined,
      loadOffer: undefined
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
    newContainer.databaseAccount = ko.observable({
      id: undefined,
      name: undefined,
      location: undefined,
      type: undefined,
      kind: undefined,
      tags: undefined,
      properties: {
        documentEndpoint: undefined,
        tableEndpoint: undefined,
        gremlinEndpoint: undefined,
        cassandraEndpoint: undefined,
        enableMultipleWriteLocations: true
      }
    });
    const newCollection = { ...collection };
    newCollection.container = newContainer;
    newCollection.conflictResolutionPolicy = ko.observable({
      mode: DataModels.ConflictResolutionMode.Custom,
      conflictResolutionProcedure: undefined
    } as DataModels.ConflictResolutionPolicy);

    const props = { ...baseProps };
    props.settingsTab.collection = newCollection;

    settingsComponentInstance = new SettingsComponent(props);
    expect(settingsComponentInstance.hasConflictResolution()).toEqual(true);
  });

  it("isOfferReplacePending", () => {
    let settingsComponentInstance = new SettingsComponent(baseProps);
    expect(settingsComponentInstance.isOfferReplacePending()).toEqual(undefined);

    const newCollection = { ...collection };
    newCollection.offer = ko.observable({
      headers: { "x-ms-offer-replace-pending": true }
    } as DataModels.OfferWithHeaders);
    const props = { ...baseProps };
    props.settingsTab.collection = newCollection;

    settingsComponentInstance = new SettingsComponent(props);
    expect(settingsComponentInstance.isOfferReplacePending()).toEqual(true);
  });

  it("save calls updateCollection, updateMongoDBCollectionThroughRP and updateOffer", async () => {
    const wrapper = shallow(<SettingsComponent {...baseProps} />);
    wrapper.setState({ isSubSettingsSaveable: true, isScaleSaveable: true, isMongoIndexingPolicySaveable: true });
    wrapper.update();
    const settingsComponentInstance = wrapper.instance() as SettingsComponent;
    settingsComponentInstance.mongoDBCollectionResource = {
      id: "id"
    };
    await settingsComponentInstance.onSaveClick();
    expect(updateCollection).toBeCalled();
    expect(updateMongoDBCollectionThroughRP).toBeCalled();
    expect(updateOffer).toBeCalled();
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
    const conflictResolutionPolicyPath = "_ts";
    const conflictResolutionPolicyProcedure = "sample_sproc";
    const expectSprocPath =
      "/dbs/" + collection.databaseId + "/colls/" + collection.id() + "/sprocs/" + conflictResolutionPolicyProcedure;

    wrapper.setState({
      conflictResolutionPolicyMode: DataModels.ConflictResolutionMode.LastWriterWins,
      conflictResolutionPolicyPath: conflictResolutionPolicyPath
    });
    wrapper.update();
    const settingsComponentInstance = wrapper.instance() as SettingsComponent;
    let conflictResolutionPolicy = settingsComponentInstance.getUpdatedConflictResolutionPolicy();
    expect(conflictResolutionPolicy.mode).toEqual(DataModels.ConflictResolutionMode.LastWriterWins);
    expect(conflictResolutionPolicy.conflictResolutionPath).toEqual(conflictResolutionPolicyPath);

    wrapper.setState({
      conflictResolutionPolicyMode: DataModels.ConflictResolutionMode.Custom,
      conflictResolutionPolicyProcedure: conflictResolutionPolicyProcedure
    });
    wrapper.update();
    conflictResolutionPolicy = settingsComponentInstance.getUpdatedConflictResolutionPolicy();
    expect(conflictResolutionPolicy.mode).toEqual(DataModels.ConflictResolutionMode.Custom);
    expect(conflictResolutionPolicy.conflictResolutionProcedure).toEqual(expectSprocPath);
  });
});
