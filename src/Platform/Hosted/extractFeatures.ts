export type Features = {
  // set only via feature flags
  readonly canExceedMaximumValue: boolean;
  readonly cosmosdb: boolean;
  readonly enableChangeFeedPolicy: boolean;
  readonly enableFixedCollectionWithSharedThroughput: boolean;
  readonly enableKOPanel: boolean;
  readonly enableNotebooks: boolean;
  readonly enableReactPane: boolean;
  readonly enableRightPanelV2: boolean;
  readonly enableSchema: boolean;
  readonly enableSDKoperations: boolean;
  readonly enableSpark: boolean;
  readonly enableTtl: boolean;
  readonly executeSproc: boolean;
  readonly enableAadDataPlane: boolean;
  readonly enableKoResourceTree: boolean;
  readonly hostedDataExplorer: boolean;
  readonly junoEndpoint?: string;
  readonly phoenixEndpoint?: string;
  readonly notebookBasePath?: string;
  readonly notebookServerToken?: string;
  readonly notebookServerUrl?: string;
  readonly sandboxNotebookOutputs: boolean;
  readonly selfServeType?: string;
  readonly pr?: string;
  readonly showMinRUSurvey: boolean;
  readonly ttl90Days: boolean;
  readonly mongoProxyEndpoint?: string;
  readonly mongoProxyAPIs?: string;
  readonly enableThroughputCap: boolean;
  readonly enableHierarchicalKeys: boolean;
  readonly enableLegacyMongoShellV1: boolean;
  readonly enableLegacyMongoShellV1Debug: boolean;
  readonly enableLegacyMongoShellV2: boolean;
  readonly enableLegacyMongoShellV2Debug: boolean;
  readonly loadLegacyMongoShellFromBE: boolean;
  readonly enableCopilot: boolean;
  readonly copilotVersion?: string;
  readonly disableCopilotPhoenixGateaway: boolean;
  readonly enableCopilotFullSchema: boolean;
  readonly copilotChatFixedMonacoEditorHeight: boolean;
  readonly enablePriorityBasedExecution: boolean;

  // can be set via both flight and feature flag
  autoscaleDefault: boolean;
  partitionKeyDefault: boolean;
  partitionKeyDefault2: boolean;
  phoenixNotebooks?: boolean;
  phoenixFeatures?: boolean;
  notebooksDownBanner: boolean;
  publicGallery?: boolean;
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
    enableChangeFeedPolicy: "true" === get("enablechangefeedpolicy"),
    enableFixedCollectionWithSharedThroughput: "true" === get("enablefixedcollectionwithsharedthroughput"),
    enableKOPanel: "true" === get("enablekopanel"),
    enableNotebooks: "true" === get("enablenotebooks"),
    enableReactPane: "true" === get("enablereactpane"),
    enableRightPanelV2: "true" === get("enablerightpanelv2"),
    enableSchema: "true" === get("enableschema"),
    enableSDKoperations: "true" === get("enablesdkoperations"),
    enableSpark: "true" === get("enablespark"),
    enableTtl: "true" === get("enablettl"),
    enableKoResourceTree: "true" === get("enablekoresourcetree"),
    executeSproc: "true" === get("dataexplorerexecutesproc"),
    hostedDataExplorer: "true" === get("hosteddataexplorerenabled"),
    mongoProxyEndpoint: get("mongoproxyendpoint"),
    mongoProxyAPIs: get("mongoproxyapis"),
    junoEndpoint: get("junoendpoint"),
    phoenixEndpoint: get("phoenixendpoint"),
    notebookBasePath: get("notebookbasepath"),
    notebookServerToken: get("notebookservertoken"),
    notebookServerUrl: get("notebookserverurl"),
    sandboxNotebookOutputs: "true" === get("sandboxnotebookoutputs", "true"),
    selfServeType: get("selfservetype"),
    pr: get("pr"),
    showMinRUSurvey: "true" === get("showminrusurvey"),
    ttl90Days: "true" === get("ttl90days"),
    autoscaleDefault: "true" === get("autoscaledefault"),
    partitionKeyDefault: "true" === get("partitionkeytest"),
    partitionKeyDefault2: "true" === get("pkpartitionkeytest"),
    notebooksDownBanner: "true" === get("notebooksDownBanner"),
    enableThroughputCap: "true" === get("enablethroughputcap"),
    enableHierarchicalKeys: "true" === get("enablehierarchicalkeys"),
    enableLegacyMongoShellV1: "true" === get("enablelegacymongoshellv1"),
    enableLegacyMongoShellV1Debug: "true" === get("enablelegacymongoshellv1debug"),
    enableLegacyMongoShellV2: "true" === get("enablelegacymongoshellv2"),
    enableLegacyMongoShellV2Debug: "true" === get("enablelegacymongoshellv2debug"),
    loadLegacyMongoShellFromBE: "true" === get("loadlegacymongoshellfrombe"),
    enableCopilot: "true" === get("enablecopilot", "true"),
    copilotVersion: get("copilotversion") ?? "v1.0",
    disableCopilotPhoenixGateaway: "true" === get("disablecopilotphoenixgateaway"),
    enableCopilotFullSchema: "true" === get("enablecopilotfullschema", "true"),
    copilotChatFixedMonacoEditorHeight: "true" === get("copilotchatfixedmonacoeditorheight"),
    enablePriorityBasedExecution: "true" === get("enableprioritybasedexecution"),
  };
}

export function hasFlag(flags: string | undefined, desiredFlag: string | undefined): boolean {
  if (!flags || !desiredFlag) {
    return false;
  }

  const features = flags.split("|");
  return features.find((feature) => feature === desiredFlag) ? true : false;
}
