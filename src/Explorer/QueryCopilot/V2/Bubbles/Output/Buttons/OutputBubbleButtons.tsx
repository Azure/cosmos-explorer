import { Stack } from "@fluentui/react";
import { CopyButton } from "Explorer/QueryCopilot/V2/Bubbles/Output/Buttons/Copy/CopyButton";
import { FeedbackButtons } from "Explorer/QueryCopilot/V2/Bubbles/Output/Buttons/Feedback/FeedbackButtons";
import { InsertButton } from "Explorer/QueryCopilot/V2/Bubbles/Output/Buttons/Insert/InsertButton";
import { MoreButton } from "Explorer/QueryCopilot/V2/Bubbles/Output/Buttons/More/MoreButton";
import React from "react";

export const OutputBubbleButtons = ({ sqlQuery }: { sqlQuery: string }): JSX.Element => {
  return (
    <Stack horizontal>
      <Stack.Item style={{ paddingTop: "5px" }}>
        <InsertButton sqlQuery={sqlQuery} />
      </Stack.Item>
      <Stack.Item>
        <CopyButton sqlQuery={sqlQuery} />
      </Stack.Item>
      <Stack.Item>
        <FeedbackButtons sqlQuery={sqlQuery} />
      </Stack.Item>
      <Stack.Item>
        <MoreButton />
      </Stack.Item>
    </Stack>
  );
};
