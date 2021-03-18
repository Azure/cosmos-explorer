export type Features = {
  notebookServerUrl?: string;
  notebookServerToken?: string;
  notebookBasePath?: string;
  livyEndpoint?: string;
  enableChangeFeedPolicy: boolean;
  enableNotebooks: boolean;
  enableSpark: boolean;
  canExceedMaximumValue: boolean;
  enableFixedCollectionWithSharedThroughput: boolean;
  ttl90Days: boolean;
  enableRightPanelV2: boolean;
  enableSchema: boolean;
  enableSDKoperations: boolean;
  showMinRUSurvey: boolean;
  enableDatabaseSettingsTabV1: boolean;
  enableKOPanel: boolean;
  enableReactPane: boolean;
};

export function extractFeatures(params?: URLSearchParams): Features {
  params = params || new URLSearchParams(window.parent.location.search);
  const downcased = new URLSearchParams();
  params.forEach((value, key) => downcased.append(key.toLocaleLowerCase(), value));
  const get = (key: string) => [...downcased.getAll("feature." + key.toLocaleLowerCase())].pop();

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
