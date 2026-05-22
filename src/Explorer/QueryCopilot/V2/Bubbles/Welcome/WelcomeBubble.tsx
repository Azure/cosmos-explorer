import { Stack, Text } from "@fluentui/react";
import React from "react";

export const WelcomeBubble: React.FC = (): JSX.Element => {
  return (
    <Stack>
      <Stack horizontalAlign="center" style={{ color: "#707070" }} tokens={{ padding: 8, childrenGap: 8 }}>
        {new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
        })}{" "}
        {new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        })}
      </Stack>
      <Stack
        tokens={{ padding: 16, childrenGap: 12 }}
        style={{
          backgroundColor: "white",
          margin: "5px 10px",
          borderRadius: "8px",
        }}
      >
        <Text variant="medium">
          Hello, I am Cosmos Db&apos;s copilot assistant. I can help you do the following things:
        </Text>
        <Stack tokens={{ childrenGap: 8 }}>
          <Stack horizontal style={{ marginLeft: "15px" }} tokens={{ childrenGap: 8 }}>
            <Text style={{ fontSize: "16px", lineHeight: "16px", verticalAlign: "middle" }}>•</Text>
            <Text style={{ verticalAlign: "middle" }}>Generate queries based upon prompt you suggest</Text>
          </Stack>
          <Stack horizontal style={{ marginLeft: "15px" }} tokens={{ childrenGap: 8 }}>
            <Text style={{ fontSize: "16px", lineHeight: "16px", verticalAlign: "middle" }}>•</Text>
            <Text style={{ verticalAlign: "middle" }}>
              Explain and provide alternate queries for a query suggested by you
            </Text>
          </Stack>
          <Stack horizontal style={{ marginLeft: "15px" }} tokens={{ childrenGap: 8 }}>
            <Text style={{ fontSize: "16px", lineHeight: "16px", verticalAlign: "middle" }}>•</Text>
            <Text style={{ verticalAlign: "middle" }}>Help answer questions about Cosmos DB</Text>
          </Stack>
        </Stack>
        <Text variant="medium">
          To get started, ask me a question or use one of the sample prompts to generate a query. AI-generated content
          may be incorrect.
        </Text>
      </Stack>
    </Stack>
  );
};
