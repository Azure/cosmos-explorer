import { Info } from "../Explorer/Controls/SmartUi/SmartUiComponent";
import { addPropertyToMap, buildSmartUiDescriptor } from "./SelfServeUtils";

export const IsDisplayable = (): ClassDecorator => {
  //eslint-disable-next-line @typescript-eslint/ban-types
  return (target: Function) => {
    buildSmartUiDescriptor(target.name, target.prototype);
  };
};

export const ClassInfo = (info: (() => Promise<Info>) | Info): ClassDecorator => {
  //eslint-disable-next-line @typescript-eslint/ban-types
  return (target: Function) => {
    addPropertyToMap(target.prototype, "root", target.name, "info", info);
  };
};
