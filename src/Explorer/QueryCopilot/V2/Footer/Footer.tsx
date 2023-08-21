import { IButtonStyles, IconButton, Image, Stack, TextField } from "@fluentui/react";
import { QueryCopilotSampleContainerSchema } from "Common/Constants";
import { handleError } from "Common/ErrorHandlingUtils";
import { sendQueryRequest } from "Explorer/QueryCopilot/Shared/QueryCopilotClient";
import { GenerateSQLQueryResponse, QueryCopilotProps } from "Explorer/QueryCopilot/Shared/QueryCopilotInterfaces";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import { useTabs } from "hooks/useTabs";
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
    chatMessages,
    setChatMessages,
    shouldAllocateContainer,
    setShouldAllocateContainer,
    setGeneratedQueryComments,
    setGeneratedQuery,
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

  const handleSentQueryRequest = async (): Promise<void> => {
    if (userPrompt.trim() !== "") {
      setIsGeneratingQuery(true);
      useTabs.getState().setIsTabExecuting(true);
      useTabs.getState().setIsQueryErrorThrown(false);
      setChatMessages([...chatMessages, { source: 0, message: userPrompt }]);
      try {
        if (shouldAllocateContainer) {
          await explorer.allocateContainer();
          setShouldAllocateContainer(false);
        }
        const payload = {
          containerSchema: QueryCopilotSampleContainerSchema,
          userPrompt: userPrompt,
        };
        const response = await sendQueryRequest(payload);

        const generateSQLQueryResponse: GenerateSQLQueryResponse = await response?.json();
        if (response.status === 404) {
          setShouldAllocateContainer(true);
        }
        if (response.ok) {
          if (generateSQLQueryResponse?.sql) {
            let query = `Here is a query which will help you with provided prompt.\r\n **Prompt:** ${userPrompt}`;
            query += `\r\n${generateSQLQueryResponse.sql}`;
            setChatMessages([
              ...chatMessages,
              { source: 0, message: userPrompt },
              { source: 1, message: query, explanation: generateSQLQueryResponse.explanation },
            ]);
            setGeneratedQuery(generateSQLQueryResponse.sql);
            setGeneratedQueryComments(generateSQLQueryResponse.explanation);
          }
        } else {
          handleError(JSON.stringify(generateSQLQueryResponse), "copilotInternalServerError");
          useTabs.getState().setIsQueryErrorThrown(true);
        }
      } catch (error) {
        handleError(error, "executeNaturalLanguageQuery");
        useTabs.getState().setIsQueryErrorThrown(true);
        throw error;
      } finally {
        setUserPrompt("");
        setIsGeneratingQuery(false);
        useTabs.getState().setIsTabExecuting(false);
      }
    }
  };

  const startSentMessageProcess = async () => {
    await handleSentQueryRequest();
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
        disabled={isGeneratingQuery}
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
