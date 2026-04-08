import { Stack, Text } from "@fluentui/react";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import React from "react";

export const SampleBubble: React.FC = (): JSX.Element => {
  const { setUserPrompt } = useQueryCopilot();

  const sampleChatMessages: string[] = [
    "Write a query to return last 10 records in the database",
    'Write a query to return all records in this table created in the last thirty days which also have the record owner as "Contoso"',
  ];

  return (
    <Stack
      horizontalAlign="end"
      verticalAlign="end"
      style={{
        display: "flex",
        alignItems: "center",
        padding: "10px",
        margin: "10px",
      }}
    >
      {sampleChatMessages.map((text, index) => (
        <Text
          key={index}
          onClick={() => setUserPrompt(text)}
          style={{
            cursor: "pointer",
            border: "1.5px solid #B0BEFF",
            width: "100%",
            padding: "2px",
            borderRadius: "4px",
            marginBottom: "5px",
          }}
        >
          {text}
        </Text>
      ))}
    </Stack>
  );
};
