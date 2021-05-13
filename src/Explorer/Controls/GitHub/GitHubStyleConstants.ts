import {
  ICheckboxStyleProps,
  ICheckboxStyles,
  IDropdownStyleProps,
  IDropdownStyles,
  IStyleFunctionOrObject,
} from "@fluentui/react";

export const ButtonsFooterStyle: React.CSSProperties = {
  paddingTop: 14,
  height: "auto",
  borderTop: "2px solid lightGray",
};

export const ContentFooterStyle: React.CSSProperties = {
  paddingTop: "10px",
  height: "auto",
  borderTop: "2px solid lightGray",
};

export const ChildrenMargin = 10;
export const FontSize = 12;

export const ReposListCheckboxStyles: IStyleFunctionOrObject<ICheckboxStyleProps, ICheckboxStyles> = {
  label: {
    margin: 0,
    padding: "2 0 2 0",
  },
  text: {
    fontSize: FontSize,
  },
};

export const BranchesDropdownCheckboxStyles: IStyleFunctionOrObject<ICheckboxStyleProps, ICheckboxStyles> = {
  label: {
    margin: 0,
    padding: 0,
    fontSize: FontSize,
  },
  root: {
    padding: 0,
  },
  text: {
    fontSize: FontSize,
  },
};

export const BranchesDropdownStyles: IStyleFunctionOrObject<IDropdownStyleProps, IDropdownStyles> = {
  title: {
    fontSize: FontSize,
  },
};

export const BranchesDropdownOptionContainerStyle: React.CSSProperties = {
  padding: 8,
};

export const ContentMainStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

export const ReposListRepoColumnMinWidth = 192;
export const ReposListBranchesColumnWidth = 116;
export const BranchesDropdownWidth = 200;
