import { PropertyInfo, OnChange, Values, IsDisplayable, ClassInfo } from "../Decorators";
import {
  ChoiceItem,
  Info,
  InputType,
  NumberUiType,
  RefreshResult,
  SelfServeBaseClass,
  SelfServeNotification,
  SelfServeNotificationType,
  SmartUiInput,
} from "../SelfServeTypes";
import { onRefreshSelfServeExample, getMaxThroughput, Regions, update, initialize } from "./SelfServeExample.rp";

const regionDropdownItems: ChoiceItem[] = [
  { label: "North Central US", key: Regions.NorthCentralUS },
  { label: "West US", key: Regions.WestUS },
  { label: "East US 2", key: Regions.EastUS2 },
];

const selfServeExampleInfo: Info = {
  message: "This is a self serve class",
};

const regionDropdownInfo: Info = {
  message: "More regions can be added in the future.",
};

const onRegionsChange = (currentState: Map<string, SmartUiInput>, newValue: InputType): Map<string, SmartUiInput> => {
  currentState.set("regions", { value: newValue });
  const currentEnableLogging = currentState.get("enableLogging");
  if (newValue === Regions.NorthCentralUS) {
    currentState.set("enableLogging", { value: false, disabled: true });
  } else {
    currentState.set("enableLogging", { value: currentEnableLogging.value, disabled: false });
  }
  return currentState;
};

const onEnableDbLevelThroughputChange = (
  currentState: Map<string, SmartUiInput>,
  newValue: InputType
): Map<string, SmartUiInput> => {
  currentState.set("enableDbLevelThroughput", { value: newValue });
  const currentDbThroughput = currentState.get("dbThroughput");
  const isDbThroughputHidden = newValue === undefined || !(newValue as boolean);
  currentState.set("dbThroughput", { value: currentDbThroughput.value, hidden: isDbThroughputHidden });
  return currentState;
};

const validate = (currentvalues: Map<string, SmartUiInput>): void => {
  if (!currentvalues.get("regions").value || !currentvalues.get("accountName").value) {
    throw new Error("Regions and AccountName should not be empty.");
  }
};

/*
  This is an example self serve class that auto generates UI components for your feature.

  Each self serve class
    - Needs to extends the SelfServeBase class.
    - Needs to have the @IsDisplayable() decorator to tell the compiler that UI needs to be generated from this class.
    - Needs to define an onSave() function, a callback for when the submit button is clicked.
    - Needs to define an initialize() function, to set default values for the inputs.
    - Needs to define an onRefresh() function, a callback for when the refresh button is clicked.

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
  onRefresh()
    - role : Callback that is triggerrd when the refresh button is clicked. You should perform the your rest API
             call to check if the update action is completed.
    - returns: 
            RefreshResult -
                isComponentUpdating: Indicated if the state is still being updated
                notificationMessage: Notification message to be shown in case the component is still being updated
                                     i.e, isComponentUpdating is true
  */
  public onRefresh = async (): Promise<RefreshResult> => {
    return onRefreshSelfServeExample();
  };

  /*
  onSave()
    - input: (currentValues: Map<string, InputType>) => Promise<void>
    - role: Callback that is triggerred when the submit button is clicked. You should perform your rest API
            calls here using the data from the different inputs passed as a Map to this callback function.

            In this example, the onSave callback simply sets the value for keys corresponding to the field name
            in the SessionStorage.
    - returns: SelfServeNotification -
                message: The message to be displayed in the message bar after the onSave is completed
                type: The type of message bar to be used (info, warning, error)
  */
  public onSave = async (currentValues: Map<string, SmartUiInput>): Promise<SelfServeNotification> => {
    validate(currentValues);
    const regions = Regions[currentValues.get("regions")?.value as keyof typeof Regions];
    const enableLogging = currentValues.get("enableLogging")?.value as boolean;
    const accountName = currentValues.get("accountName")?.value as string;
    const collectionThroughput = currentValues.get("collectionThroughput")?.value as number;
    const enableDbLevelThroughput = currentValues.get("enableDbLevelThroughput")?.value as boolean;
    let dbThroughput = currentValues.get("dbThroughput")?.value as number;
    dbThroughput = enableDbLevelThroughput ? dbThroughput : undefined;
    await update(regions, enableLogging, accountName, collectionThroughput, dbThroughput);
    return { message: "submitted successfully", type: SelfServeNotificationType.info };
  };

  /*
  initialize()
    - role: Set default values for the properties of this class.

            The properties of this class (namely regions, enableLogging, accountName, dbThroughput, collectionThroughput),
            having the @Values decorator, will each correspond to an UI element. Their values can be of 'InputType'. Their 
            defaults can be set by setting values in a Map corresponding to the field's name.

            Typically, you can make rest calls in the async initialize function, to fetch the initial values for
            these fields. This is called after the onSave callback, to reinitialize the defaults.

            In this example, the initialize function simply reads the SessionStorage to fetch the default values
            for these fields. These are then set when the changes are submitted.
    - returns: () => Promise<Map<string, InputType>>
  */
  public initialize = async (): Promise<Map<string, SmartUiInput>> => {
    const initializeResponse = await initialize();
    const defaults = new Map<string, SmartUiInput>();
    defaults.set("regions", { value: initializeResponse.regions });
    defaults.set("enableLogging", { value: initializeResponse.enableLogging });
    const accountName = initializeResponse.accountName;
    defaults.set("accountName", { value: accountName ? accountName : "" });
    defaults.set("collectionThroughput", { value: initializeResponse.collectionThroughput });
    const enableDbLevelThroughput = !!initializeResponse.dbThroughput;
    defaults.set("enableDbLevelThroughput", { value: enableDbLevelThroughput });
    defaults.set("dbThroughput", { value: initializeResponse.dbThroughput, hidden: !enableDbLevelThroughput });
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

  /*
  @OnChange()
    - optional
    - input: (currentValues: Map<string, InputType>, newValue: InputType) => Map<string, InputType>
    - role: Takes a Map of current values and the newValue for this property as inputs. This is called when a property,
            say prop1, changes its value in the UI. This can be used to 
            a) Change the value (and reflect it in the UI) for prop2 based on prop1.
            b) Change the visibility for prop2 in the UI, based on prop1

            The new Map of propertyName -> value is returned.

            In this example, the onRegionsChange function sets the enableLogging property to false (and disables
            the corresponsing toggle UI) when "regions" is set to "North Central US", and enables the toggle for 
            any other value of "regions"
  */
  @OnChange(onRegionsChange)
  @Values({ label: "Regions", choices: regionDropdownItems, placeholder: "Select a region" })
  regions: ChoiceItem;

  @Values({
    label: "Enable Logging",
    trueLabel: "Enable",
    falseLabel: "Disable",
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
    max: getMaxThroughput,
    step: 100,
    uiType: NumberUiType.Spinner,
  })
  collectionThroughput: number;

  /*
    In this example, the onEnableDbLevelThroughputChange function makes the dbThroughput property visible when
    enableDbLevelThroughput, a boolean, is set to true and hides dbThroughput property when it is set to false.
  */
  @OnChange(onEnableDbLevelThroughputChange)
  @Values({
    label: "Enable DB level throughput",
    trueLabel: "Enable",
    falseLabel: "Disable",
  })
  enableDbLevelThroughput: boolean;

  @Values({
    label: "Database Throughput",
    min: 400,
    max: getMaxThroughput,
    step: 100,
    uiType: NumberUiType.Slider,
  })
  dbThroughput: number;
}
