import { DefaultButton, FontIcon, Image, Layer, Overlay, Popup, Stack, Text } from "@fluentui/react";
import React, { Dispatch, SetStateAction } from "react";
import ComplexPrompts from "../../../../images/ComplexPrompts.svg";
import IntermediatePrompts from "../../../../images/IntermediatePrompts.svg";
import SimplePrompts from "../../../../images/SimplePrompts.svg";
import "./SamplePrompts.css";

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

  return sampleProps.isSamplePromptsOpen ? (
    <Layer>
      <Popup
        className="sampleBox"
        role="dialog"
        aria-modal="true"
        onDismiss={() => sampleProps.setIsSamplePromptsOpen(false)}
      >
        <div className="sampleContent">
          <Overlay onClick={() => sampleProps.setIsSamplePromptsOpen(false)} />
          <Stack>
            <Stack className="inlineElements">
              <Text className="sampleHeader">Sample Prompts</Text>
              <DefaultButton className="closeButton" onClick={() => sampleProps.setIsSamplePromptsOpen(false)}>
                X
              </DefaultButton>
            </Stack>
            <Text className="sampleDescription">
              Here are some sample prompts for writing queries in NoSQL, ranging from simple to complex
            </Text>
          </Stack>

          <Stack className="titleLogo">
            <Stack horizontal verticalAlign="center">
              <Image className="imageStlye" src={SimplePrompts} />
              <Text className="promptDifficulty">Simple Prompts</Text>
            </Stack>
          </Stack>

          <Stack horizontal className="inlineButtons">
            <DefaultButton className="defaultButton" onClick={() => updateTextBox(SampleUserInputs[0])}>
              <Text className="buttonText">{SampleUserInputs[0]}</Text>
              <FontIcon className="arrowPosition" aria-label="Forward" iconName="Forward" />
            </DefaultButton>
            <DefaultButton className="defaultButton" onClick={() => updateTextBox(SampleUserInputs[1])}>
              <Text className="buttonText">{SampleUserInputs[1]}</Text>
              <FontIcon className="arrowPosition" aria-label="Forward" iconName="Forward" />
            </DefaultButton>
          </Stack>

          <Stack className="titleLogo">
            <Stack horizontal verticalAlign="center">
              <Image className="imageStlye" src={IntermediatePrompts} />
              <Text className="promptDifficulty">Intermediate Prompts</Text>
            </Stack>
          </Stack>

          <Stack horizontal className="inlineButtons">
            <DefaultButton className="defaultButton" onClick={() => updateTextBox(SampleUserInputs[2])}>
              <Text className="buttonText">{SampleUserInputs[2]}</Text>
              <FontIcon className="arrowPosition" aria-label="Forward" iconName="Forward" />
            </DefaultButton>
            <DefaultButton className="defaultButton" onClick={() => updateTextBox(SampleUserInputs[3])}>
              <Text className="buttonText">{SampleUserInputs[3]}</Text>
              <FontIcon className="arrowPosition" aria-label="Forward" iconName="Forward" />
            </DefaultButton>
          </Stack>

          <Stack className="titleLogo">
            <Stack horizontal verticalAlign="center">
              <Image className="imageStlye" src={ComplexPrompts} />
              <Text className="promptDifficulty">Complex Prompts</Text>
            </Stack>
          </Stack>

          <Stack horizontal className="inlineButtons">
            <DefaultButton className="defaultButton" onClick={() => updateTextBox(SampleUserInputs[4])}>
              <Text className="buttonText">{SampleUserInputs[4]}</Text>
              <FontIcon className="arrowPosition" aria-label="Forward" iconName="Forward" />
            </DefaultButton>
            <DefaultButton className="defaultButton" onClick={() => updateTextBox(SampleUserInputs[5])}>
              <Text className="buttonText">{SampleUserInputs[5]}</Text>
              <FontIcon className="arrowPosition" aria-label="Forward" iconName="Forward" />
            </DefaultButton>
          </Stack>
        </div>
      </Popup>
    </Layer>
  ) : (
    <></>
  );
};
