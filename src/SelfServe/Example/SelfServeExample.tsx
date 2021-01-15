import { PropertyInfo, OnChange, Values } from "../PropertyDecorators";
import { ClassInfo, IsDisplayable } from "../ClassDecorators";
import { SelfServeBaseClass } from "../SelfServeUtils";
import { ChoiceItem, Info, InputType, UiType } from "../../Explorer/Controls/SmartUi/SmartUiComponent";
import { SessionStorageUtility } from "../../Shared/StorageUtility";

export enum Regions {
  NorthCentralUS = "NCUS",
  WestUS = "WUS",
  EastUS2 = "EUS2"
}

export const regionDropdownItems: ChoiceItem[] = [
  { label: "North Central US", key: Regions.NorthCentralUS },
  { label: "West US", key: Regions.WestUS },
  { label: "East US 2", key: Regions.EastUS2 }
];

export const selfServeExampleInfo: Info = {
  message: "This is a self serve class"
};

export const regionDropdownInfo: Info = {
  message: "More regions can be added in the future."
};

export const delay = (ms: number): Promise<void> => {
  console.log("delay called");
  return new Promise(resolve => setTimeout(resolve, ms));
};

const onDbThroughputChange = (currentState: Map<string, InputType>, newValue: InputType): Map<string, InputType> => {
  currentState.set("dbThroughput", newValue);
  currentState.set("collectionThroughput", newValue);
  return currentState;
};

const initializeMaxThroughput = async (): Promise<number> => {
  await delay(2000);
  return 10000;
};

/*
  This is an example self serve class that auto generates UI components for your feature.

  Each self serve class
    - Needs to extends the SelfServeBase class.
    - Needs to have the @IsDisplayable() decorator to tell the compiler that UI needs to be generated from this class.
    - Needs to define an onSubmit() function, a callback for when the submit button is clicked.
    - Needs to define an initialize() function, to set default values for the inputs.

  You can test this self serve UI by using the featureflag '?feature.selfServeType=example'
  and plumb in similar feature flags for your own self serve class.
*/

/*
  @IsDisplayable()
    - role: Indicates to the compiler that UI should be generated from this class.
*/
@IsDisplayable()
/*
  @ClassInfo()
    - optional
    - input: Info | () => Promise<Info>
    - role: Display an Info bar as the first element of the UI.
*/
@ClassInfo(selfServeExampleInfo)
export default class SelfServeExample extends SelfServeBaseClass {
  /*
  onSubmit()
    - input: (currentValues: Map<string, InputType>) => Promise<void>
    - role: Callback that is triggerred when the submit button is clicked. You should perform your rest API
            calls here using the data from the different inputs passed as a Map to this callback function.

            In this example, the onSubmit callback simply sets the value for keys corresponding to the field name
            in the SessionStorage.
  */
  public onSubmit = async (currentValues: Map<string, InputType>): Promise<void> => {
    await delay(1000);
    SessionStorageUtility.setEntry("regions", currentValues.get("regions")?.toString());
    SessionStorageUtility.setEntry("enableLogging", currentValues.get("enableLogging")?.toString());
    SessionStorageUtility.setEntry("accountName", currentValues.get("accountName")?.toString());
    SessionStorageUtility.setEntry("dbThroughput", currentValues.get("dbThroughput")?.toString());
    SessionStorageUtility.setEntry("collectionThroughput", currentValues.get("collectionThroughput")?.toString());
  };

  /*
  initialize()
    - input: () => Promise<Map<string, InputType>>
    - role: Set default values for the properties of this class.

            The properties of this class (namely regions, enableLogging, accountName, dbThroughput, collectionThroughput),
            having the @Values decorator, will each correspond to an UI element. Their values can be of 'InputType'. Their 
            defaults can be set by setting values in a Map corresponding to the field's name.

            Typically, you can make rest calls in the async initialize function, to fetch the initial values for
            these fields. This is called after the onSubmit callback, to reinitialize the defaults.

            In this example, the initialize function simply reads the SessionStorage to fetch the default values
            for these fields. These are then set when the changes are submitted.
  */
  public initialize = async (): Promise<Map<string, InputType>> => {
    await delay(1000);
    const defaults = new Map<string, InputType>();
    defaults.set("regions", SessionStorageUtility.getEntry("regions"));
    defaults.set("enableLogging", SessionStorageUtility.getEntry("enableLogging") === "true");
    const stringInput = SessionStorageUtility.getEntry("accountName");
    defaults.set("accountName", stringInput ? stringInput : "");
    const numberSliderInput = parseInt(SessionStorageUtility.getEntry("dbThroughput"));
    defaults.set("dbThroughput", isNaN(numberSliderInput) ? 1 : numberSliderInput);
    const numberSpinnerInput = parseInt(SessionStorageUtility.getEntry("collectionThroughput"));
    defaults.set("collectionThroughput", isNaN(numberSpinnerInput) ? 1 : numberSpinnerInput);
    return defaults;
  };

  /*
  @PropertyInfo()
    - optional
    - input: Info | () => Promise<Info>
    - role: Display an Info bar above the UI element for this property.
  */
  @PropertyInfo(regionDropdownInfo)

  /*
  @Values() :
    - input: NumberInputOptions | StringInputOptions | BooleanInputOptions | ChoiceInputOptions
    - role: Specifies the required options to display the property as TextBox, Number Spinner/Slider, Radio buton or Dropdown.
  */
  @Values({ label: "Regions", choices: regionDropdownItems })
  regions: ChoiceItem;

  @Values({
    label: "Enable Logging",
    trueLabel: "Enable",
    falseLabel: "Disable"
  })
  enableLogging: boolean;

  @Values({
    label: "Account Name",
    placeholder: "Enter the account name"
  })
  accountName: string;

  /*
  @OnChange()
    - optional
    - input: (currentValues: Map<string, InputType>, newValue: InputType) => Map<string, InputType>
    - role: Takes a Map of current values and the newValue for this property as inputs. This is called when a property
            changes its value in the UI. This can be used to change other input values based on some other input.

            The new Map of propertyName -> value is returned.

            In this example, the onDbThroughputChange function sets the collectionThroughput to the same value as the dbThroughput
            when the slider in moved in the UI.
  */
  @OnChange(onDbThroughputChange)
  @Values({
    label: "Database Throughput",
    min: 400,
    max: initializeMaxThroughput,
    step: 100,
    uiType: UiType.Slider
  })
  dbThroughput: number;

  @Values({
    label: "Collection Throughput",
    min: 400,
    max: initializeMaxThroughput,
    step: 100,
    uiType: UiType.Spinner
  })
  collectionThroughput: number;
}
