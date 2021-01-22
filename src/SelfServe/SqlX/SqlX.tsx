import { OnChange, Values } from "../PropertyDecorators";
import { IsDisplayable } from "../ClassDecorators";
import { SelfServeBaseClass } from "../SelfServeUtils";
import {
  BooleanUiType,
  ChoiceItem,
  InputType,
  NumberUiType,
  SmartUiInput,
} from "../../Explorer/Controls/SmartUi/SmartUiComponent";
import {
  getRegionSpecificSku,
  initializeDedicatedGatewayProvisioning,
  Sku,
  updateDedicatedGatewayProvisioning,
} from "./SqlX.rp";
import { RefreshResult, SelfServeNotification } from "../SelfServeComponent";
import { MessageBarType } from "office-ui-fabric-react";
import { SessionStorageUtility } from "../../Shared/StorageUtility";

const onEnableDedicatedGatewayChange = (
  currentState: Map<string, SmartUiInput>,
  newValue: InputType
): Map<string, SmartUiInput> => {
  const sku = currentState.get("sku");
  const instances = currentState.get("instances");
  const isSkuHidden = newValue === undefined || !(newValue as boolean);
  currentState.set("enableDedicatedGateway", { value: newValue, hidden: false });
  currentState.set("sku", { value: sku.value, hidden: isSkuHidden });
  currentState.set("instances", { value: instances.value, hidden: isSkuHidden });
  return currentState;
};

const getSkuLabel = (sku: Sku): string => {
  switch (sku) {
    case Sku.D4:
      return "Cosmos D4s";
    case Sku.D8:
      return "Cosmos D8s";
    case Sku.D16:
      return "Cosmos D16s";
    case Sku.D32:
      return "Cosmos D32s";
    case Sku.D64:
      return "Cosmos D64s";
    default:
      return "Unsupported Sku";
  }
};

const getSkus = async (): Promise<ChoiceItem[]> => {
  const skus = await getRegionSpecificSku();
  return skus.map((sku) => {
    return { label: getSkuLabel(sku), key: sku };
  });
};

function delay(delay: number) {
  return new Promise((res) => setTimeout(res, delay));
}

@IsDisplayable()
export default class SqlX extends SelfServeBaseClass {
  public onRefresh = async (): Promise<RefreshResult> => {
    await delay(1000);
    let refreshCount = parseInt(SessionStorageUtility.getEntry("refreshCount"));
    refreshCount = isNaN(refreshCount) ? 0 : refreshCount;
    refreshCount++;
    console.log(refreshCount);
    SessionStorageUtility.setEntry("refreshCount", refreshCount.toString());
    if (refreshCount % 5 === 0) {
      return { isComponentUpdating: false, notificationMessage: "done" };
    } else {
      return { isComponentUpdating: true, notificationMessage: "Updating Example Self Serve Component" };
    }
  };

  public validate = (currentvalues: Map<string, SmartUiInput>): string => {
    if (!currentvalues.get("sku").value || !currentvalues.get("instances").value) {
      return "SKU and instances should not be empty.";
    }
    return undefined;
  };

  public onSubmit = async (currentValues: Map<string, SmartUiInput>): Promise<SelfServeNotification> => {
    const enableDedicatedGateway = currentValues.get("enableDedicatedGateway")?.value as boolean;
    if (enableDedicatedGateway) {
      const sku = Sku[currentValues.get("sku")?.value as keyof typeof Sku];
      const instances = currentValues.get("instances")?.value as number;
      await updateDedicatedGatewayProvisioning(sku, instances);
    } else {
      await updateDedicatedGatewayProvisioning(undefined, undefined);
    }
    return { message: "submitted sqlX update successfully", type: MessageBarType.info };
  };

  public initialize = async (): Promise<Map<string, SmartUiInput>> => {
    const dedicatedGatewayResponse = await initializeDedicatedGatewayProvisioning();
    const defaults = new Map<string, SmartUiInput>();
    const enableDedicatedGateway = !dedicatedGatewayResponse.instances && !dedicatedGatewayResponse.sku ? false : true;
    defaults.set("enableDedicatedGateway", { value: enableDedicatedGateway, hidden: false });
    defaults.set("sku", { value: dedicatedGatewayResponse.sku, hidden: !enableDedicatedGateway });
    defaults.set("instances", { value: dedicatedGatewayResponse.instances, hidden: !enableDedicatedGateway });
    return defaults;
  };

  @Values({
    description: {
      text: "Provisioning dedicated gateways for SqlX accounts.",
      link: {
        href: "https://docs.microsoft.com/en-us/azure/cosmos-db/introduction",
        text: "Learn more about dedicated gateway.",
      },
    },
  })
  description: string;

  @OnChange(onEnableDedicatedGatewayChange)
  @Values({
    label: "Dedicated Gateway",
    trueLabel: "Enable",
    falseLabel: "Disable",
    uiType: BooleanUiType.Toggle,
  })
  enableDedicatedGateway: boolean;

  @Values({
    label: "SKUs",
    choices: getSkus,
    placeholder: "Select SKUs",
  })
  sku: ChoiceItem;

  @Values({
    label: "Number of instances",
    min: 1,
    max: 5,
    step: 1,
    uiType: NumberUiType.Spinner,
  })
  instances: number;
}
