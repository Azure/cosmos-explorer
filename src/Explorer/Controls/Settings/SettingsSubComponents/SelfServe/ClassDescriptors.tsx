import { Descriptor, Info } from "../../../SmartUi/SmartUiComponent";
import { addPropertyToMap, DescriptorType, toSmartUiDescriptor } from "./SelfServeUtils";

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

export const ClassInfo = (info: Info): ClassDecorator => {
  return (target: Function) => {
    addPropertyToMap(target, "root", target.name, "info", info, DescriptorType.ClassDescriptor);
  };
};
