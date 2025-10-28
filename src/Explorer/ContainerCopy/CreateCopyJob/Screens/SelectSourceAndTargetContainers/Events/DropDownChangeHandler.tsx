import React from "react";
import { CopyJobContextState, DropdownOptionType } from "../../../../Types";

export function dropDownChangeHandler(setCopyJobState: React.Dispatch<React.SetStateAction<CopyJobContextState>>) {
  return (type: "sourceDatabase" | "sourceContainer" | "targetDatabase" | "targetContainer") =>
    (_evnt: React.FormEvent, option: DropdownOptionType) => {
      const value = option.key;
      setCopyJobState((prevState) => {
        switch (type) {
          case "sourceDatabase":
            return {
              ...prevState,
              source: { ...prevState.source, databaseId: value, containerId: undefined },
            };
          case "sourceContainer":
            return {
              ...prevState,
              source: { ...prevState.source, containerId: value },
            };
          case "targetDatabase":
            return {
              ...prevState,
              target: { ...prevState.target, databaseId: value, containerId: undefined },
            };
          case "targetContainer":
            return {
              ...prevState,
              target: { ...prevState.target, containerId: value },
            };
          default:
            return prevState;
        }
      });
    };
}
