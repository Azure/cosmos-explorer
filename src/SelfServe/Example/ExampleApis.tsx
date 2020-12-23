import React from "react";
import { ChoiceItem, Info, InputType } from "../../Explorer/Controls/SmartUi/SmartUiComponent";
import { TextComponent } from "./CustomComponent";
import {SessionStorageUtility} from "../../Shared/StorageUtility"

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

export const selfServeExampleInfo: Info = {
  message: "This is a self serve class"
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
    currentState.set("instanceSize", Sizes.OneCore4Gb);
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

  SessionStorageUtility.setEntry("instanceCount", currentValues.get("instanceCount")?.toString())
  SessionStorageUtility.setEntry("instanceSize", currentValues.get("instanceSize")?.toString())
  SessionStorageUtility.setEntry("instanceName", currentValues.get("instanceName")?.toString())
  SessionStorageUtility.setEntry("isAllowed", currentValues.get("isAllowed")?.toString())
};

export const initializeSelfServeExample = async () : Promise<Map<string, InputType>> => {
  let defaults = new Map<string, InputType>()
  defaults.set("instanceCount",  parseInt(SessionStorageUtility.getEntry("instanceCount")))
  defaults.set("instanceSize",  SessionStorageUtility.getEntry("instanceSize"))
  defaults.set("instanceName",  SessionStorageUtility.getEntry("instanceName"))
  defaults.set("isAllowed",  SessionStorageUtility.getEntry("isAllowed") === "true")
  return defaults
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

export const renderText = (text: string) : (currentValues: Map<string, InputType>) => Promise<JSX.Element> => {
  const f = async (currentValues: Map<string, InputType>): Promise<JSX.Element> => {
    return <TextComponent text={text} currentValues={currentValues}/>
  };
  return f
}
