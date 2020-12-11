import { Info, InputType } from "../Explorer/Controls/SmartUi/SmartUiComponent";
import { addPropertyToMap, toSmartUiDescriptor } from "./SelfServeUtils";

export const SmartUi = (): ClassDecorator => {
  return (target: Function) => {
    toSmartUiDescriptor(target.name, target);
  };
};

export const ClassInfo = (info: (() => Promise<Info>) | Info): ClassDecorator => {
  return (target: Function) => {
    addPropertyToMap(target, "root", target.name, "info", info);
  };
};

export const OnSubmit = (onSubmit: (currentValues: Map<string, InputType>) => Promise<void>): ClassDecorator => {
  return (target: Function) => {
    addPropertyToMap(target, "root", target.name, "onSubmit", onSubmit);
  };
};

export const Initialize = (initialize: () => Promise<Map<string, InputType>>): ClassDecorator => {
  return (target: Function) => {
    addPropertyToMap(target, "root", target.name, "initialize", initialize);
  };
};
