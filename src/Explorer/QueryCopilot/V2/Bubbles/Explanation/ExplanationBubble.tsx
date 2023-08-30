import { Stack, Text } from "@fluentui/react";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import React from "react";

export const ExplanationBubble: React.FC = (): JSX.Element => {
  const {
    showExplanationBubble,
    isGeneratingQuery,
    showQueryExplanation,
    setShowQueryExplanation,
    chatMessages,
    setChatMessages,
    generatedQueryComments,
    isGeneratingExplanation,
    setIsGeneratingExplanation,
    shouldIncludeInMessages,
    setShouldIncludeInMessages,
  } = useQueryCopilot();

  const showExplanation = () => {
    setChatMessages([...chatMessages, { source: 0, message: "Explain this query to me" }]);
    setIsGeneratingExplanation(true);
    setShouldIncludeInMessages(true);

    setTimeout(() => {
      setIsGeneratingExplanation(false);
      setShowQueryExplanation(true);
    }, 3000);
  };

  return (
    showExplanationBubble &&
    !isGeneratingQuery &&
    !isGeneratingExplanation &&
    (showQueryExplanation && shouldIncludeInMessages ? (
      <Stack
        horizontalAlign="center"
        tokens={{ padding: 8, childrenGap: 8 }}
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          margin: "5px 10px",
          textAlign: "start",
        }}
      >
        {generatedQueryComments}
      </Stack>
    ) : (
      <Stack
        style={{
          display: "flex",
          alignItems: "center",
          padding: "5px 5px 5px 40px",
          margin: "5px",
          width: "100%",
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
    ))
  );
};
