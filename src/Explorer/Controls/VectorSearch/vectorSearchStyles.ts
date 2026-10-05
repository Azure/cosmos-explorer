import { IStyleFunctionOrObject, ITextFieldStyleProps, ITextFieldStyles } from "@fluentui/react";

export const labelStyles = {
  root: {
    fontSize: 12,
    color: "var(--colorNeutralForeground1)",
  },
};

export const textFieldStyles: IStyleFunctionOrObject<ITextFieldStyleProps, ITextFieldStyles> = {
  fieldGroup: {
    height: 27,
  },
  field: {
    fontSize: 12,
    padding: "0 8px",
    backgroundColor: "var(--colorNeutralBackground1)",
    color: "var(--colorNeutralForeground1)",
  },
};

export const dropdownStyles = {
  title: {
    height: 27,
    lineHeight: "24px",
    fontSize: 12,
  },
  dropdown: {
    height: 27,
    lineHeight: "24px",
  },
  dropdownItem: {
    fontSize: 12,
  },
};
