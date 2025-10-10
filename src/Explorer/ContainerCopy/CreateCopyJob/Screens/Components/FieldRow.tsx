import { Stack } from "@fluentui/react";
import React from "react";

interface FieldRowProps {
    label?: string;
    children: React.ReactNode;
    labelClassName?: string;
}

const FieldRow: React.FC<FieldRowProps> = ({ label = "", children, labelClassName = "" }) => {
    return (
        <Stack horizontal horizontalAlign="space-between" className="flex-row">
            {
                label && (
                    <Stack.Item align="center" className="flex-fixed-width">
                        <label className={`field-label ${labelClassName}`}>{label}: </label>
                    </Stack.Item>
                )
            }
            <Stack.Item align="center" className="flex-grow-col">
                {children}
            </Stack.Item>
        </Stack>
    );
};

export default FieldRow;
