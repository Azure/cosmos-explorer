/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
import { DefaultButton, PrimaryButton, Stack, Text } from "@fluentui/react";
import React from "react";

interface PopoverContainerProps {
  isLoading?: boolean;
  title?: string;
  children?: React.ReactNode;
  onPrimary: () => void;
  onCancel: () => void;
}

const PopoverContainer: React.FC<PopoverContainerProps> = React.memo(
  ({ isLoading = false, title, children, onPrimary, onCancel }) => {
    return (
      <Stack
        className={`popover-container foreground ${isLoading ? "loading" : ""}`}
        tokens={{ childrenGap: 20 }}
        style={{ maxWidth: 450 }}
      >
        <Text variant="mediumPlus" style={{ fontWeight: 600 }}>
          {title}
        </Text>
        <Text>{children}</Text>
        <Stack horizontal tokens={{ childrenGap: 20 }}>
          <PrimaryButton
            text={isLoading ? "" : "Yes"}
            {...(isLoading ? { iconProps: { iconName: "SyncStatusSolid" } } : {})}
            onClick={onPrimary}
            disabled={isLoading}
          />
          <DefaultButton text="No" onClick={onCancel} disabled={isLoading} />
        </Stack>
      </Stack>
    );
  },
);

interface PopoverMessageProps {
  isLoading?: boolean;
  visible: boolean;
  title: string;
  onCancel: () => void;
  onPrimary: () => void;
  children: React.ReactNode;
}

const PopoverMessage: React.FC<PopoverMessageProps> = ({
  isLoading = false,
  visible,
  title,
  onCancel,
  onPrimary,
  children,
}) => {
  if (!visible) {
    return null;
  }
  return (
    <PopoverContainer title={title} onCancel={onCancel} onPrimary={onPrimary} isLoading={isLoading}>
      {children}
    </PopoverContainer>
  );
};

export default PopoverMessage;
