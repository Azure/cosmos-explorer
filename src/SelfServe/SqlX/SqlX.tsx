import { IsDisplayable, OnChange, Values } from "../Decorators";
import {
  ChoiceItem,
  InputType,
  NumberUiType,
  RefreshResult,
  SelfServeBaseClass,
  SelfServeNotification,
  SmartUiInput,
} from "../SelfServeTypes";
import { refreshDedicatedGatewayProvisioning } from "./SqlX.rp";

const onEnableDedicatedGatewayChange = (
  currentState: Map<string, SmartUiInput>,
  newValue: InputType
): Map<string, SmartUiInput> => {
  const sku = currentState.get("sku");
  const instances = currentState.get("instances");
  const isSkuHidden = newValue === undefined || !(newValue as boolean);
  currentState.set("enableDedicatedGateway", { value: newValue });
  currentState.set("sku", { value: sku.value, hidden: isSkuHidden });
  currentState.set("instances", { value: instances.value, hidden: isSkuHidden });
  return currentState;
};

const getSkus = async (): Promise<ChoiceItem[]> => {
  // TODO: get SKUs from getRegionSpecificSkus() RP call and return array of {label:..., key:...}.
  throw new Error("getSkus not implemented.");
};

const getInstancesMin = async (): Promise<number> => {
  // TODO: get SKUs from getRegionSpecificSkus() RP call and return array of {label:..., key:...}.
  throw new Error("getInstancesMin not implemented.");
};

const getInstancesMax = async (): Promise<number> => {
  // TODO: get SKUs from getRegionSpecificSkus() RP call and return array of {label:..., key:...}.
  throw new Error("getInstancesMax not implemented.");
};

const validate = (currentValues: Map<string, SmartUiInput>): void => {
  // TODO: add cusom validation logic to be called before Saving the data.
  throw new Error(`validate not implemented. No. of properties to validate: ${currentValues.size}`);
};

@IsDisplayable()
export default class SqlX extends SelfServeBaseClass {
  public getOnSaveNotification = (
    currentValues: Map<string, SmartUiInput>,
    baselineValues: ReadonlyMap<string, SmartUiInput>
  ): SelfServeNotification => {
    // TODO: Add logic to return correct notification after on save is called.
    throw new Error(
      `getOnSaveNotification not implemented. currentValues size: ${currentValues.size}, baselineValues size: ${baselineValues.size}`
    );
  };

  public onRefresh = async (): Promise<RefreshResult> => {
    return refreshDedicatedGatewayProvisioning();
  };

  public onSave = async (currentValues: Map<string, SmartUiInput>): Promise<void> => {
    validate(currentValues);
    // TODO: add pre processing logic before calling the updateDedicatedGatewayProvisioning() RP call.
    throw new Error(`onSave not implemented. No. of properties to save: ${currentValues.size}`);
  };

  public initialize = async (): Promise<Map<string, SmartUiInput>> => {
    // TODO: get initialization data from initializeDedicatedGatewayProvisioning() RP call.
    throw new Error("onSave not implemented");
  };

  @Values({
    description: {
      textTKey: "Provisioning dedicated gateways for SqlX accounts.",
      link: {
        href: "https://docs.microsoft.com/en-us/azure/cosmos-db/introduction",
        textTKey: "Learn more about dedicated gateway.",
      },
    },
  })
  description: string;

  @OnChange(onEnableDedicatedGatewayChange)
  @Values({
    labelTKey: "Dedicated Gateway",
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
    labelTKey: "Number of instances",
    min: getInstancesMin,
    max: getInstancesMax,
    step: 1,
    uiType: NumberUiType.Spinner,
  })
  instances: number;
}
