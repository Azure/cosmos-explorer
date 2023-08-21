import { IButtonStyles, IconButton, Image, Stack, TextField } from "@fluentui/react";
import { handleSendQueryRequest } from "Explorer/QueryCopilot/Shared/QueryCopilotClient";
import { QueryCopilotProps } from "Explorer/QueryCopilot/Shared/QueryCopilotInterfaces";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import React from "react";
import HintIcon from "../../../../../images/Hint.svg";
import { SamplePrompts, SamplePromptsProps } from "../../Shared/SamplePrompts/SamplePrompts";

export const Footer: React.FC<QueryCopilotProps> = ({ explorer }: QueryCopilotProps): JSX.Element => {
  const {
    userPrompt,
    setUserPrompt,
    isSamplePromptsOpen,
    setIsSamplePromptsOpen,
    isGeneratingQuery,
    setIsGeneratingQuery,
  } = useQueryCopilot();

  const promptStyles: IButtonStyles = {
    root: { border: "5px", selectors: { ":hover": { outline: "1px dashed #605e5c" } } },
    label: { fontWeight: 400, textAlign: "left", paddingLeft: 8 },
  };

  const sampleProps: SamplePromptsProps = {
    isSamplePromptsOpen: isSamplePromptsOpen,
    setIsSamplePromptsOpen: setIsSamplePromptsOpen,
    setTextBox: setUserPrompt,
  };

  const handleEnterKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      startSentMessageProcess();
    }
  };

  const startSentMessageProcess = async () => {
    await handleSendQueryRequest({ explorer });
  };

  return (
    <Stack
      horizontal
      horizontalAlign="end"
      verticalAlign="end"
      style={{
        display: "flex",
        alignItems: "center",
        borderRadius: "20px",
        background: "white",
        padding: "5px",
        margin: "5px",
      }}
    >
      <Stack>
        <Image src={HintIcon} styles={promptStyles} onClick={() => setIsSamplePromptsOpen(true)} />
        <SamplePrompts sampleProps={sampleProps} />
      </Stack>
      <TextField
        placeholder="Write your own prompt or ask a question"
        value={userPrompt}
        onChange={(_, newValue) => setUserPrompt(newValue)}
        onKeyDown={handleEnterKeyPress}
        multiline
        resizable={false}
        styles={{
          root: {
            width: "100%",
            height: "80px",
            borderRadius: "20px",
            padding: "8px",
            border: "none",
            outline: "none",
            marginLeft: "10px",
          },
          fieldGroup: { border: "none" },
        }}
      />
      <IconButton disabled={isGeneratingQuery} iconProps={{ iconName: "Send" }} onClick={startSentMessageProcess} />
    </Stack>
  );
};
