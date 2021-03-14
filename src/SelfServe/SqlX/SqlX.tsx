import { IsDisplayable, OnChange, RefreshOptions, Values } from "../Decorators";
import {
  ChoiceItem,
  Description,
  DescriptionType,
  InputType,
  NumberUiType,
  OnSaveResult,
  RefreshResult,
  SelfServeBaseClass,
  SmartUiInput,
} from "../SelfServeTypes";
import { BladeType, generateBladeLink } from "../SelfServeUtils";
import {
  deleteDedicatedGatewayResource,
  getCurrentProvisioningState,
  refreshDedicatedGatewayProvisioning,
  updateDedicatedGatewayResource,
} from "./SqlX.rp";

const costPerHourValue: Description = {
  textTKey: "CostPerHourText",
  type: DescriptionType.Text,
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

const onSKUChange = (newValue: InputType, currentValues: Map<string, SmartUiInput>): Map<string, SmartUiInput> => {
  currentValues.set("sku", { value: newValue });
  currentValues.set("skuDetails", {
    value: { textTKey: getSKUDetails(`${newValue.toString()}`), type: DescriptionType.Text } as Description,
  });
  currentValues.set("costPerHour", { value: costPerHourValue });
  return currentValues;
};

const onNumberOfInstancesChange = (
  newValue: InputType,
  currentValues: Map<string, SmartUiInput>
): Map<string, SmartUiInput> => {
  currentValues.set("instances", { value: newValue });
  currentValues.set("warningBanner", {
    value: { textTKey: "WarningBannerOnUpdate" } as Description,
    hidden: false,
  });

  return currentValues;
};

const onEnableDedicatedGatewayChange = (
  newValue: InputType,
  currentValues: Map<string, SmartUiInput>,
  baselineValues: ReadonlyMap<string, SmartUiInput>
): Map<string, SmartUiInput> => {
  const dedicatedGatewayOriginallyEnabled = baselineValues.get("enableDedicatedGateway")?.value as boolean;
  currentValues.set("warningBanner", undefined);
  if (dedicatedGatewayOriginallyEnabled === false && newValue === true) {
    currentValues.set("warningBanner", {
      value: { textTKey: "WarningBannerOnUpdate" } as Description,
      hidden: false,
    });
  } else if (dedicatedGatewayOriginallyEnabled === true && newValue === false) {
    currentValues.set("warningBanner", {
      value: { textTKey: "WarningBannerOnDelete" } as Description,
      hidden: false,
    });
  }
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

  currentValues.set("skuDetails", {
    value: { textTKey: getSKUDetails(`${currentValues.get("sku").value}`), type: DescriptionType.Text } as Description,
    hidden: hideAttributes,
    disabled: dedicatedGatewayOriginallyEnabled,
  });

  currentValues.set("costPerHour", { value: costPerHourValue, hidden: hideAttributes });

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

    currentValues.set("warningBanner", undefined);

    //TODO : Ad try catch for each RP call and return relevant notifications
    if (dedicatedGatewayOriginallyEnabled) {
      if (!dedicatedGatewayCurrentlyEnabled) {
        const operationStatusUrl = await deleteDedicatedGatewayResource();
        return {
          operationStatusUrl: operationStatusUrl,
          portalNotification: {
            initialize: {
              titleTKey: "CreateInitializeTitle",
              messageTKey: "CreateInitializeTitle",
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
      } else {
        // Check for scaling up/down/in/out
        return {
          operationStatusUrl: undefined,
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
    defaults.set("skuDetails", undefined);
    defaults.set("costPerHour", undefined);

    const response = await getCurrentProvisioningState();
    if (response.status && response.status !== "Deleting") {
      defaults.set("enableDedicatedGateway", { value: true });
      defaults.set("sku", { value: response.sku, disabled: true });
      defaults.set("instances", { value: response.instances, disabled: true });
      defaults.set("costPerHour", { value: costPerHourValue });
      defaults.set("skuDetails", {
        value: { textTKey: getSKUDetails(`${defaults.get("sku").value}`), type: DescriptionType.Text } as Description,
        hidden: false,
      });
    }

    defaults.set("warningBanner", undefined);
    return defaults;
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

  @OnChange(onSKUChange)
  @Values({
    labelTKey: "SKUs",
    choices: getSkus,
    placeholderTKey: "SKUsPlaceHolder",
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

  @Values({
    labelTKey: "CostPerHour",
    isDynamicDescription: true,
  })
  costPerHour: string;
}
