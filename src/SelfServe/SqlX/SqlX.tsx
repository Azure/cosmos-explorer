import { RegionItem } from "SelfServe/SqlX/SqlxTypes";
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
  deleteDedicatedGatewayResource,
  getCurrentProvisioningState,
  getOfferingIds,
  getPriceMapAndCurrencyCode,
  getRegions,
  refreshDedicatedGatewayProvisioning,
  updateDedicatedGatewayResource,
} from "./SqlX.rp";

const costPerHourDefaultValue: Description = {
  textTKey: "CostText",
  type: DescriptionType.Text,
  link: {
    href: "https://aka.ms/cosmos-db-dedicated-gateway-pricing",
    textTKey: "DedicatedGatewayPricing",
  },
};

const connectionStringValue: Description = {
  textTKey: "ConnectionStringText",
  type: DescriptionType.Text,
  link: {
    href: generateBladeLink(BladeType.SqlKeys),
    textTKey: "KeysBlade",
  },
};

const metricsStringValue: Description = {
  textTKey: "MetricsText",
  type: DescriptionType.Text,
  link: {
    href: generateBladeLink(BladeType.Metrics),
    textTKey: "MetricsBlade",
  },
};

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
  const dedicatedGatewayOriginallyEnabled = baselineValues.get("enableDedicatedGateway")?.value as boolean;
  const baselineInstances = baselineValues.get("instances")?.value as number;
  if (!dedicatedGatewayOriginallyEnabled || baselineInstances !== newValue) {
    currentValues.set("warningBanner", {
      value: {
        textTKey: "WarningBannerOnUpdate",
        link: {
          href: "https://aka.ms/cosmos-db-dedicated-gateway-overview",
          textTKey: "DedicatedGatewayPricing",
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

const onEnableDedicatedGatewayChange = (
  newValue: InputType,
  currentValues: Map<string, SmartUiInput>,
  baselineValues: ReadonlyMap<string, SmartUiInput>,
): Map<string, SmartUiInput> => {
  currentValues.set("enableDedicatedGateway", { value: newValue });
  const dedicatedGatewayOriginallyEnabled = baselineValues.get("enableDedicatedGateway")?.value as boolean;
  if (dedicatedGatewayOriginallyEnabled === newValue) {
    currentValues.set("sku", baselineValues.get("sku"));
    currentValues.set("instances", baselineValues.get("instances"));
    currentValues.set("costPerHour", baselineValues.get("costPerHour"));
    currentValues.set("warningBanner", baselineValues.get("warningBanner"));
    currentValues.set("connectionString", baselineValues.get("connectionString"));
    currentValues.set("metricsString", baselineValues.get("metricsString"));
    return currentValues;
  }

  currentValues.set("warningBanner", undefined);
  if (newValue === true) {
    currentValues.set("warningBanner", {
      value: {
        textTKey: "WarningBannerOnUpdate",
        link: {
          href: "https://aka.ms/cosmos-db-dedicated-gateway-pricing",
          textTKey: "DedicatedGatewayPricing",
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
        textTKey: "WarningBannerOnDelete",
        link: {
          href: "https://aka.ms/cosmos-db-dedicated-gateway-overview",
          textTKey: "DeprovisioningDetailsText",
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
    disabled: dedicatedGatewayOriginallyEnabled,
  });
  currentValues.set("instances", {
    value: instances.value,
    hidden: hideAttributes,
    disabled: dedicatedGatewayOriginallyEnabled,
  });

  currentValues.set("connectionString", {
    value: connectionStringValue,
    hidden: !newValue || !dedicatedGatewayOriginallyEnabled,
  });

  currentValues.set("metricsString", {
    value: metricsStringValue,
    hidden: !newValue || !dedicatedGatewayOriginallyEnabled,
  });

  return currentValues;
};

const skuDropDownItems: ChoiceItem[] = [
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
  messageTKey: "ResizingDecisionText",
  link: {
    href: "https://aka.ms/cosmos-db-dedicated-gateway-size",
    textTKey: "ResizingDecisionLink",
  },
};

const ApproximateCostDropDownInfo: Info = {
  messageTKey: "CostText",
  link: {
    href: "https://aka.ms/cosmos-db-dedicated-gateway-pricing",
    textTKey: "DedicatedGatewayPricing",
  },
};

let priceMap: Map<string, Map<string, number>>;
let currencyCode: string;
let regions: Array<RegionItem>;

const calculateCost = (skuName: string, instanceCount: number): Description => {
  const telemetryData = {
    feature: "Calculate approximate cost",
    function: "calculateCost",
    description: "performs final calculation",
    selfServeClassName: SqlX.name,
  };
  const calculateCostTimestamp = selfServeTraceStart(telemetryData);

  try {
    let costPerHour = 0;
    let costBreakdown = "";
    for (const regionItem of regions) {
      const incrementalCost = priceMap?.get(regionItem.locationName)?.get(skuName.replace("Cosmos.", ""));
      if (incrementalCost === undefined) {
        throw new Error(`${regionItem.locationName} not found in price map.`);
      } else if (incrementalCost === 0) {
        throw new Error(`${regionItem.locationName} cost per hour = 0`);
      } else if (currencyCode === undefined) {
        throw new Error(`Currency code not found in price map.`);
      }

      let regionalInstanceCount = instanceCount;
      if (regionItem.isZoneRedundant) {
        regionalInstanceCount = Math.ceil(instanceCount * 1.5);
      }

      const regionalCostPerHour = incrementalCost * regionalInstanceCount;
      costBreakdown += `
      ${regionItem.locationName} ${regionItem.isZoneRedundant ? "(AZ)" : ""}
      ${regionalCostPerHour} ${currencyCode} (${regionalInstanceCount} instances * ${incrementalCost} ${currencyCode})\
      `;

      if (regionalCostPerHour === 0) {
        throw new Error(`${regionItem.locationName} Cost per hour = 0`);
      }

      costPerHour += regionalCostPerHour;
    }

    if (costPerHour === 0) {
      throw new Error("Cost per hour = 0");
    }

    costPerHour = Math.round(costPerHour * 100) / 100;

    selfServeTraceSuccess(telemetryData, calculateCostTimestamp);
    return {
      textTKey: `${costPerHour} ${currencyCode}
      ${costBreakdown}`,
      type: DescriptionType.Text,
    };
  } catch (err) {
    alert(err);
    const failureTelemetry = { err, regions, priceMap, selfServeClassName: SqlX.name };
    selfServeTraceFailure(failureTelemetry, calculateCostTimestamp);

    return costPerHourDefaultValue;
  }
};

@IsDisplayable()
@RefreshOptions({ retryIntervalInMs: 20000 })
export default class SqlX extends SelfServeBaseClass {
  public onRefresh = async (): Promise<RefreshResult> => {
    return await refreshDedicatedGatewayProvisioning();
  };

  public onSave = async (
    currentValues: Map<string, SmartUiInput>,
    baselineValues: Map<string, SmartUiInput>,
  ): Promise<OnSaveResult> => {
    selfServeTrace({ selfServeClassName: SqlX.name });

    const dedicatedGatewayCurrentlyEnabled = currentValues.get("enableDedicatedGateway")?.value as boolean;
    const dedicatedGatewayOriginallyEnabled = baselineValues.get("enableDedicatedGateway")?.value as boolean;

    currentValues.set("warningBanner", undefined);

    if (dedicatedGatewayOriginallyEnabled) {
      if (!dedicatedGatewayCurrentlyEnabled) {
        const operationStatusUrl = await deleteDedicatedGatewayResource();
        return {
          operationStatusUrl: operationStatusUrl,
          portalNotification: {
            initialize: {
              titleTKey: "DeleteInitializeTitle",
              messageTKey: "DeleteInitializeMessage",
            },
            success: {
              titleTKey: "DeleteSuccessTitle",
              messageTKey: "DeleteSuccesseMessage",
            },
            failure: {
              titleTKey: "DeleteFailureTitle",
              messageTKey: "DeleteFailureMessage",
            },
          },
        };
      } else {
        const sku = currentValues.get("sku")?.value as string;
        const instances = currentValues.get("instances").value as number;
        const operationStatusUrl = await updateDedicatedGatewayResource(sku, instances);
        return {
          operationStatusUrl: operationStatusUrl,
          portalNotification: {
            initialize: {
              titleTKey: "UpdateInitializeTitle",
              messageTKey: "UpdateInitializeMessage",
            },
            success: {
              titleTKey: "UpdateSuccessTitle",
              messageTKey: "UpdateSuccesseMessage",
            },
            failure: {
              titleTKey: "UpdateFailureTitle",
              messageTKey: "UpdateFailureMessage",
            },
          },
        };
      }
    } else {
      const sku = currentValues.get("sku")?.value as string;
      const instances = currentValues.get("instances").value as number;
      const operationStatusUrl = await updateDedicatedGatewayResource(sku, instances);
      return {
        operationStatusUrl: operationStatusUrl,
        portalNotification: {
          initialize: {
            titleTKey: "CreateInitializeTitle",
            messageTKey: "CreateInitializeMessage",
          },
          success: {
            titleTKey: "CreateSuccessTitle",
            messageTKey: "CreateSuccesseMessage",
          },
          failure: {
            titleTKey: "CreateFailureTitle",
            messageTKey: "CreateFailureMessage",
          },
        },
      };
    }
  };

  public initialize = async (): Promise<Map<string, SmartUiInput>> => {
    // Based on the RP call enableDedicatedGateway will be true if it has not yet been enabled and false if it has.
    const defaults = new Map<string, SmartUiInput>();
    defaults.set("enableDedicatedGateway", { value: false });
    defaults.set("sku", { value: CosmosD4s, hidden: true });
    defaults.set("instances", { value: await getInstancesMin(), hidden: true });
    defaults.set("costPerHour", undefined);
    defaults.set("connectionString", undefined);
    defaults.set("metricsString", {
      value: undefined,
      hidden: true,
    });

    regions = await getRegions();
    const offeringIdMap = await getOfferingIds(regions);
    const priceMapAndCurrencyCode = await getPriceMapAndCurrencyCode(offeringIdMap);
    priceMap = priceMapAndCurrencyCode.priceMap;
    currencyCode = priceMapAndCurrencyCode.billingCurrency;

    const response = await getCurrentProvisioningState();
    if (response.status && response.status !== "Deleting") {
      defaults.set("enableDedicatedGateway", { value: true });
      defaults.set("sku", { value: response.sku, disabled: true });
      defaults.set("instances", { value: response.instances, disabled: false });
      defaults.set("costPerHour", { value: calculateCost(response.sku, response.instances) });
      defaults.set("connectionString", {
        value: connectionStringValue,
        hidden: false,
      });

      defaults.set("metricsString", {
        value: metricsStringValue,
        hidden: false,
      });
    }
    defaults.set("warningBanner", undefined);
    return defaults;
  };

  public getSelfServeType = (): SelfServeType => {
    return SelfServeType.sqlx;
  };

  @Values({
    isDynamicDescription: true,
  })
  warningBanner: string;

  @Values({
    description: {
      textTKey: "DedicatedGatewayDescription",
      type: DescriptionType.Text,
      link: {
        href: "https://aka.ms/cosmos-db-dedicated-gateway-overview",
        textTKey: "LearnAboutDedicatedGateway",
      },
    },
  })
  description: string;

  @OnChange(onEnableDedicatedGatewayChange)
  @Values({
    labelTKey: "DedicatedGateway",
    trueLabelTKey: "Provisioned",
    falseLabelTKey: "Deprovisioned",
  })
  enableDedicatedGateway: boolean;

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
    labelTKey: "ConnectionString",
    isDynamicDescription: true,
  })
  connectionString: string;

  @Values({
    labelTKey: "MonitorUsage",
    description: metricsStringValue,
  })
  metricsString: string;
}
