import { IsDisplayable, OnChange, Values } from "../Decorators";
import { userContext } from "../../UserContext";
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
  getDedicatedGatewayResource,
  updateDedicatedGatewayResource,
  deleteDedicatedGatewayResource,
  SKU,
  getCurrentProvisioningState
} from "./SqlX.rp";
import { Console } from "console";

let disableAttributesOnDedicatedGatewayChange = false;

const onEnableDedicatedGatewayChange = (
  currentState: Map<string, SmartUiInput>,
  newValue: InputType
): Map<string, SmartUiInput> => {
    console.log("Disable Attributes is " + disableAttributesOnDedicatedGatewayChange);
    const sku = currentState.get("sku");
    const instances = currentState.get("instances");
    const hideAttributes = newValue === undefined || !(newValue as boolean);
    currentState.set("enableDedicatedGateway", { value: newValue });
    currentState.set("sku", { value: sku.value, hidden: hideAttributes, disabled: disableAttributesOnDedicatedGatewayChange});
    currentState.set("instances", { value: instances.value, hidden: hideAttributes, disabled: disableAttributesOnDedicatedGatewayChange});
    return currentState;
};

const skuDropDownItems: ChoiceItem[] = [
  { label: "CosmosD4s", key: SKU.CosmosD4s },
  { label: "CosmosD8s", key: SKU.CosmosD8s },
  { label: "CosmosD16s", key: SKU.CosmosD16s },
  { label: "CosmosD32s", key: SKU.CosmosD32s },
];

const getSkus = async (): Promise<ChoiceItem[]> => {
  // TODO: get SKUs from getRegionSpecificSkus() RP call and return array of {label:..., key:...}.
  return skuDropDownItems;
};

const getInstancesMin = async (): Promise<number> => {
  // TODO: get SKUs from getRegionSpecificSkus() RP call and return array of {label:..., key:...}.
  return 1;
};

const getInstancesMax = async (): Promise<number> => {
  // TODO: get SKUs from getRegionSpecificSkus() RP call and return array of {label:..., key:...}.
  return 5;
};

const validate = (currentValues: Map<string, SmartUiInput>): void => {
  // TODO: add cusom validation logic to be called before Saving the data.
  throw new Error(`validate not implemented. No. of properties to validate: ${currentValues.size}`);
};

@IsDisplayable()
export default class SqlX extends SelfServeBaseClass {
  public onRefresh = async (): Promise<RefreshResult> => {
    return refreshDedicatedGatewayProvisioning();
  };

  public onSave = async (currentValues: Map<string, SmartUiInput>): Promise<SelfServeNotification> => {
    const response = await getCurrentProvisioningState();

    // null implies the resource has not been provisioned.
    if (response.status != null && response.status != "Running")
    {
      switch(response.status)
      {
        case "Creating":
          return {message: "CreateMessage", type: SelfServeNotificationType.error};
        case "Updating":
          return {message: "UpdateMessage", type: SelfServeNotificationType.error};
        case "Deleting":
          return {message: "DeleteMessage", type: SelfServeNotificationType.error};
        default:
          console.log("UnexpectedStatus: " + response.status);
          return {message: "CannotSave", type: SelfServeNotificationType.error}
      }
    }

    const enableDedicatedGateway = currentValues.get("enableDedicatedGateway")?.value as boolean;

    if (response.status != null)
    {
      if (!enableDedicatedGateway)
      {
        try 
        {
          await deleteDedicatedGatewayResource();
          return { message: "DedicatedGateway resource will be deleted.", type: SelfServeNotificationType.info };
        }
        catch(e)
        {
          console.log(e);
          return { message: "Deleting Dedicated Gateway resource failed. DedicatedGateway will not be deleted.", type: SelfServeNotificationType.error };
        }
      }
      else
      {
        // Check for scaling up/down/in/out 
      }
    }
    else
    {
      if (enableDedicatedGateway) {
        const sku = currentValues.get("sku")?.value as string;
        const instances = currentValues.get("instances").value as number;
        try 
        {
          await updateDedicatedGatewayResource(sku, instances);
          return { message: "Dedicated Gateway resource will be provisioned.", type: SelfServeNotificationType.info };
        }
        catch(e)
        {
          console.log(e);
          return { message: "Updating Dedicated Gateway resource failed. Dedicated Gateway will not be updated.", type: SelfServeNotificationType.error };
        }

      }
    }
    return { message: "No updates were applied at this time", type: SelfServeNotificationType.warning };
  };

  public initialize = async (): Promise<Map<string, SmartUiInput>> => {
    // TODO: RP call to check if dedicated gateway has already been provisioned.
    // Based on the RP call enableDedicatedGateway will be true if it has not yet been enabled and false if it has.
    const defaults = new Map<string, SmartUiInput>();
    const enableDedicatedGateway = false;
    defaults.set("enableDedicatedGateway", { value: enableDedicatedGateway, hidden: false, disabled: false});
    defaults.set("sku", { value: SKU.CosmosD4s, hidden: !enableDedicatedGateway, disabled: false});
    defaults.set("instances", { value: await getInstancesMin(), hidden: !enableDedicatedGateway, disabled: false});    
    const response = await getCurrentProvisioningState()
    if (response.status != null)
    {
      disableAttributesOnDedicatedGatewayChange = true;
      defaults.set("enableDedicatedGateway", { value: true, hidden: false, disabled: false});
      defaults.set("sku", { value: response.sku, hidden: false, disabled: true});
      defaults.set("instances", { value: response.instances, hidden: false, disabled: true});
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
