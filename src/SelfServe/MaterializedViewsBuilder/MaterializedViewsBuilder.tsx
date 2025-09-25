import { IsDisplayable, OnChange, PropertyInfo, RefreshOptions, Values } from "../Decorators";
import {
  selfServeTrace,
  selfServeTraceFailure,
  selfServeTraceStart,
  selfServeTraceSuccess,
} from "../SelfServeTelemetryProcessor";
import {
  Description,
  DescriptionType,
  Info,
  InputType,
  NumberUiType,
  OnSaveResult,
  RefreshResult,
  SelfServeBaseClass,
  SmartUiInput,
} from "../SelfServeTypes";

import type { ChoiceItem } from "../SelfServeTypes";

import { BladeType, generateBladeLink, SelfServeType } from "../SelfServeUtils";
import {
  deleteMaterializedViewsBuilderResource,
  getCurrentProvisioningState,
  getPriceMapAndCurrencyCode,
  getRegions,
  refreshMaterializedViewsBuilderProvisioning,
  updateMaterializedViewsBuilderResource,
} from "./MaterializedViewsBuilder.rp";

import { userContext } from "../../UserContext";

const costPerHourDefaultValue: Description = {
  textTKey: userContext.apiType === "SQL" ? "GlobalsecondaryindexesCostText" : "CostText",
  type: DescriptionType.Text,
  link: {
    href: "https://aka.ms/cosmos-db-materializedviewsbuilder-pricing",
    textTKey:
      userContext.apiType === "SQL" ? "GlobalsecondaryindexesBuilderPricing" : "MaterializedviewsBuilderPricing",
  },
};

const metricsStringValue: Description = {
  textTKey: userContext.apiType === "SQL" ? "GlobalsecondaryindexesMetricsText" : "MetricsText",
  type: DescriptionType.Text,
  link: {
    href: generateBladeLink(BladeType.Metrics),
    textTKey: "MetricsBlade",
  },
};

const CosmosD2s = "Cosmos.D2s";
const CosmosD4s = "Cosmos.D4s";
const CosmosD8s = "Cosmos.D8s";
const CosmosD16s = "Cosmos.D16s";

const onSKUChange = (newValue: InputType, currentValues: Map<string, SmartUiInput>): Map<string, SmartUiInput> => {
  currentValues.set("sku", { value: newValue });
  currentValues.set("costPerHour", {
    value: calculateCost(newValue as string, currentValues.get("instances").value as number),
  });

  return currentValues;
};

const onNumberOfInstancesChange = (
  newValue: InputType,
  currentValues: Map<string, SmartUiInput>,
  baselineValues: Map<string, SmartUiInput>,
): Map<string, SmartUiInput> => {
  currentValues.set("instances", { value: newValue });
  const MaterializedViewsBuilderOriginallyEnabled = baselineValues.get("enableMaterializedViewsBuilder")
    ?.value as boolean;
  const baselineInstances = baselineValues.get("instances")?.value as number;
  if (!MaterializedViewsBuilderOriginallyEnabled || baselineInstances !== newValue) {
    currentValues.set("warningBanner", {
      value: {
        textTKey: "WarningBannerOnUpdate",
        link: {
          href: "https://aka.ms/cosmos-db-materializedviewsbuilder-pricing",
          textTKey:
            userContext.apiType === "SQL" ? "GlobalsecondaryindexesBuilderPricing" : "MaterializedviewsBuilderPricing",
        },
      } as Description,
      hidden: false,
    });
  } else {
    currentValues.set("warningBanner", undefined);
  }

  currentValues.set("costPerHour", {
    value: calculateCost(currentValues.get("sku").value as string, newValue as number),
  });

  return currentValues;
};

const onEnableMaterializedViewsBuilderChange = (
  newValue: InputType,
  currentValues: Map<string, SmartUiInput>,
  baselineValues: ReadonlyMap<string, SmartUiInput>,
): Map<string, SmartUiInput> => {
  currentValues.set("enableMaterializedViewsBuilder", { value: newValue });
  const MaterializedViewsBuilderOriginallyEnabled = baselineValues.get("enableMaterializedViewsBuilder")
    ?.value as boolean;
  if (MaterializedViewsBuilderOriginallyEnabled === newValue) {
    currentValues.set("sku", baselineValues.get("sku"));
    currentValues.set("instances", baselineValues.get("instances"));
    currentValues.set("costPerHour", baselineValues.get("costPerHour"));
    currentValues.set("warningBanner", baselineValues.get("warningBanner"));
    currentValues.set("metricsString", baselineValues.get("metricsString"));
    return currentValues;
  }

  currentValues.set("warningBanner", undefined);
  if (newValue === true) {
    currentValues.set("warningBanner", {
      value: {
        textTKey: "WarningBannerOnUpdate",
        link: {
          href: "https://aka.ms/cosmos-db-materializedviewsbuilder-pricing",
          textTKey:
            userContext.apiType === "SQL" ? "GlobalsecondaryindexesBuilderPricing" : "MaterializedviewsBuilderPricing",
        },
      } as Description,
      hidden: false,
    });

    currentValues.set("costPerHour", {
      value: calculateCost(baselineValues.get("sku").value as string, baselineValues.get("instances").value as number),
      hidden: false,
    });
  } else {
    currentValues.set("warningBanner", {
      value: {
        textTKey:
          userContext.apiType === "SQL" ? "GlobalsecondaryindexesWarningBannerOnDelete" : "WarningBannerOnDelete",
        link: {
          href:
            userContext.apiType === "SQL"
              ? "https://learn.microsoft.com/en-us/azure/cosmos-db/nosql/materialized-views"
              : "https://learn.microsoft.com/en-us/azure/cosmos-db/cassandra/materialized-views",
          textTKey:
            userContext.apiType === "SQL"
              ? "GlobalsecondaryindexesDeprovisioningDetailsText"
              : "DeprovisioningDetailsText",
        },
      } as Description,
      hidden: false,
    });

    currentValues.set("costPerHour", { value: costPerHourDefaultValue, hidden: true });
  }
  const sku = currentValues.get("sku");
  const instances = currentValues.get("instances");
  const hideAttributes = newValue === undefined || !(newValue as boolean);
  currentValues.set("sku", {
    value: sku.value,
    hidden: hideAttributes,
    disabled: MaterializedViewsBuilderOriginallyEnabled,
  });
  currentValues.set("instances", {
    value: instances.value,
    hidden: hideAttributes,
    disabled: MaterializedViewsBuilderOriginallyEnabled,
  });

  currentValues.set("metricsString", {
    value: metricsStringValue,
    hidden: !newValue || !MaterializedViewsBuilderOriginallyEnabled,
  });

  return currentValues;
};

const skuDropDownItems: ChoiceItem[] = [
  { labelTKey: "CosmosD2s", key: CosmosD2s },
  { labelTKey: "CosmosD4s", key: CosmosD4s },
  { labelTKey: "CosmosD8s", key: CosmosD8s },
  { labelTKey: "CosmosD16s", key: CosmosD16s },
];

const getSkus = async (): Promise<ChoiceItem[]> => {
  return skuDropDownItems;
};

const getInstancesMin = async (): Promise<number> => {
  return 1;
};

const getInstancesMax = async (): Promise<number> => {
  return 5;
};

const NumberOfInstancesDropdownInfo: Info = {
  messageTKey: userContext.apiType === "SQL" ? "GlobalsecondaryindexesResizingDecisionText" : "ResizingDecisionText",
  link: {
    href: "https://aka.ms/cosmos-db-materializedviewsbuilder-size",
    textTKey: userContext.apiType === "SQL" ? "GlobalsecondaryindexesesizingDecisionLink" : "ResizingDecisionLink",
  },
};

const ApproximateCostDropDownInfo: Info = {
  messageTKey: userContext.apiType === "SQL" ? "GlobalsecondaryindexesCostText" : "CostText",
  link: {
    href: "https://aka.ms/cosmos-db-materializedviewsbuilder-pricing",
    textTKey:
      userContext.apiType === "SQL" ? "GlobalsecondaryindexesBuilderPricing" : "MaterializedviewsBuilderPricing",
  },
};

let priceMap: Map<string, Map<string, number>>;
let currencyCode: string;
let regions: Array<string>;

const calculateCost = (skuName: string, instanceCount: number): Description => {
  const telemetryData = {
    feature: "Calculate approximate cost",
    function: "calculateCost",
    description: "performs final calculation",
    selfServeClassName: MaterializedViewsBuilder.name,
  };
  const calculateCostTimestamp = selfServeTraceStart(telemetryData);

  try {
    let costPerHour = 0;
    for (const region of regions) {
      const incrementalCost = priceMap.get(region).get(skuName.replace("Cosmos.", ""));
      if (incrementalCost === undefined) {
        throw new Error("Value not found in map.");
      }
      costPerHour += incrementalCost;
    }

    if (costPerHour === 0) {
      throw new Error("Cost per hour = 0");
    }

    costPerHour *= instanceCount;
    costPerHour = Math.round(costPerHour * 100) / 100;

    selfServeTraceSuccess(telemetryData, calculateCostTimestamp);
    return {
      textTKey: `${costPerHour} ${currencyCode}`,
      type: DescriptionType.Text,
    };
  } catch (err) {
    const failureTelemetry = { err, regions, priceMap, selfServeClassName: MaterializedViewsBuilder.name };
    selfServeTraceFailure(failureTelemetry, calculateCostTimestamp);

    return costPerHourDefaultValue;
  }
};

@IsDisplayable()
@RefreshOptions({ retryIntervalInMs: 20000 })
export default class MaterializedViewsBuilder extends SelfServeBaseClass {
  public onRefresh = async (): Promise<RefreshResult> => {
    return await refreshMaterializedViewsBuilderProvisioning();
  };

  public onSave = async (
    currentValues: Map<string, SmartUiInput>,
    baselineValues: Map<string, SmartUiInput>,
  ): Promise<OnSaveResult> => {
    selfServeTrace({ selfServeClassName: MaterializedViewsBuilder.name });

    const MaterializedViewsBuilderCurrentlyEnabled = currentValues.get("enableMaterializedViewsBuilder")
      ?.value as boolean;
    const MaterializedViewsBuilderOriginallyEnabled = baselineValues.get("enableMaterializedViewsBuilder")
      ?.value as boolean;

    currentValues.set("warningBanner", undefined);

    if (MaterializedViewsBuilderOriginallyEnabled) {
      if (!MaterializedViewsBuilderCurrentlyEnabled) {
        const operationStatusUrl = await deleteMaterializedViewsBuilderResource();
        return {
          operationStatusUrl: operationStatusUrl,
          portalNotification: {
            initialize: {
              titleTKey: "DeleteInitializeTitle",
              messageTKey:
                userContext.apiType === "SQL"
                  ? "GlobalsecondaryindexesDeleteInitializeMessage"
                  : "DeleteInitializeMessage",
            },
            success: {
              titleTKey: "DeleteSuccessTitle",
              messageTKey:
                userContext.apiType === "SQL" ? "GlobalsecondaryindexesDeleteSuccesseMessage" : "DeleteSuccesseMessage",
            },
            failure: {
              titleTKey: "DeleteFailureTitle",
              messageTKey:
                userContext.apiType === "SQL" ? "GlobalsecondaryindexesDeleteFailureMessage" : "DeleteFailureMessage",
            },
          },
        };
      } else {
        const sku = currentValues.get("sku")?.value as string;
        const instances = currentValues.get("instances").value as number;
        const operationStatusUrl = await updateMaterializedViewsBuilderResource(sku, instances);
        return {
          operationStatusUrl: operationStatusUrl,
          portalNotification: {
            initialize: {
              titleTKey: "UpdateInitializeTitle",
              messageTKey:
                userContext.apiType === "SQL"
                  ? "GlobalsecondaryindexesUpdateInitializeMessage"
                  : "UpdateInitializeMessage",
            },
            success: {
              titleTKey: "UpdateSuccessTitle",
              messageTKey:
                userContext.apiType === "SQL" ? "GlobalsecondaryindexesUpdateSuccesseMessage" : "UpdateSuccesseMessage",
            },
            failure: {
              titleTKey: "UpdateFailureTitle",
              messageTKey:
                userContext.apiType === "SQL" ? "GlobalsecondaryindexesUpdateFailureMessage" : "UpdateFailureMessage",
            },
          },
        };
      }
    } else {
      const sku = currentValues.get("sku")?.value as string;
      const instances = currentValues.get("instances").value as number;
      const operationStatusUrl = await updateMaterializedViewsBuilderResource(sku, instances);
      return {
        operationStatusUrl: operationStatusUrl,
        portalNotification: {
          initialize: {
            titleTKey: "CreateInitializeTitle",
            messageTKey:
              userContext.apiType === "SQL"
                ? "GlobalsecondaryindexesCreateInitializeMessage"
                : "CreateInitializeMessage",
          },
          success: {
            titleTKey: "CreateSuccessTitle",
            messageTKey:
              userContext.apiType === "SQL" ? "GlobalsecondaryindexesCreateSuccesseMessage" : "CreateSuccesseMessage",
          },
          failure: {
            titleTKey: "CreateFailureTitle",
            messageTKey:
              userContext.apiType === "SQL" ? "GlobalsecondaryindexesCreateFailureMessage" : "CreateFailureMessage",
          },
        },
      };
    }
  };

  public initialize = async (): Promise<Map<string, SmartUiInput>> => {
    // Based on the RP call enableMaterializedViewsBuilder will be true if it has not yet been enabled and false if it has.
    const defaults = new Map<string, SmartUiInput>();
    defaults.set("enableMaterializedViewsBuilder", { value: false });
    defaults.set("sku", { value: CosmosD2s, hidden: true });
    defaults.set("instances", { value: await getInstancesMin(), hidden: true });
    defaults.set("costPerHour", undefined);
    defaults.set("metricsString", {
      value: undefined,
      hidden: true,
    });

    regions = await getRegions();
    const priceMapAndCurrencyCode = await getPriceMapAndCurrencyCode(regions);
    priceMap = priceMapAndCurrencyCode.priceMap;
    currencyCode = priceMapAndCurrencyCode.currencyCode;

    const response = await getCurrentProvisioningState();
    if (response.status && response.status !== "Deleting") {
      defaults.set("enableMaterializedViewsBuilder", { value: true });
      defaults.set("sku", { value: response.sku, disabled: true });
      defaults.set("instances", { value: response.instances, disabled: false });
      defaults.set("costPerHour", { value: calculateCost(response.sku, response.instances) });

      defaults.set("metricsString", {
        value: metricsStringValue,
        hidden: false,
      });
    }
    defaults.set("warningBanner", undefined);
    return defaults;
  };

  public getSelfServeType = (): SelfServeType => {
    return SelfServeType.materializedviewsbuilder;
  };

  @Values({
    isDynamicDescription: true,
  })
  warningBanner: string;

  @Values({
    description: {
      textTKey:
        userContext.apiType === "SQL"
          ? "GlobalsecondaryindexesBuilderDescription"
          : "MaterializedViewsBuilderDescription",
      type: DescriptionType.Text,
      link: {
        href:
          userContext.apiType === "SQL"
            ? "https://learn.microsoft.com/en-us/azure/cosmos-db/nosql/materialized-views"
            : "https://learn.microsoft.com/en-us/azure/cosmos-db/cassandra/materialized-views",
        textTKey: userContext.apiType === "SQL" ? "LearnAboutGlobalSecondaryIndexes" : "LearnAboutMaterializedViews",
      },
    },
  })
  description: string;

  @OnChange(onEnableMaterializedViewsBuilderChange)
  @Values({
    labelTKey: userContext.apiType === "SQL" ? "GlobalSecondaryIndexesBuilder" : "MaterializedViewsBuilder",
    trueLabelTKey: "Provisioned",
    falseLabelTKey: "Deprovisioned",
  })
  enableMaterializedViewsBuilder: boolean;

  @OnChange(onSKUChange)
  @Values({
    labelTKey: "SKUs",
    choices: getSkus,
    placeholderTKey: "SKUsPlaceHolder",
  })
  sku: ChoiceItem;

  @OnChange(onNumberOfInstancesChange)
  @PropertyInfo(NumberOfInstancesDropdownInfo)
  @Values({
    labelTKey: "NumberOfInstances",
    min: getInstancesMin,
    max: getInstancesMax,
    step: 1,
    uiType: NumberUiType.Spinner,
  })
  instances: number;

  @PropertyInfo(ApproximateCostDropDownInfo)
  @Values({
    labelTKey: "ApproximateCost",
    isDynamicDescription: true,
  })
  costPerHour: string;

  @Values({
    labelTKey: "MonitorUsage",
    description: metricsStringValue,
  })
  metricsString: string;
}
