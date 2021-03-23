export type Features = {
  readonly canExceedMaximumValue: boolean;
  readonly cosmosdb: boolean;
  readonly enableChangeFeedPolicy: boolean;
  readonly enableDatabaseSettingsTabV1: boolean;
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
  readonly hostedDataExplorer: boolean;
  readonly livyEndpoint?: string;
  readonly notebookBasePath?: string;
  readonly notebookServerToken?: string;
  readonly notebookServerUrl?: string;
  readonly selfServeType?: string;
  readonly showMinRUSurvey: boolean;
  readonly ttl90Days: boolean;
};

export function extractFeatures(params?: URLSearchParams): Features {
  params = params || new URLSearchParams(window.parent.location.search);
  const downcased = new URLSearchParams();
  params.forEach((value, key) => downcased.append(key.toLocaleLowerCase(), value));
  const get = (key: string) => downcased.get("feature." + key.toLocaleLowerCase()) ?? undefined;

  return {
    canExceedMaximumValue: "true" === get("canexceedmaximumvalue"),
    cosmosdb: "true" === get("cosmosdb"),
    enableChangeFeedPolicy: "true" === get("enablechangefeedpolicy"),
    enableDatabaseSettingsTabV1: "true" === get("enabledbsettingsv1"),
    enableFixedCollectionWithSharedThroughput: "true" === get("enablefixedcollectionwithsharedthroughput"),
    enableKOPanel: "true" === get("enablekopanel"),
    enableNotebooks: "true" === get("enablenotebooks"),
    enableReactPane: "true" === get("enablereactpane"),
    enableRightPanelV2: "true" === get("enablerightpanelv2"),
    enableSchema: "true" === get("enableschema"),
    enableSDKoperations: "true" === get("enablesdkoperations"),
    enableSpark: "true" === get("enablespark"),
    enableTtl: "true" === get("enablettl"),
    executeSproc: "true" === get("dataexplorerexecutesproc"),
    hostedDataExplorer: "true" === get("hosteddataexplorerenabled"),
    livyEndpoint: get("livyendpoint"),
    notebookBasePath: get("notebookbasepath"),
    notebookServerToken: get("notebookservertoken"),
    notebookServerUrl: get("notebookserverurl"),
    selfServeType: get("selfservetype"),
    showMinRUSurvey: "true" === get("showminrusurvey"),
    ttl90Days: "true" === get("ttl90days"),
  };
}
