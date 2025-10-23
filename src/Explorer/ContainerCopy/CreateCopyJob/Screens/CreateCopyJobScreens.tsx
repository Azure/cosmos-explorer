import { Stack } from "@fluentui/react";
import React from "react";
import { useCopyJobNavigation } from "../Utils/useCopyJobNavigation";
import NavigationControls from "./Components/NavigationControls";

const CreateCopyJobScreens: React.FC = () => {
    const {
        currentScreen,
        isPrimaryDisabled,
        isPreviousDisabled,
        handlePrimary,
        handlePrevious,
        handleCancel,
        primaryBtnText
    } = useCopyJobNavigation();

    return (
        <Stack verticalAlign="space-between" className="createCopyJobScreensContainer">
            <Stack.Item className="createCopyJobScreensContent">{currentScreen?.component}</Stack.Item>
            <Stack.Item className="createCopyJobScreensFooter">
                <NavigationControls
                    primaryBtnText={primaryBtnText}
                    onPrimary={handlePrimary}
                    onPrevious={handlePrevious}
                    onCancel={handleCancel}
                    isPrimaryDisabled={isPrimaryDisabled}
                    isPreviousDisabled={isPreviousDisabled}
                />
            </Stack.Item>
        </Stack>
    );
};

export default CreateCopyJobScreens;
