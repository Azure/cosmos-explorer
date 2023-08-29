import { Stack, Text } from "@fluentui/react";
import { EditorReact } from "Explorer/Controls/Editor/EditorReact";
import { OutputBubbleButtons } from "Explorer/QueryCopilot/V2/Bubbles/Output/Buttons/OutputBubbleButtons";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import React, { useState } from "react";

export const OutputBubble: React.FC = (): JSX.Element => {
  const [windowHeight, setWindowHeight] = useState<string>();

  const calculateQueryWindowHeight = (): string => {
    const calculatedHeight = document.getElementById("outputBubble")?.clientHeight * (3 / 5);
    return `${calculatedHeight}px`;
  };

  React.useEffect(() => {
    setWindowHeight(calculateQueryWindowHeight());
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
      <Stack.Item style={{ alignSelf: "flex-start", paddingLeft: "2px" }}>
        {useQueryCopilot.getState()?.generatedQueryComments}
      </Stack.Item>
      <Stack.Item style={{ alignSelf: "stretch", flexGrow: 4 }}>
        <EditorReact
          language={"sql"}
          content={useQueryCopilot.getState()?.generatedQuery}
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
        <OutputBubbleButtons />
      </Stack.Item>
      <Stack.Item>
        <Text style={{ fontWeight: 400, fontSize: "10px", lineHeight: "14px" }}>
          AI-generated content may be incorrect
        </Text>
      </Stack.Item>
    </Stack>
  );
};
