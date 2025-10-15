import { DefaultButton, PrimaryButton, Stack, Text } from "@fluentui/react";
import React from "react";

interface PopoverContainerProps {
    title?: string;
    children?: React.ReactNode;
    onPrimary: () => void;
    onCancel: () => void;
}

const PopoverContainer: React.FC<PopoverContainerProps> = React.memo(({ title, children, onPrimary, onCancel }) => {
    return (
        <Stack className="foreground" tokens={{ childrenGap: 20 }} style={{ maxWidth: 450 }}>
            <Text variant="mediumPlus" style={{ fontWeight: 600 }}>{title}</Text>
            <Text>{children}</Text>
            <Stack horizontal tokens={{ childrenGap: 20 }}>
                <PrimaryButton text="Yes" onClick={onPrimary} />
                <DefaultButton text="No" onClick={onCancel} />
            </Stack>
        </Stack>
    );
});

interface PopoverMessageProps {
    visible: boolean;
    title: string;
    onCancel: () => void;
    onPrimary: () => void;
    children: React.ReactNode;
}

const PopoverMessage: React.FC<PopoverMessageProps> = ({ visible, title, onCancel, onPrimary, children }) => {
    if (!visible) return null;
    return (
        <PopoverContainer title={title} onCancel={onCancel} onPrimary={onPrimary}>
            {children}
        </PopoverContainer>
    );
};

export default PopoverMessage;
