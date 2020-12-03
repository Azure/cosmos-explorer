import { Descriptor, Info, InputType } from "../../../SmartUi/SmartUiComponent";
import { addPropertyToMap, toSmartUiDescriptor } from "./SelfServeUtils";

interface SelfServeBaseCLass {
  toSmartUiDescriptor: () => Descriptor;
}

export function SelfServeClass() {
  return <U extends SelfServeBaseCLass>(constructor: U) => {
    constructor;
  };
}

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
