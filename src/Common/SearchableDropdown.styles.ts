import { IButtonStyles, IStackStyles, ITextStyles } from "@fluentui/react";
import * as React from "react";

export const getDropdownButtonStyles = (disabled: boolean): IButtonStyles => ({
  root: {
    width: "100%",
    height: "32px",
    padding: "0 28px 0 8px",
    border: "1px solid #8a8886",
    background: "#fff",
    color: "#323130",
    textAlign: "left",
    cursor: disabled ? "not-allowed" : "pointer",
    position: "relative",
  },
  label: {
    fontWeight: "normal",
    fontSize: "14px",
  },
});

export const buttonLabelStyles: ITextStyles = {
  root: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    display: "block",
  },
};

export const chevronStyles: React.CSSProperties = {
  position: "absolute",
  right: "8px",
  top: "50%",
  transform: "translateY(-50%)",
  pointerEvents: "none",
};

export const calloutContentStyles: IStackStyles = {
  root: {
    display: "flex",
    flexDirection: "column",
  },
};

export const listContainerStyles: IStackStyles = {
  root: {
    maxHeight: "300px",
    overflowY: "auto",
  },
};

export const getItemStyles = (isSelected: boolean): React.CSSProperties => ({
  padding: "8px 12px",
  cursor: "pointer",
  fontSize: "14px",
  backgroundColor: isSelected ? "#e6e6e6" : "transparent",
});

export const emptyMessageStyles: ITextStyles = {
  root: {
    padding: "8px 12px",
    color: "#605e5c",
  },
};
