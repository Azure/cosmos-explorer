import {
  Label,
  ParentOf,
  PropertyInfo,
  OnChange,
  Placeholder,
  CustomElement,
  ChoiceInput,
  BooleanInput,
  NumberInput
} from "../PropertyDescriptors";
import { SmartUi, ClassInfo, OnSubmit, Initialize } from "../ClassDescriptors";
import {
  initializeSelfServeExample,
  choiceInfo,
  choiceOptions,
  onSliderChange,
  onSubmit,
  renderText,
  selfServeExampleInfo,
  descriptionElement,
  initializeNumberMaxValue
} from "./ExampleApis";
import { SelfServeBase } from "../SelfServeUtils";
import { ChoiceItem } from "../../Explorer/Controls/SmartUi/SmartUiComponent";

/*
This is an example self serve class that auto generates UI components for your feature.

Each self serve class
  - Needs to extends the SelfServeBase class.
  - Needs to have the @SmartUi() descriptor to tell the compiler that UI needs to be generated from this class.
  - Needs to have an @OnSubmit() descriptor, a callback for when the submit button is clicked.
  - Needs to have an @Initialize() descriptor, to set default values for the inputs.

You can test this self serve UI by using the featureflag '?feature.selfServeTypeForTest=example'
and plumb in similar feature flags for your own self serve class.

The default values and functions used for this class can be found in ExampleApis.tsx
*/

/*
@SmartUi()
  - role: Generated the JSON required to convert this class into the required UI. This is done during compile time.
*/
@SmartUi()
/*
@OnSubmit() 
  - input: (currentValues: Map<string, InputType>) => Promise<void>
  - role: Callback that is triggerred when the submit button is clicked. You should perform your rest API 
          calls here using the data from the different inputs passed as a Map to this callback function.

          In this example, the onSubmit callback simply sets the value for keys corresponding to the field name
          in the SessionStorage.
*/
@OnSubmit(onSubmit)
/*
@ClassInfo()
  - input: Info | () => Promise<Info>
  - role: Display an Info bar as the first element of the UI.
*/
@ClassInfo(selfServeExampleInfo)
/*
@Initialize() 
  - input: () => Promise<Map<string, InputType>>
  - role: Set default values for the properties of this class.

          The static properties of this class (namely choiceInput, booleanInput, stringInput, numberSliderInput, numberSpinnerInput)
          will each correspond to an UI element. Their values can be of 'InputType'. Their defaults can be set by setting 
          values in a Map corresponding to the field's name. 

          Typically, you can make rest calls in the async function passed to @Initialize() to fetch the initial values for 
          these fields. This is called after the onSubmit callback, to reinitialize the defaults.

          In this example, the initializeSelfServeExample function simply reads the SessionStorage to fetch the default values
          for these fields. These are then set when the changes are submitted.
*/
@Initialize(initializeSelfServeExample)
export class SelfServeExample extends SelfServeBase {
  /*
  @CustomElement()
    - input: JSX.Element | (currentValues: Map<string, InputType> => Promise<JSX.Element>)
    - role: Display a custom element by either passing the element itself, or by passing a function that takes the current values
            and renders a Component / JSX.Element.

            In this example, we first use a static JSX.Element to show a description text. We also declare a CustomComponent, that 
            takes a Map of propertyName -> value, as input. It uses this to display a Hoverable Card which shows a snapshot of 
            the current values.
  */
  @CustomElement(descriptionElement)
  static description: string;

  /*
  @ParentOf()
    - input: string[]
    - role: Determines which UI elements are the children of which UI element. An array containing the names of the child properties 
            is passsed. You need to make sure these children are declared in this Class as proeprties.
  */
  @ParentOf(["choiceInput", "booleanInput", "stringInput", "numberSliderInput", "numberSpinnerInput"])
  @CustomElement(renderText("Hover to see current values..."))
  static currentValues: string;

  /*
  @Label()
    - input: string | () => Promise<string>
    - role: Adds a label for the UI element. This is ignored for a custom element but is required for all other properties.
  */
  @Label("Choice")

  /*
  @PropertyInfo()
    - input: Info | () => Promise<Info>
    - role: Display an Info bar above the UI element for this property.
  */
  @PropertyInfo(choiceInfo)

  /*
  @ChoiceInput()
    - input: ChoiceItem[] | () => Promise<ChoiceItem[]>
    - role: Display a dropdown with choices.
  */
  @ChoiceInput(choiceOptions)
  static choiceInput: ChoiceItem;

  @Label("Boolean")
  /*
  @BooleanInput()
    - input: 
        trueLabel : string | () => Promise<string>
        falseLabel : string | () => Promise<string>
    - role: Add a boolean input eith radio buttons for true and false values.
  */
  @BooleanInput({
    trueLabel: "allowed",
    falseLabel: "not allowed"
  })
  static booleanInput: boolean;

  @Label("String")
  /*
  @PlaceHolder()
    - input: string | () => Promise<string>
    - role: Adds a placeholder for the string input
  */
  @Placeholder("instance name")
  static stringInput: string;

  @Label("Slider")

  /*
  @OnChange()
    - input: (currentValues: Map<string, InputType>, newValue: InputType) => Map<string, InputType>
    - role: Takes a Map of current values and the newValue for this property as inputs. This is called when a property 
            changes its value in the UI. This can be used to change other input values based on some other input.
            
            The new Map of propertyName -> value is returned.

            In this example, the onSliderChange function sets the spinner input to the same value as the slider input
            when the slider in moved in the UI.
  */
  @OnChange(onSliderChange)

  /*
  @NumberInput()
    - input: 
        min : number | () => Promise<number>
        max : number | () => Promise<number>
        step : number | () => Promise<number>
        numberInputType : NumberInputType
    - role: Display a numeric input as slider or a spinner. The Min, Max and step to increase by need to be provided as well.
            In this example, the Max value is fetched via an async function. This is resolved every time the UI is reloaded.
  */
  @NumberInput({
    min: 1,
    max: initializeNumberMaxValue,
    step: 1,
    numberInputType: "slider"
  })
  static numberSliderInput: number;

  @Label("Spinner")
  @NumberInput({
    min: 1,
    max: initializeNumberMaxValue,
    step: 1,
    numberInputType: "spinner"
  })
  static numberSpinnerInput: number;
}
