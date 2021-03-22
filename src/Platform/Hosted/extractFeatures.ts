export type Features = {
  readonly notebookServerUrl?: string;
  readonly notebookServerToken?: string;
  readonly notebookBasePath?: string;
  readonly livyEndpoint?: string;
  readonly enableChangeFeedPolicy: boolean;
  readonly enableNotebooks: boolean;
  readonly enableSpark: boolean;
  readonly canExceedMaximumValue: boolean;
  readonly enableFixedCollectionWithSharedThroughput: boolean;
  readonly ttl90Days: boolean;
  readonly enableRightPanelV2: boolean;
  readonly enableSchema: boolean;
  readonly enableSDKoperations: boolean;
  readonly showMinRUSurvey: boolean;
  readonly enableDatabaseSettingsTabV1: boolean;
  readonly enableKOPanel: boolean;
  readonly enableReactPane: boolean;
};

export function extractFeatures(params?: URLSearchParams): Features {
  params = params || new URLSearchParams(window.parent.location.search);
  const downcased = new URLSearchParams();
  params.forEach((value, key) => downcased.append(key.toLocaleLowerCase(), value));
  const get = (key: string) => downcased.get("feature." + key.toLocaleLowerCase()) ?? undefined;

  return {
    notebookServerUrl: get("notebookServerUrl"),
    notebookServerToken: get("notebookServerToken"),
    notebookBasePath: get("notebookBasePath"),
    livyEndpoint: get("livyEndpoint"),
    enableChangeFeedPolicy: "true" === get("enableChangeFeedPolicy"),
    enableNotebooks: "true" === get("enableNotebooks"),
    enableSpark: "true" === get("enableSpark"),
    canExceedMaximumValue: "true" === get("canExceedMaximumValue"),
    enableFixedCollectionWithSharedThroughput: "true" === get("enableFixedCollectionWithSharedThroughput"),
    ttl90Days: "true" === get("ttl90Days"),
    enableRightPanelV2: "true" === get("enableRightPanelV2"),
    enableSchema: "true" === get("enableSchema"),
    enableSDKoperations: "true" === get("enableSDKoperations"),
    showMinRUSurvey: "true" === get("showMinRUSurvey"),
    enableDatabaseSettingsTabV1: "true" === get("enableDatabaseSettingsTabV1"),
    enableKOPanel: "true" === get("enableKOPanel"),
    enableReactPane: "true" === get("enableReactPane"),
  };
}
