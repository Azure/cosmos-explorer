import { DefaultButton, Image, Stack, Text } from "@fluentui/react";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import React from "react";
import StopGeneratingIcon from "../../../../../../images/StopGenerating.svg";
import "./RetrievingBubble.css";

export const RetrievingBubble = (): JSX.Element => {
  const {
    isGeneratingQuery,
    setIsGeneratingQuery,
    isGeneratingExplanation,
    setIsGeneratingExplanation,
    shouldIncludeInMessages,
    setShouldIncludeInMessages,
  } = useQueryCopilot();

  const stopGenerating = () => {
    if (isGeneratingQuery) {
      setIsGeneratingQuery(false);
    }
    if (isGeneratingExplanation) {
      setIsGeneratingExplanation(false);
    }
    if (shouldIncludeInMessages) {
      setShouldIncludeInMessages(false);
    }
  };

  const bubbleContent = (bubbleType: string) => {
    return (
      <Stack
        horizontalAlign="end"
        verticalAlign="end"
        style={{
          display: "flex",
          alignItems: "center",
          padding: "10px",
          margin: "10px",
          backgroundColor: "#FAFAFA",
          borderRadius: "8px",
        }}
      >
        <Text
          style={{
            width: "100%",
            height: "46px",
            backgroundColor: "white",
            padding: "12px 16px 16px 16px",
            gap: "12px",
            borderRadius: "8px",
            fontWeight: "bold",
          }}
        >
          Retriveing {bubbleType}
        </Text>
        <div
          style={{
            width: "100%",
            height: "4px",
            backgroundColor: "#E6E6E6",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "50%",
              height: "100%",
              backgroundColor: "#0078D4",
              animation: "loadingAnimation 2s linear infinite",
            }}
          ></div>
        </div>
        <Stack
          horizontalAlign="center"
          verticalAlign="center"
          style={{ marginTop: "8px", gap: "8px", alignItems: "center" }}
        >
          <DefaultButton
            onClick={stopGenerating}
            styles={{ root: { border: "none", background: "none", padding: 0, color: "#424242" } }}
            style={{ color: "#424242" }}
            onRenderIcon={() => <Image src={StopGeneratingIcon} />}
          >
            Stop generating
          </DefaultButton>
        </Stack>
      </Stack>
    );
  };

  return (
    <>
      {isGeneratingQuery && bubbleContent("queries")}
      {isGeneratingExplanation && bubbleContent("explanation")}
    </>
  );
};
