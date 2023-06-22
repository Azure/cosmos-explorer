import { DefaultButton, FontIcon, IconButton, Image, Modal, Stack, Text } from "@fluentui/react";
import React, { Dispatch, SetStateAction } from "react";
import ComplexPrompts from "../../../../images/ComplexPrompts.svg";
import IntermediatePrompts from "../../../../images/IntermediatePrompts.svg";
import SimplePrompts from "../../../../images/SimplePrompts.svg";

export interface SamplePromptsProps {
  isSamplePromptsOpen: boolean;
  setIsSamplePromptsOpen: Dispatch<SetStateAction<boolean>>;
  setTextBox: Dispatch<SetStateAction<string>>;
}

const SampleUserInputs: string[] = [
  "Show me products less than 100 dolars",
  "Show schema",
  "Show items with a description that contains a number between 0 and 99 inclusive.",
  "Write a query to return all records in this table created in the last thirty days",
  "Show all the products that customer Bob has reviewed.",
  "Which computers are more than 300 dollars and less than 400 dollars?",
];

export const SamplePrompts = ({ sampleProps }: { sampleProps: SamplePromptsProps }): JSX.Element => {
  function updateTextBox(userInput: string) {
    sampleProps.setTextBox(userInput);
    sampleProps.setIsSamplePromptsOpen(false);
  }

  return (
    <Modal isOpen={sampleProps.isSamplePromptsOpen}>
      <Stack
        style={{ padding: "16px 24px", overflowY: "auto", maxHeight: "calc(100vh - 120px)" }}
        role="dialog"
        aria-modal="true"
      >
        <Stack>
          <Stack horizontal style={{ display: "flex", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 24, fontWeight: 600 }}>Sample Prompts</Text>
            <IconButton
              styles={{
                root: {
                  border: "none",
                  backgroundColor: "transparent",
                  padding: 0,
                  selectors: {
                    "&:hover": {
                      backgroundColor: "transparent",
                      color: "#000", // Set the desired color for the X button on hover
                    },
                    "&:focus": {
                      outline: "none",
                    },
                  },
                },
              }}
              iconProps={{ iconName: "Cancel" }}
              onClick={() => sampleProps.setIsSamplePromptsOpen(false)}
            />
          </Stack>
          <Text style={{ fontWeight: 400, fontSize: 13, marginTop: 10 }}>
            Here are some sample prompts for writing queries in NoSQL, ranging from simple to complex
          </Text>
        </Stack>

        <Stack style={{ marginTop: 30, display: "flex" }}>
          <Stack horizontal verticalAlign="center">
            <Image style={{ width: 25, height: 25 }} src={SimplePrompts} />
            <Text style={{ fontSize: 14, fontWeight: 600 }}>Simple Prompts</Text>
          </Stack>
        </Stack>

        <Stack horizontal style={{ gap: 35 }}>
          <DefaultButton
            style={{ width: 352, height: 135, background: "#F6F6F7" }}
            onClick={() => updateTextBox(SampleUserInputs[0])}
          >
            <Text style={{ height: 80, fontSize: 13 }}>{SampleUserInputs[0]}</Text>
            <FontIcon style={{ position: "absolute", left: "92.61%" }} aria-label="Forward" iconName="Forward" />
          </DefaultButton>
          <DefaultButton
            style={{ width: 352, height: 135, background: "#F6F6F7" }}
            onClick={() => updateTextBox(SampleUserInputs[1])}
          >
            <Text style={{ height: 80, fontSize: 13 }}>{SampleUserInputs[1]}</Text>
            <FontIcon style={{ position: "absolute", left: "92.61%" }} aria-label="Forward" iconName="Forward" />
          </DefaultButton>
        </Stack>

        <Stack style={{ marginTop: 30, display: "flex" }}>
          <Stack horizontal verticalAlign="center">
            <Image style={{ width: 25, height: 25 }} src={IntermediatePrompts} />
            <Text style={{ fontSize: 14, fontWeight: 600 }}>Intermediate Prompts</Text>
          </Stack>
        </Stack>

        <Stack horizontal style={{ gap: 35 }}>
          <DefaultButton
            style={{ width: 352, height: 135, background: "#F6F6F7" }}
            onClick={() => updateTextBox(SampleUserInputs[2])}
          >
            <Text style={{ height: 80, fontSize: 13 }}>{SampleUserInputs[2]}</Text>
            <FontIcon style={{ position: "absolute", left: "92.61%" }} aria-label="Forward" iconName="Forward" />
          </DefaultButton>
          <DefaultButton
            style={{ width: 352, height: 135, background: "#F6F6F7" }}
            onClick={() => updateTextBox(SampleUserInputs[3])}
          >
            <Text style={{ height: 80, fontSize: 13 }}>{SampleUserInputs[3]}</Text>
            <FontIcon style={{ position: "absolute", left: "92.61%" }} aria-label="Forward" iconName="Forward" />
          </DefaultButton>
        </Stack>

        <Stack style={{ marginTop: 30, display: "flex" }}>
          <Stack horizontal verticalAlign="center">
            <Image style={{ width: 25, height: 25 }} src={ComplexPrompts} />
            <Text style={{ fontSize: 14, fontWeight: 600 }}>Complex Prompts</Text>
          </Stack>
        </Stack>

        <Stack horizontal style={{ gap: 35 }}>
          <DefaultButton
            style={{ width: 352, height: 135, background: "#F6F6F7" }}
            onClick={() => updateTextBox(SampleUserInputs[4])}
          >
            <Text style={{ height: 80, fontSize: 13 }}>{SampleUserInputs[4]}</Text>
            <FontIcon style={{ position: "absolute", left: "92.61%" }} aria-label="Forward" iconName="Forward" />
          </DefaultButton>
          <DefaultButton
            style={{ width: 352, height: 135, background: "#F6F6F7" }}
            onClick={() => updateTextBox(SampleUserInputs[5])}
          >
            <Text style={{ height: 80, fontSize: 13 }}>{SampleUserInputs[5]}</Text>
            <FontIcon style={{ position: "absolute", left: "92.61%" }} aria-label="Forward" iconName="Forward" />
          </DefaultButton>
        </Stack>
      </Stack>
    </Modal>
  );
};
