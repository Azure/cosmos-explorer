export type Features = {
  readonly canExceedMaximumValue: boolean;
  readonly cosmosdb: boolean;
  readonly enableChangeFeedPolicy: boolean;
  readonly enableFixedCollectionWithSharedThroughput: boolean;
  readonly enableKOPanel: boolean;
  readonly enableNotebooks: boolean;
  readonly enableReactPane: boolean;
  readonly enableRightPanelV2: boolean;
  readonly enableSchema: boolean;
  autoscaleDefault: boolean;
  partitionKeyDefault: boolean;
  partitionKeyDefault2: boolean;
  phoenix: boolean;
  readonly enableSDKoperations: boolean;
  readonly enableSpark: boolean;
  readonly enableTtl: boolean;
  readonly executeSproc: boolean;
  readonly enableAadDataPlane: boolean;
  readonly enableKoResourceTree: boolean;
  readonly hostedDataExplorer: boolean;
  readonly junoEndpoint?: string;
  readonly livyEndpoint?: string;
  readonly notebookBasePath?: string;
  readonly notebookServerToken?: string;
  readonly notebookServerUrl?: string;
  readonly sandboxNotebookOutputs: boolean;
  readonly selfServeType?: string;
  readonly pr?: string;
  readonly showMinRUSurvey: boolean;
  readonly ttl90Days: boolean;
  readonly mongoProxyEndpoint: string | undefined;
  readonly mongoProxyAPIs: string | undefined;
  readonly notebooksTemporarilyDown: boolean;
};

export function extractFeatures(given = new URLSearchParams(window.location.search)): Features {
  const downcased = new URLSearchParams();
  const set = (value: string, key: string) => downcased.set(key.toLowerCase(), value);
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
    livyEndpoint: get("livyendpoint"),
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
    notebooksTemporarilyDown: "true" === get("notebookstemporarilydown", "true"),
    phoenix: "true" === get("phoenix"),
  };
}

export function hasFlag(flags: string | undefined, desiredFlag: string | undefined): boolean {
  if (!flags || !desiredFlag) {
    return false;
  }

  const features = flags.split("|");
  return features.find((feature) => feature === desiredFlag) ? true : false;
}
