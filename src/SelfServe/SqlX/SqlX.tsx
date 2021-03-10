import { IsDisplayable, OnChange, Values, PropertyInfo, RefreshOptions } from "../Decorators";
import {
  ChoiceItem,
  DescriptionType,
  InputType,
  NumberUiType,
  RefreshResult,
  SelfServeBaseClass,
  SmartUiInput,
  Info,
  Description,
  OnSaveResult,
} from "../SelfServeTypes";
import { BladeType, generateBladeLink } from "../SelfServeUtils";
import {
  refreshDedicatedGatewayProvisioning,
  updateDedicatedGatewayResource,
  deleteDedicatedGatewayResource,
  getCurrentProvisioningState,
} from "./SqlX.rp";

const skuInfo: Info = {
  messageTKey: "SkuInfo",
};

const resourceCostInfo: Info = {
  messageTKey: "ResourceCostInfo",
  link: {
    href: "https://azure.microsoft.com/en-us/pricing/details/virtual-machines/windows/",
    textTKey: "SkuCostInfo",
  },
};

const getSKUDetails = (sku: string): string => {
  if (sku === "Cosmos.D4s") {
    return "CosmosD4Details";
  } else if (sku === "Cosmos.D8s") {
    return "CosmosD8Details";
  } else if (sku === "Cosmos.D16s") {
    return "CosmosD16Details";
  } else if (sku === "Cosmos.D32s") {
    return "CosmosD32Details";
  }
  return "Not Supported Yet";
};

const displayCostCalculation = (sku: string, numberOfInstances: string): string => {
  return `${numberOfInstances} * Hourly cost of ${sku}`;
};

const onSKUChange = (newValue: InputType, currentValues: Map<string, SmartUiInput>): Map<string, SmartUiInput> => {
  currentValues.set("sku", { value: newValue });
  const currentCostText = displayCostCalculation(
    currentValues.get("sku").value.toString(),
    currentValues.get("instances").value.toString()
  );
  currentValues.set("currentCostCalculation", {
    value: { textTKey: currentCostText, type: DescriptionType.Text } as Description,
  });
  currentValues.set("skuDetails", {
    value: { textTKey: getSKUDetails(`${newValue.toString()}`), type: DescriptionType.Text } as Description,
  });
  return currentValues;
};

const onNumberOfInstancesChange = (
  newValue: InputType,
  currentValues: Map<string, SmartUiInput>
): Map<string, SmartUiInput> => {
  currentValues.set("instances", { value: newValue });
  const currentCostText = displayCostCalculation(
    currentValues.get("sku").value.toString(),
    currentValues.get("instances").value.toString()
  );
  currentValues.set("currentCostCalculation", {
    value: { textTKey: currentCostText, type: DescriptionType.Text } as Description,
  });
  return currentValues;
};

const onEnableDedicatedGatewayChange = (
  newValue: InputType,
  currentValues: Map<string, SmartUiInput>,
  baselineValues: ReadonlyMap<string, SmartUiInput>
): Map<string, SmartUiInput> => {
  const dedicatedGatewayOriginallyEnabled = baselineValues.get("enableDedicatedGateway")?.value as boolean;
  const sku = currentValues.get("sku");
  const instances = currentValues.get("instances");
  const hideAttributes = newValue === undefined || !(newValue as boolean);
  currentValues.set("enableDedicatedGateway", { value: newValue });
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

  const currentCostText = displayCostCalculation(
    currentValues.get("sku").value.toString(),
    currentValues.get("instances").value.toString()
  );
  currentValues.set("currentCostCalculation", {
    value: { textTKey: currentCostText, type: DescriptionType.Text } as Description,
    hidden: hideAttributes,
    disabled: dedicatedGatewayOriginallyEnabled,
  });
  currentValues.set("skuDetails", {
    value: { textTKey: getSKUDetails(`${currentValues.get("sku").value}`), type: DescriptionType.Text } as Description,
    hidden: hideAttributes,
    disabled: dedicatedGatewayOriginallyEnabled,
  });

  return currentValues;
};

const skuDropDownItems: ChoiceItem[] = [
  { label: "CosmosD4s", key: "Cosmos.D4s" },
  { label: "CosmosD8s", key: "Cosmos.D8s" },
  { label: "CosmosD16s", key: "Cosmos.D16s" },
  { label: "CosmosD32s", key: "Cosmos.D32s" },
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

@IsDisplayable()
@RefreshOptions({ retryIntervalInMs: 20000 })
export default class SqlX extends SelfServeBaseClass {
  public onRefresh = async (): Promise<RefreshResult> => {
    return await refreshDedicatedGatewayProvisioning();
  };

  public onSave = async (
    currentValues: Map<string, SmartUiInput>,
    baselineValues: Map<string, SmartUiInput>
  ): Promise<OnSaveResult> => {
    const dedicatedGatewayCurrentlyEnabled = currentValues.get("enableDedicatedGateway")?.value as boolean;
    const dedicatedGatewayOriginallyEnabled = baselineValues.get("enableDedicatedGateway")?.value as boolean;

    //TODO : Ad try catch for each RP call and return relevant notifications
    if (dedicatedGatewayOriginallyEnabled) {
      if (!dedicatedGatewayCurrentlyEnabled) {
        const operationStatusUrl = await deleteDedicatedGatewayResource();
        return {
          operationStatusUrl: operationStatusUrl,
          portalNotification: {
            initialize: {
              titleTKey: "Deleting resource",
              messageTKey: "DedicatedGateway resource will be deleted.",
            },
            success: {
              titleTKey: "Resource Deleted",
              messageTKey: "DedicatedGateway resource deleted.",
            },
            failure: {
              titleTKey: "Failed to delete resource.",
              messageTKey: "DedicatedGateway resource deletion failed.",
            },
          },
        };
      } else {
        // Check for scaling up/down/in/out
        return {
          operationStatusUrl: undefined,
          portalNotification: {
            initialize: {
              titleTKey: "Updating resource",
              messageTKey: "DedicatedGateway resource will be updated.",
            },
            success: {
              titleTKey: "Resource Updated",
              messageTKey: "DedicatedGateway resource updated.",
            },
            failure: {
              titleTKey: "Resource Updation failed.",
              messageTKey: "DedicatedGateway resource updation failed.",
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
            titleTKey: "Provisioning resource",
            messageTKey: "Dedicated Gateway resource will be provisioned.",
          },
          success: {
            titleTKey: "Resource provisioned",
            messageTKey: `Dedicated Gateway resource provisioned. Please go to <a href='${generateBladeLink(
              BladeType.SqlKeys
            )}'>keys blade</a> to use the keys.`,
          },
          failure: {
            titleTKey: "Provisioning resource failed.",
            messageTKey: "Dedicated Gateway resource provisioning failed.",
          },
        },
      };
    }
  };

  public initialize = async (): Promise<Map<string, SmartUiInput>> => {
    // Based on the RP call enableDedicatedGateway will be true if it has not yet been enabled and false if it has.
    const defaults = new Map<string, SmartUiInput>();
    defaults.set("enableDedicatedGateway", { value: false });
    defaults.set("sku", { value: "Cosmos.D4s", hidden: true });
    defaults.set("instances", { value: await getInstancesMin(), hidden: true });
    defaults.set("currentCostCalculation", { value: "0", hidden: true });
    defaults.set("skuDetails", { value: "NoValue", hidden: true });
    const response = await getCurrentProvisioningState();
    if (response.status && response.status !== "Deleting") {
      defaults.set("enableDedicatedGateway", { value: true });
      defaults.set("sku", { value: response.sku, disabled: true });
      defaults.set("instances", { value: response.instances, disabled: true });
      const currentCostText = displayCostCalculation(
        defaults.get("sku").value.toString(),
        defaults.get("instances").value.toString()
      );
      defaults.set("currentCostCalculation", {
        value: { textTKey: currentCostText, type: DescriptionType.Text } as Description,
        hidden: false,
      });
      defaults.set("skuDetails", {
        value: { textTKey: getSKUDetails(`${defaults.get("sku").value}`), type: DescriptionType.Text } as Description,
        hidden: false,
      });
    }

    return defaults;
  };

  @Values({
    description: {
      textTKey: "DedicatedGatewayDescription",
      type: DescriptionType.Text,
      link: {
        href: "https://docs.microsoft.com/en-us/azure/cosmos-db/introduction",
        textTKey: "LearnAboutDedicatedGateway",
      },
    },
  })
  description: string;

  @OnChange(onEnableDedicatedGatewayChange)
  @Values({
    labelTKey: "DedicatedGateway",
    trueLabelTKey: "Enable",
    falseLabelTKey: "Disable",
  })
  enableDedicatedGateway: boolean;

  @PropertyInfo(skuInfo)
  @OnChange(onSKUChange)
  @Values({
    labelTKey: "SKUs",
    choices: getSkus,
    placeholderTKey: "Select SKUs",
  })
  sku: ChoiceItem;

  @Values({
    labelTKey: "SKUDetails",
    isDynamicDescription: true,
  })
  skuDetails: string;

  @OnChange(onNumberOfInstancesChange)
  @Values({
    labelTKey: "NumberOfInstances",
    min: getInstancesMin,
    max: getInstancesMax,
    step: 1,
    uiType: NumberUiType.Spinner,
  })
  instances: number;

  @PropertyInfo(resourceCostInfo)
  @Values({
    labelTKey: "CurrentCostCalculation",
    isDynamicDescription: true,
  })
  currentCostCalculation: string;
}
