import { MessageBar, MessageBarType, Stack } from "@fluentui/react";
import React from "react";
import { useCopyJobContext } from "../../Context/CopyJobContext";
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
    primaryBtnText,
  } = useCopyJobNavigation();
  const { contextError, setContextError } = useCopyJobContext();

  return (
    <Stack verticalAlign="space-between" className="createCopyJobScreensContainer">
      <Stack.Item className="createCopyJobScreensContent">
        {contextError && (
          <MessageBar
            className="createCopyJobErrorMessageBar"
            messageBarType={MessageBarType.blocked}
            isMultiline={false}
            onDismiss={() => setContextError(null)}
            dismissButtonAriaLabel="Close"
            truncated={true}
            overflowButtonAriaLabel="See more"
          >
            {contextError}
          </MessageBar>
        )}
        {currentScreen?.component}
      </Stack.Item>
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
