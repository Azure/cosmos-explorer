import { Stack, Text } from "@fluentui/react";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import React from "react";

export const ExplanationButton: React.FC = (): JSX.Element => {
  const {
    showExplanationBubble,
    isGeneratingQuery,
    chatMessages,
    setChatMessages,
    generatedQuery,
    generatedQueryComments,
    isGeneratingExplanation,
    setIsGeneratingExplanation,
    setShouldIncludeInMessages,
    setShowExplanationBubble,
  } = useQueryCopilot();

  const showExplanation = () => {
    setChatMessages([...chatMessages, { source: 0, message: "Explain this query to me" }]);
    setIsGeneratingExplanation(true);
    setShouldIncludeInMessages(true);
    setShowExplanationBubble(false);

    setTimeout(() => {
      if (useQueryCopilot.getState().shouldIncludeInMessages) {
        setIsGeneratingExplanation(false);
        setChatMessages([...chatMessages, { source: 2, message: generatedQueryComments, sqlQuery: generatedQuery }]);
      }
    }, 3000);
  };

  return (
    showExplanationBubble &&
    !isGeneratingQuery &&
    !isGeneratingExplanation && (
      <Stack
        style={{
          display: "flex",
          alignItems: "center",
          padding: "5px 5px 5px 50px",
          margin: "5px",
        }}
      >
        <Text
          onClick={showExplanation}
          style={{
            cursor: "pointer",
            border: "1.5px solid #B0BEFF",
            width: "100%",
            padding: "2px",
            borderRadius: "4px",
            marginBottom: "5px",
          }}
        >
          Explain this query to me
        </Text>
      </Stack>
    )
  );
};
