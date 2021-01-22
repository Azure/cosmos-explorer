import { PropertyInfo, OnChange, Values } from "../PropertyDecorators";
import { ClassInfo, IsDisplayable } from "../ClassDecorators";
import { SelfServeBaseClass } from "../SelfServeUtils";
import {
  BooleanUiType,
  ChoiceItem,
  Info,
  InputType,
  NumberUiType,
  SmartUiInput,
} from "../../Explorer/Controls/SmartUi/SmartUiComponent";
import { SessionStorageUtility } from "../../Shared/StorageUtility";

export enum Regions {
  NorthCentralUS = "NCUS",
  WestUS = "WUS",
  EastUS2 = "EUS2",
}

export const regionDropdownItems: ChoiceItem[] = [
  { label: "North Central US", key: Regions.NorthCentralUS },
  { label: "West US", key: Regions.WestUS },
  { label: "East US 2", key: Regions.EastUS2 },
];

export const selfServeExampleInfo: Info = {
  message: "This is a self serve class",
};

export const regionDropdownInfo: Info = {
  message: "More regions can be added in the future.",
};

const onDbThroughputChange = (
  currentState: Map<string, SmartUiInput>,
  newValue: InputType
): Map<string, SmartUiInput> => {
  currentState.set("dbThroughput", { value: newValue, hidden: false });
  currentState.set("collectionThroughput", { value: newValue, hidden: false });
  return currentState;
};

const onEnableDbLevelThroughputChange = (
  currentState: Map<string, SmartUiInput>,
  newValue: InputType
): Map<string, SmartUiInput> => {
  currentState.set("enableDbLevelThroughput", { value: newValue, hidden: false });
  const currentDbThroughput = currentState.get("dbThroughput");
  const isDbThroughputHidden = newValue === undefined || !(newValue as boolean);
  currentState.set("dbThroughput", { value: currentDbThroughput.value, hidden: isDbThroughputHidden });
  return currentState;
};

const initializeMaxThroughput = async (): Promise<number> => {
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
  public validate = (currentvalues: Map<string, SmartUiInput>): string => {
    console.log(currentvalues.get("regions"), currentvalues.get("accountName"));
    if (!currentvalues.get("regions").value || !currentvalues.get("accountName").value) {
      return "Regions and AccountName should not be empty.";
    }
    return undefined;
  };

  /*
  onSubmit()
    - input: (currentValues: Map<string, InputType>) => Promise<void>
    - role: Callback that is triggerred when the submit button is clicked. You should perform your rest API
            calls here using the data from the different inputs passed as a Map to this callback function.

            In this example, the onSubmit callback simply sets the value for keys corresponding to the field name
            in the SessionStorage.
  */
  public onSubmit = async (currentValues: Map<string, SmartUiInput>): Promise<string> => {
    SessionStorageUtility.setEntry("regions", currentValues.get("regions")?.value?.toString());
    SessionStorageUtility.setEntry("enableLogging", currentValues.get("enableLogging")?.value?.toString());
    SessionStorageUtility.setEntry("accountName", currentValues.get("accountName")?.value?.toString());
    SessionStorageUtility.setEntry(
      "collectionThroughput",
      currentValues.get("collectionThroughput")?.value?.toString()
    );
    SessionStorageUtility.setEntry(
      "enableDbLevelThroughput",
      currentValues.get("enableDbLevelThroughput")?.value?.toString()
    );
    SessionStorageUtility.setEntry("dbThroughput", currentValues.get("dbThroughput")?.value?.toString());
    return "submitted successfully";
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
  public initialize = async (): Promise<Map<string, SmartUiInput>> => {
    const defaults = new Map<string, SmartUiInput>();
    defaults.set("regions", { value: SessionStorageUtility.getEntry("regions"), hidden: false });
    defaults.set("enableLogging", { value: SessionStorageUtility.getEntry("enableLogging") === "true", hidden: false });
    const stringInput = SessionStorageUtility.getEntry("accountName");
    defaults.set("accountName", { value: stringInput ? stringInput : "", hidden: false });
    const collectionThroughput = parseInt(SessionStorageUtility.getEntry("collectionThroughput"));
    defaults.set("collectionThroughput", {
      value: isNaN(collectionThroughput) ? undefined : collectionThroughput,
      hidden: false,
    });
    const enableDbLevelThroughput = SessionStorageUtility.getEntry("enableDbLevelThroughput") === "true";
    defaults.set("enableDbLevelThroughput", { value: enableDbLevelThroughput, hidden: false });
    const dbThroughput = parseInt(SessionStorageUtility.getEntry("dbThroughput"));
    defaults.set("dbThroughput", {
      value: isNaN(dbThroughput) ? undefined : dbThroughput,
      hidden: !enableDbLevelThroughput,
    });
    return defaults;
  };

  /*
  @Values() :
    - input: NumberInputOptions | StringInputOptions | BooleanInputOptions | ChoiceInputOptions | DescriptionDisplay
    - role: Specifies the required options to display the property as 
            a) TextBox for text input
            b) Spinner/Slider for number input
            c) Radio buton/Toggle for boolean input
            d) Dropdown for choice input
            e) Text (with optional hyperlink) for descriptions
  */
  @Values({
    description: {
      text: "This class sets collection and database throughput.",
      link: {
        href: "https://docs.microsoft.com/en-us/azure/cosmos-db/introduction",
        text: "Click here for more information",
      },
    },
  })
  description: string;
  /*
  @PropertyInfo()
    - optional
    - input: Info | () => Promise<Info>
    - role: Display an Info bar above the UI element for this property.
  */
  @PropertyInfo(regionDropdownInfo)
  @Values({ label: "Regions", choices: regionDropdownItems, placeholder: "Select a region" })
  regions: ChoiceItem;

  @Values({
    label: "Enable Logging",
    trueLabel: "Enable",
    falseLabel: "Disable",
    uiType: BooleanUiType.RadioButton,
  })
  enableLogging: boolean;

  @Values({
    label: "Account Name",
    placeholder: "Enter the account name",
  })
  accountName: string;

  @Values({
    label: "Collection Throughput",
    min: 400,
    max: initializeMaxThroughput,
    step: 100,
    uiType: NumberUiType.Spinner,
  })
  collectionThroughput: number;

  /*
  @OnChange()
    - optional
    - input: (currentValues: Map<string, InputType>, newValue: InputType) => Map<string, InputType>
    - role: Takes a Map of current values and the newValue for this property as inputs. This is called when a property,
            say prop1, changes its value in the UI. This can be used to 
            a) Change the value (and reflect it in the UI) for prop2 based on prop1.
            b) Change the visibility for prop2 in the UI, based on prop1

            The new Map of propertyName -> value is returned.

            In this example, the onEnableDbLevelThroughputChange function makes the dbThroughput property visible when
            enableDbLevelThroughput, a boolean, is set to true and hides dbThroughput property when it is set to false.
  */

  @OnChange(onEnableDbLevelThroughputChange)
  @Values({
    label: "Enable DB level throughput",
    trueLabel: "Enable",
    falseLabel: "Disable",
    uiType: BooleanUiType.Toggle,
  })
  enableDbLevelThroughput: boolean;

  /*
    In this example, the onDbThroughputChange function sets the collectionThroughput to the same value as the dbThroughput
    when the slider in moved in the UI.
  */
  @OnChange(onDbThroughputChange)
  @Values({
    label: "Database Throughput",
    min: 400,
    max: initializeMaxThroughput,
    step: 100,
    uiType: NumberUiType.Slider,
  })
  dbThroughput: number;
}
