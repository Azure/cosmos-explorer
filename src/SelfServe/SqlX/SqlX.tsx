import { IsDisplayable, OnChange, Values } from "../Decorators";
import {
  ChoiceItem,
  InputType,
  NumberUiType,
  OnSavePortalNotification,
  PortalNotificationType,
  RefreshResult,
  SelfServeBaseClass,
  SmartUiInput,
} from "../SelfServeTypes";
import {
  refreshDedicatedGatewayProvisioning,
  updateDedicatedGatewayResource,
  deleteDedicatedGatewayResource,
  getCurrentProvisioningState,
} from "./SqlX.rp";

const onEnableDedicatedGatewayChange = (
  currentValues: Map<string, SmartUiInput>,
  newValue: InputType,
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
export default class SqlX extends SelfServeBaseClass {
  public onRefresh = async (): Promise<RefreshResult> => {
    return await refreshDedicatedGatewayProvisioning();
  };

  public onSave = async (
    currentValues: Map<string, SmartUiInput>,
    baselineValues: Map<string, SmartUiInput>
  ): Promise<OnSavePortalNotification> => {
    const dedicatedGatewayCurrentlyEnabled = currentValues.get("enableDedicatedGateway")?.value as boolean;
    const dedicatedGatewayOriginallyEnabled = baselineValues.get("enableDedicatedGateway")?.value as boolean;

    //TODO : Ad try catch for each RP call and return relevant notifications
    if (dedicatedGatewayOriginallyEnabled) {
      if (!dedicatedGatewayCurrentlyEnabled) {
        await deleteDedicatedGatewayResource();
        return { titleTKey: "Deleting resource", messageTKey: "DedicatedGateway resource will be deleted.", type: PortalNotificationType.InProgress };
      } else {
        // Check for scaling up/down/in/out
        return { titleTKey: "Updating resource", messageTKey: "DedicatedGateway resource will be updated.", type: PortalNotificationType.InProgress };
      }
    } else {
      const sku = currentValues.get("sku")?.value as string;
      const instances = currentValues.get("instances").value as number;
      await updateDedicatedGatewayResource(sku, instances);
      return { titleTKey: "Provisioning resource", messageTKey: "Dedicated Gateway resource will be provisioned.", type: PortalNotificationType.InProgress };
    }
  };

  public initialize = async (): Promise<Map<string, SmartUiInput>> => {
    // Based on the RP call enableDedicatedGateway will be true if it has not yet been enabled and false if it has.
    const defaults = new Map<string, SmartUiInput>();
    defaults.set("enableDedicatedGateway", { value: false });
    defaults.set("sku", { value: "Cosmos.D4s", hidden: true });
    defaults.set("instances", { value: await getInstancesMin(), hidden: true });
    const response = await getCurrentProvisioningState();
    if (response.status && response.status !== "Deleting") {
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
