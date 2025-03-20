import { IsDisplayable, OnChange, PropertyInfo, RefreshOptions, Values } from "../Decorators";
import { selfServeTrace } from "../SelfServeTelemetryProcessor";
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
  deleteComputeResource,
  getCurrentProvisioningState,
  getPriceMap,
  getReadRegions,
  refreshComputeProvisioning,
  updateComputeResource,
} from "./GraphAPICompute.rp";

const costPerHourDefaultValue: Description = {
  textTKey: "CostText",
  type: DescriptionType.Text,
  link: {
    href: "https://aka.ms/cosmos-db-dedicated-gateway-pricing",
    textTKey: "ComputePricing",
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
  const ComputeOriginallyEnabled = baselineValues.get("enableCompute")?.value as boolean;
  const baselineInstances = baselineValues.get("instances")?.value as number;
  if (!ComputeOriginallyEnabled || baselineInstances !== newValue) {
    currentValues.set("warningBanner", {
      value: {
        textTKey: "WarningBannerOnUpdate",
        link: {
          href: "https://aka.ms/cosmos-db-dedicated-gateway-overview",
          textTKey: "ComputePricing",
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

const onEnableComputeChange = (
  newValue: InputType,
  currentValues: Map<string, SmartUiInput>,
  baselineValues: ReadonlyMap<string, SmartUiInput>,
): Map<string, SmartUiInput> => {
  currentValues.set("enableCompute", { value: newValue });
  const ComputeOriginallyEnabled = baselineValues.get("enableCompute")?.value as boolean;
  if (ComputeOriginallyEnabled === newValue) {
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
          href: "https://aka.ms/cosmos-db-dedicated-gateway-pricing", //needs updating
          textTKey: "ComputePricing",
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
          href: "https://aka.ms/cosmos-db-dedicated-gateway-overview", // needs updating
          textTKey: "DeprovisioningDetailsText",
        },
      } as Description,
      hidden: false,
    });

    currentValues.set("costPerHour", { value: costPerHourDefaultValue, hidden: true });
  }
  const sku = currentValues.get("sku");
  const hideAttributes = newValue === undefined || !(newValue as boolean);
  currentValues.set("sku", {
    value: sku.value,
    hidden: hideAttributes,
    disabled: ComputeOriginallyEnabled,
  });
  currentValues.set("instances", {
    value: 1,
    hidden: hideAttributes,
    disabled: true,
  });

  currentValues.set("connectionString", {
    value: connectionStringValue,
    hidden: !newValue || !ComputeOriginallyEnabled,
  });

  currentValues.set("metricsString", {
    value: metricsStringValue,
    hidden: !newValue || !ComputeOriginallyEnabled,
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

const NumberOfInstancesDropdownInfo: Info = {
  messageTKey: "ResizingDecisionText",
  link: {
    href: "https://aka.ms/cosmos-db-dedicated-gateway-size", // todo
    textTKey: "ResizingDecisionLink",
  },
};

const getInstancesMin = async (): Promise<number> => {
  return 1;
};

const getInstancesMax = async (): Promise<number> => {
  return 5;
};

const ApproximateCostDropDownInfo: Info = {
  messageTKey: "CostText",
  link: {
    href: "https://aka.ms/cosmos-db-dedicated-gateway-pricing", //todo
    textTKey: "ComputePricing",
  },
};

let priceMap: Map<string, Map<string, number>>;
let regions: Array<string>;

const calculateCost = (skuName: string, instanceCount: number): Description => {
  try {
    let costPerHour = 0;
    for (const region of regions) {
      const incrementalCost = priceMap.get(region).get(skuName.replace("Cosmos.", ""));
      if (incrementalCost === undefined) {
        throw new Error("Value not found in map.");
      }
      costPerHour += incrementalCost;
    }

    costPerHour *= instanceCount;
    costPerHour = Math.round(costPerHour * 100) / 100;

    return {
      textTKey: `${costPerHour} USD`,
      type: DescriptionType.Text,
    };
  } catch (err) {
    return costPerHourDefaultValue;
  }
};

@IsDisplayable()
@RefreshOptions({ retryIntervalInMs: 20000 })
export default class GraphAPICompute extends SelfServeBaseClass {
  public onRefresh = async (): Promise<RefreshResult> => {
    return await refreshComputeProvisioning();
  };

  public onSave = async (
    currentValues: Map<string, SmartUiInput>,
    baselineValues: Map<string, SmartUiInput>,
  ): Promise<OnSaveResult> => {
    selfServeTrace({ selfServeClassName: GraphAPICompute.name });

    const ComputeCurrentlyEnabled = currentValues.get("enableCompute")?.value as boolean;
    const ComputeOriginallyEnabled = baselineValues.get("enableCompute")?.value as boolean;

    currentValues.set("warningBanner", undefined);

    if (ComputeOriginallyEnabled) {
      if (!ComputeCurrentlyEnabled) {
        const operationStatusUrl = await deleteComputeResource();
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
        const operationStatusUrl = await updateComputeResource(sku, instances);
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
      const operationStatusUrl = await updateComputeResource(sku, instances);
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
    // Based on the RP call enableCompute will be true if it has not yet been enabled and false if it has.
    const defaults = new Map<string, SmartUiInput>();
    defaults.set("enableCompute", { value: false });
    defaults.set("sku", { value: CosmosD4s, hidden: true });
    defaults.set("instances", { value: 1, hidden: true });
    defaults.set("costPerHour", undefined);
    defaults.set("connectionString", undefined);
    defaults.set("metricsString", {
      value: undefined,
      hidden: true,
    });

    regions = await getReadRegions();
    priceMap = await getPriceMap(regions);
    const response = await getCurrentProvisioningState();
    if (response.status && response.status === "Creating") {
      defaults.set("enableCompute", { value: true });
      defaults.set("sku", { value: response.sku, disabled: true });
      defaults.set("instances", { value: response.instances, disabled: true });
      defaults.set("costPerHour", { value: calculateCost(response.sku, response.instances) });
      defaults.set("connectionString", {
        value: connectionStringValue,
        hidden: true,
      });
      defaults.set("metricsString", {
        value: metricsStringValue,
        hidden: true,
      });
    } else if (response.status && response.status !== "Deleting") {
      defaults.set("enableCompute", { value: true });
      defaults.set("sku", { value: response.sku, disabled: true });
      defaults.set("instances", { value: response.instances });
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
    return SelfServeType.graphapicompute;
  };

  @Values({
    isDynamicDescription: true,
  })
  warningBanner: string;

  @Values({
    description: {
      textTKey: "GraphAPIDescription",
      type: DescriptionType.Text,
      link: {
        href: "https://aka.ms/cosmos-db-dedicated-gateway-overview", //todo
        textTKey: "LearnAboutCompute",
      },
    },
  })
  description: string;

  @OnChange(onEnableComputeChange)
  @Values({
    labelTKey: "Compute",
    trueLabelTKey: "Provisioned",
    falseLabelTKey: "Deprovisioned",
  })
  enableCompute: boolean;

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
