export type Features = {
  // set only via feature flags
  readonly canExceedMaximumValue: boolean;
  readonly cosmosdb: boolean;
  readonly enableChangeFeedPolicy: boolean;
  readonly enableFixedCollectionWithSharedThroughput: boolean;
  readonly enableKOPanel: boolean;
  readonly enableReactPane: boolean;
  readonly enableRightPanelV2: boolean;
  readonly enableSDKoperations: boolean;
  readonly enableSpark: boolean;
  readonly enableTtl: boolean;
  readonly executeSproc: boolean;
  readonly enableAadDataPlane: boolean;
  readonly enableResourceGraph: boolean;
  readonly enableKoResourceTree: boolean;
  readonly enableThroughputBuckets: boolean;
  readonly hostedDataExplorer: boolean;
  readonly selfServeType?: string;
  readonly showMinRUSurvey: boolean;
  readonly ttl90Days: boolean;
  readonly mongoProxyEndpoint?: string;
  readonly mongoProxyAPIs?: string;
  readonly enableThroughputCap: boolean;
  readonly enableHierarchicalKeys: boolean;
  readonly enablePriorityBasedExecution: boolean;
  readonly disableConnectionStringLogin: boolean;
  readonly enableContainerCopy: boolean;
  readonly enableCloudShell: boolean;
  readonly enableCosmosDBShell: boolean;
  readonly enableRestoreContainer: boolean; // only for Fabric
  readonly mongoDisableNativeAuth: boolean;

  // can be set via both flight and feature flag
  autoscaleDefault: boolean;
  partitionKeyDefault: boolean;
  partitionKeyDefault2: boolean;
};

export function extractFeatures(given = new URLSearchParams(window.location.search)): Features {
  const downcased = new URLSearchParams();
  const set = (value: string, key: string) => {
    downcased.set(key.toLowerCase(), value);
  };
  const get = (key: string, defaultValue?: string) =>
    downcased.get("feature." + key) ?? downcased.get(key) ?? defaultValue;

  try {
    new URLSearchParams(window.parent.location.search).forEach(set);
  } catch {
    //
  } finally {
    given.forEach(set);
  }

  return {
    canExceedMaximumValue: "true" === get("canexceedmaximumvalue"),
    cosmosdb: "true" === get("cosmosdb"),
    enableAadDataPlane: "true" === get("enableaaddataplane"),
    enableResourceGraph: "true" === get("enableresourcegraph"),
    enableChangeFeedPolicy: "true" === get("enablechangefeedpolicy"),
    enableFixedCollectionWithSharedThroughput: "true" === get("enablefixedcollectionwithsharedthroughput"),
    enableKOPanel: "true" === get("enablekopanel"),
    enableReactPane: "true" === get("enablereactpane"),
    enableRightPanelV2: "true" === get("enablerightpanelv2"),
    enableSDKoperations: "true" === get("enablesdkoperations"),
    enableSpark: "true" === get("enablespark"),
    enableTtl: "true" === get("enablettl"),
    enableKoResourceTree: "true" === get("enablekoresourcetree"),
    enableThroughputBuckets: "true" === get("enablethroughputbuckets"),
    executeSproc: "true" === get("dataexplorerexecutesproc"),
    hostedDataExplorer: "true" === get("hosteddataexplorerenabled"),
    mongoProxyEndpoint: get("mongoproxyendpoint"),
    mongoProxyAPIs: get("mongoproxyapis"),
    selfServeType: get("selfservetype"),
    showMinRUSurvey: "true" === get("showminrusurvey"),
    ttl90Days: "true" === get("ttl90days"),
    autoscaleDefault: "true" === get("autoscaledefault"),
    partitionKeyDefault: "true" === get("partitionkeytest"),
    partitionKeyDefault2: "true" === get("pkpartitionkeytest"),
    enableThroughputCap: "true" === get("enablethroughputcap"),
    enableHierarchicalKeys: "true" === get("enablehierarchicalkeys"),
    enablePriorityBasedExecution: "true" === get("enableprioritybasedexecution"),
    disableConnectionStringLogin: "true" === get("disableconnectionstringlogin"),
    enableContainerCopy: "true" === get("enablecontainercopy"),
    enableRestoreContainer: "true" === get("enablerestorecontainer"),
    enableCloudShell: true,
    enableCosmosDBShell: "true" === get("enablecosmosdbshell"),
    mongoDisableNativeAuth: "true" === get("mongodisablenativeauth"),
  };
}

export function hasFlag(flags: string | undefined, desiredFlag: string | undefined): boolean {
  if (!flags || !desiredFlag) {
    return false;
  }

  const features = flags.split("|");
  return features.find((feature) => feature === desiredFlag) ? true : false;
}
