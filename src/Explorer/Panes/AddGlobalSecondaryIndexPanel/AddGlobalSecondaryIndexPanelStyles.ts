import { IDropdownStyleProps, IDropdownStyles, IStyleFunctionOrObject } from "@fluentui/react";
import { CSSProperties } from "react";

export function chooseSourceContainerStyles(): IStyleFunctionOrObject<IDropdownStyleProps, IDropdownStyles> {
  return {
    title: { height: 27, lineHeight: 27 },
    dropdownItem: { fontSize: 12 },
    dropdownItemDisabled: { fontSize: 12 },
    dropdownItemSelected: { fontSize: 12 },
  };
}

export function chooseSourceContainerStyle(): CSSProperties {
  return { width: 300, fontSize: 12 };
}
