import { Stack, Text } from "@fluentui/react";
import { EditorReact } from "Explorer/Controls/Editor/EditorReact";
import { CopilotMessage } from "Explorer/QueryCopilot/Shared/QueryCopilotInterfaces";
import { OutputBubbleButtons } from "Explorer/QueryCopilot/V2/Bubbles/Output/Buttons/OutputBubbleButtons";
import { userContext } from "UserContext";
import React, { useState } from "react";

export const OutputBubble = ({ copilotMessage }: { copilotMessage: CopilotMessage }): JSX.Element => {
  const [windowHeight, setWindowHeight] = useState<string>();
  const textHeightWithPadding = 16;

  const calculateQueryWindowHeight = (): string => {
    const outputWidth = document.getElementById("outputBubble")?.clientWidth;
    const responseLength = copilotMessage.sqlQuery.length;

    if (outputWidth > responseLength) {
      return `${textHeightWithPadding * 3}px`;
    } else {
      const neededLines = Math.ceil(responseLength / outputWidth);
      return `${neededLines * textHeightWithPadding}px`;
    }
  };

  React.useEffect(() => {
    if (userContext.features.copilotChatFixedMonacoEditorHeight) {
      setWindowHeight(`${textHeightWithPadding * 5}px`);
    } else {
      setWindowHeight(calculateQueryWindowHeight());
    }
  }, []);

  return (
    <Stack
      id="outputBubble"
      style={{
        display: "flex",
        alignItems: "center",
        padding: "10px",
        margin: "10px",
        backgroundColor: "white",
        borderRadius: "8px",
      }}
      tokens={{ padding: 8, childrenGap: 8 }}
    >
      <Stack.Item style={{ alignSelf: "flex-start", paddingLeft: "2px" }}>{copilotMessage.message}</Stack.Item>
      <Stack.Item style={{ alignSelf: "stretch", flexGrow: 4 }}>
        <EditorReact
          language={"sql"}
          content={copilotMessage.sqlQuery}
          isReadOnly={true}
          ariaLabel={"AI Response"}
          wordWrap="on"
          lineNumbers="on"
          lineNumbersMinChars={2}
          lineDecorationsWidth={0}
          minimap={{ enabled: false }}
          scrollBeyondLastLine={false}
          monacoContainerStyles={{ height: windowHeight, borderRadius: "4px" }}
        />
      </Stack.Item>
      <Stack.Item style={{ alignSelf: "flex-start" }}>
        <OutputBubbleButtons sqlQuery={copilotMessage.sqlQuery} />
      </Stack.Item>
      <Stack.Item>
        <Text style={{ fontWeight: 400, fontSize: "10px", lineHeight: "14px" }}>
          AI-generated content may be incorrect
        </Text>
      </Stack.Item>
    </Stack>
  );
};
