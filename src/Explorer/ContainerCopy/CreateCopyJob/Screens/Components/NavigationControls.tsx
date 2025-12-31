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
    <PrimaryButton
      data-test="copy-job-primary"
      text={primaryBtnText}
      onClick={onPrimary}
      allowDisabledFocus
      disabled={isPrimaryDisabled}
    />
    <DefaultButton
      data-test="copy-job-previous"
      text="Previous"
      onClick={onPrevious}
      allowDisabledFocus
      disabled={isPreviousDisabled}
    />
    <DefaultButton data-test="copy-job-cancel" text="Cancel" onClick={onCancel} />
  </Stack>
);

export default React.memo(NavigationControls);
