import { Icon, Image, IPivotItemProps, Stack } from "@fluentui/react";
import React from "react";
import Pivot1SelectedIcon from "../../../../images/Pivot1_selected.svg";
import Pivot2Icon from "../../../../images/Pivot2.svg";
import Pivot2SelectedIcon from "../../../../images/Pivot2_selected.svg";
import Pivot3Icon from "../../../../images/Pivot3.svg";
import Pivot3SelectedIcon from "../../../../images/Pivot3_selected.svg";
import Pivot4Icon from "../../../../images/Pivot4.svg";
import Pivot4SelectedIcon from "../../../../images/Pivot4_selected.svg";
import Pivot5Icon from "../../../../images/Pivot5.svg";
import Pivot5SelectedIcon from "../../../../images/Pivot5_selected.svg";

const getPivotHeaderIcon = (currentStep: number, newStep: number): string => {
  switch (newStep) {
    case 0:
      return Pivot1SelectedIcon;
    case 1:
      return newStep === currentStep ? Pivot2SelectedIcon : Pivot2Icon;
    case 2:
      return newStep === currentStep ? Pivot3SelectedIcon : Pivot3Icon;
    case 3:
      return newStep === currentStep ? Pivot4SelectedIcon : Pivot4Icon;
    case 4:
      return newStep === currentStep ? Pivot5SelectedIcon : Pivot5Icon;
    default:
      return "";
  }
};

export const customPivotHeaderRenderer = (
  link: IPivotItemProps,
  defaultRenderer: (link?: IPivotItemProps) => JSX.Element | null,
  currentStep: number,
  newStep: number,
): JSX.Element | null => {
  if (!link || !defaultRenderer) {
    return null;
  }

  return (
    <Stack horizontal verticalAlign="center">
      {currentStep > newStep ? (
        <Icon iconName="CompletedSolid" style={{ color: "#57A300", marginRight: 8 }} />
      ) : (
        <Image style={{ marginRight: 8 }} src={getPivotHeaderIcon(currentStep, newStep)} />
      )}
      {defaultRenderer({ ...link, itemIcon: undefined })}
    </Stack>
  );
};
