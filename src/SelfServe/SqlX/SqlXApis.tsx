import { Text } from "office-ui-fabric-react";
import React from "react";
import { ChoiceItem, Info, InputType } from "../../Explorer/Controls/SmartUi/SmartUiComponent";

export enum Sizes {
  OneCore4Gb = "OneCore4Gb",
  TwoCore8Gb = "TwoCore8Gb",
  FourCore16Gb = "FourCore16Gb"
}

export const instanceSizeOptions: ChoiceItem[] = [
  { label: Sizes.OneCore4Gb, key: Sizes.OneCore4Gb, value: Sizes.OneCore4Gb },
  { label: Sizes.TwoCore8Gb, key: Sizes.TwoCore8Gb, value: Sizes.TwoCore8Gb },
  { label: Sizes.FourCore16Gb, key: Sizes.FourCore16Gb, value: Sizes.FourCore16Gb }
];

export const sqlXInfo: Info = {
  message: "SqlX is a self serve class"
};

export const instanceSizeInfo: Info = {
  message: "instance size will be updated in the future"
};

export const onInstanceCountChange = (
  currentState: Map<string, InputType>,
  newValue: InputType
): Map<string, InputType> => {
  currentState.set("instanceCount", newValue);
  if ((newValue as number) === 1) {
    currentState.set("isAllowed", false);
  }
  return currentState;
};

export const onSubmit = async (currentValues: Map<string, InputType>): Promise<void> => {
  console.log(
    "instanceCount:" +
      currentValues.get("instanceCount") +
      ", instanceSize:" +
      currentValues.get("instanceSize") +
      ", instanceName:" +
      currentValues.get("instanceName") +
      ", isAllowed:" +
      currentValues.get("isAllowed")
  );
};

export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const getPromise = <T extends number | string | boolean | ChoiceItem[] | Info>(value: T): (() => Promise<T>) => {
  const f = async (): Promise<T> => {
    console.log("delay start");
    await delay(100);
    console.log("delay end");
    return value;
  };
  return f;
};

export const renderTextInput = async (): Promise<JSX.Element> => {
  return <Text>SqlX is a new feature of Cosmos DB.</Text>;
};
