import { DefaultButton, PrimaryButton, Stack } from "@fluentui/react";
import React from "react";

type NavigationControlsProps = {
  primaryBtnText: string;
  onPrimary: () => void;
  onPrevious: () => void;
  onCancel: () => void;
  isPrimaryDisabled: boolean;
  isPreviousDisabled: boolean;
};

const NavigationControls: React.FC<NavigationControlsProps> = ({
  primaryBtnText,
  onPrimary,
  onPrevious,
  onCancel,
  isPrimaryDisabled,
  isPreviousDisabled,
}) => (
  <Stack horizontal tokens={{ childrenGap: 20 }}>
    <PrimaryButton text={primaryBtnText} onClick={onPrimary} allowDisabledFocus disabled={isPrimaryDisabled} />
    <DefaultButton text="Previous" onClick={onPrevious} allowDisabledFocus disabled={isPreviousDisabled} />
    <DefaultButton text="Cancel" onClick={onCancel} />
  </Stack>
);

export default React.memo(NavigationControls);
