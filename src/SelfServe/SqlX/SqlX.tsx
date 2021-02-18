import { IsDisplayable, OnChange, Values } from "../Decorators";
import {
  ChoiceItem,
  InputType,
  NumberUiType,
  RefreshResult,
  SelfServeBaseClass,
  SelfServeNotification,
  SelfServeNotificationType,
  SmartUiInput,
} from "../SelfServeTypes";
import {
  refreshDedicatedGatewayProvisioning,
  updateDedicatedGatewayResource,
  deleteDedicatedGatewayResource,
  getCurrentProvisioningState,
} from "./SqlX.rp";

let disableAttributesOnDedicatedGatewayChange = false;

const onEnableDedicatedGatewayChange = (
  currentState: Map<string, SmartUiInput>,
  newValue: InputType
): Map<string, SmartUiInput> => {
  const sku = currentState.get("sku");
  const instances = currentState.get("instances");
  const hideAttributes = newValue === undefined || !(newValue as boolean);
  currentState.set("enableDedicatedGateway", { value: newValue });
  currentState.set("sku", {
    value: sku.value,
    hidden: hideAttributes,
    disabled: disableAttributesOnDedicatedGatewayChange,
  });
  currentState.set("instances", {
    value: instances.value,
    hidden: hideAttributes,
    disabled: disableAttributesOnDedicatedGatewayChange,
  });
  return currentState;
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
export default class SqlX extends SelfServeBaseClass {
  public getOnSaveNotification = (
    currentValues: Map<string, SmartUiInput>,
    baselineValues: ReadonlyMap<string, SmartUiInput>
  ): SelfServeNotification => {
    const dedicatedGatewayCurrentlyEnabled = currentValues.get("enableDedicatedGateway")?.value as boolean;
    const dedicatedGatewayOriginallyEnabled = baselineValues.get("enableDedicatedGateway")?.value as boolean;
    if (dedicatedGatewayOriginallyEnabled) {
      if (!dedicatedGatewayCurrentlyEnabled) {
          return { message: "DedicatedGateway resource will be deleted.", type: SelfServeNotificationType.info };
      } else {
        // Check for scaling up/down/in/out
        return { message: "DedicatedGateway resource will be updated.", type: SelfServeNotificationType.info };
      }
    } else {
        return { message: "Dedicated Gateway resource will be provisioned.", type: SelfServeNotificationType.info };
    }
  };

  public onRefresh = async (): Promise<RefreshResult> => {
    return refreshDedicatedGatewayProvisioning();
  };

  public onSave = async (currentValues: Map<string, SmartUiInput>, baselineValues: Map<string, SmartUiInput>): Promise<void> => {
    const dedicatedGatewayCurrentlyEnabled = currentValues.get("enableDedicatedGateway")?.value as boolean;
    const dedicatedGatewayOriginallyEnabled = baselineValues.get("enableDedicatedGateway")?.value as boolean;

    if (dedicatedGatewayOriginallyEnabled) {
      if (!dedicatedGatewayCurrentlyEnabled) {
          await deleteDedicatedGatewayResource();
      } else {
        // Check for scaling up/down/in/out
      }
    } else {
        const sku = currentValues.get("sku")?.value as string;
        const instances = currentValues.get("instances").value as number;
        await updateDedicatedGatewayResource(sku, instances);
    }
  };

  public initialize = async (): Promise<Map<string, SmartUiInput>> => {
    // Based on the RP call enableDedicatedGateway will be true if it has not yet been enabled and false if it has.
    const defaults = new Map<string, SmartUiInput>();
    defaults.set("enableDedicatedGateway", { value: false });
    defaults.set("sku", { value: "Cosmos.D4s", hidden: true });
    defaults.set("instances", { value: await getInstancesMin(), hidden: true });
    const response = await getCurrentProvisioningState();
    if (response.status !== undefined) {
      defaults.set("enableDedicatedGateway", { value: true });
      defaults.set("sku", { value: response.sku, disabled: true });
      defaults.set("instances", { value: response.instances, disabled: true });
    }

    return defaults;
  };

  @Values({
    description: {
      textTKey: "DedicatedGatewayDescription",
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

  @Values({
    labelTKey: "SKUs",
    choices: getSkus,
    placeholderTKey: "Select SKUs",
  })
  sku: ChoiceItem;

  @Values({
    labelTKey: "NumberOfInstances",
    min: getInstancesMin,
    max: getInstancesMax,
    step: 1,
    uiType: NumberUiType.Spinner,
  })
  instances: number;
}
