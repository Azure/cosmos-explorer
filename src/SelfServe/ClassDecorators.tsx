import { Info } from "../Explorer/Controls/SmartUi/SmartUiComponent";
import { addPropertyToMap, buildSmartUiDescriptor } from "./SelfServeUtils";

export const IsDisplayable = (): ClassDecorator => {
  return (target: Function) => {
    buildSmartUiDescriptor(target.name, target.prototype);
  };
};

export const ClassInfo = (info: (() => Promise<Info>) | Info): ClassDecorator => {
  return (target: Function) => {
    addPropertyToMap(target.prototype, "root", target.name, "info", info);
  };
};
