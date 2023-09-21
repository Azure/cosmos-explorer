import { Stack, Text } from "@fluentui/react";
import { CopilotMessage } from "Explorer/QueryCopilot/Shared/QueryCopilotInterfaces";
import { FeedbackButtons } from "Explorer/QueryCopilot/V2/Bubbles/Output/Buttons/Feedback/FeedbackButtons";
import React from "react";

export const ExplanationBubble = ({ copilotMessage }: { copilotMessage: CopilotMessage }): JSX.Element => {
  return (
    <Stack
      horizontalAlign="start"
      verticalAlign="start"
      tokens={{ padding: 8, childrenGap: 8 }}
      style={{
        backgroundColor: "white",
        borderRadius: "8px",
        margin: "5px 10px",
        textAlign: "start",
      }}
    >
      <Text>{copilotMessage.message}</Text>
      <FeedbackButtons sqlQuery={copilotMessage.sqlQuery} />
      <Text style={{ fontWeight: 400, fontSize: "10px", lineHeight: "14px" }}>
        AI-generated content may be incorrect
      </Text>
    </Stack>
  );
};
