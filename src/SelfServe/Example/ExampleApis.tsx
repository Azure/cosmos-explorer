import React from "react";
import { ChoiceItem, Info, InputType } from "../../Explorer/Controls/SmartUi/SmartUiComponent";
import { TextComponent } from "./CustomComponent";
import { SessionStorageUtility } from "../../Shared/StorageUtility";
import { Text } from "office-ui-fabric-react";

export enum Choices {
  Choice1 = "Choice1",
  Choice2 = "Choice2",
  Choice3 = "Choice3"
}

export const choiceOptions: ChoiceItem[] = [
  { label: "Choice 1", key: Choices.Choice1 },
  { label: "Choice 2", key: Choices.Choice2 },
  { label: "Choice 3", key: Choices.Choice3 }
];

export const selfServeExampleInfo: Info = {
  message: "This is a self serve class"
};

export const choiceInfo: Info = {
  message: "More choices can be added in the future."
};

export const onSliderChange = (currentState: Map<string, InputType>, newValue: InputType): Map<string, InputType> => {
  currentState.set("numberSliderInput", newValue);
  currentState.set("numberSpinnerInput", newValue);
  return currentState;
};

export const onSubmit = async (currentValues: Map<string, InputType>): Promise<void> => {
  SessionStorageUtility.setEntry("choiceInput", currentValues.get("choiceInput")?.toString());
  SessionStorageUtility.setEntry("booleanInput", currentValues.get("booleanInput")?.toString());
  SessionStorageUtility.setEntry("stringInput", currentValues.get("stringInput")?.toString());
  SessionStorageUtility.setEntry("numberSliderInput", currentValues.get("numberSliderInput")?.toString());
  SessionStorageUtility.setEntry("numberSpinnerInput", currentValues.get("numberSpinnerInput")?.toString());
};

const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const initializeSelfServeExample = async (): Promise<Map<string, InputType>> => {
  await delay(1000);
  const defaults = new Map<string, InputType>();
  defaults.set("choiceInput", SessionStorageUtility.getEntry("choiceInput"));
  defaults.set("booleanInput", SessionStorageUtility.getEntry("booleanInput") === "true");
  defaults.set("stringInput", SessionStorageUtility.getEntry("stringInput"));
  const numberSliderInput = parseInt(SessionStorageUtility.getEntry("numberSliderInput"));
  defaults.set("numberSliderInput", !isNaN(numberSliderInput) ? numberSliderInput : 1);
  const numberSpinnerInput = parseInt(SessionStorageUtility.getEntry("numberSpinnerInput"));
  defaults.set("numberSpinnerInput", !isNaN(numberSpinnerInput) ? numberSpinnerInput : 1);
  return defaults;
};

export const initializeNumberMaxValue = async (): Promise<number> => {
  await delay(2000);
  return 5;
};

export const descriptionElement = <Text>This is an example of Self serve class.</Text>;

export const renderText = (text: string): ((currentValues: Map<string, InputType>) => Promise<JSX.Element>) => {
  const elementPromiseFunction = async (currentValues: Map<string, InputType>): Promise<JSX.Element> => {
    return <TextComponent text={text} currentValues={currentValues} />;
  };
  return elementPromiseFunction;
};
