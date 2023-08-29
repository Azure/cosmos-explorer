import { Callout, DirectionalHint, IconButton, Link, Stack, Text } from "@fluentui/react";
import { useId } from "@fluentui/react-hooks";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import React, { useState } from "react";
import LikeHover from "../../../../../../../../images/CopilotLikeHover.svg";
import LikePressed from "../../../../../../../../images/CopilotLikePressed.svg";
import LikeRest from "../../../../../../../../images/CopilotLikeRest.svg";

export const FeedbackButtons: React.FC = (): JSX.Element => {
  const { generatedQuery, userPrompt } = useQueryCopilot();

  const [likeQuery, setLikeQuery] = useState<boolean>(false);
  const [dislikeQuery, setDislikeQuery] = useState<boolean>(false);
  const [likeImageLink, setLikeImageLink] = useState<string>(LikeRest);
  const [dislikeImageLink, setDislikeImageLink] = useState<string>(LikeRest);
  const [calloutVisible, setCalloutVisible] = useState<boolean>(false);
  const likeBtnId = useId("likeBtn");
  const dislikeBtnId = useId("dislikeBtn");

  return (
    <Stack horizontal>
      {calloutVisible && (
        <Callout
          target={`#${likeBtnId}`}
          onDismiss={() => setCalloutVisible(false)}
          directionalHint={DirectionalHint.topCenter}
          role="dialog"
          style={{ padding: "5px 12px 5px 12px", borderRadius: "4px" }}
          styles={{ beakCurtain: { borderRadius: "4px" }, root: { borderRadius: "4px" } }}
        >
          <Text>
            {" "}
            <Text>
              Thank you. Need to give{" "}
              <Link
                onClick={() => {
                  setCalloutVisible(false);
                  useQueryCopilot.getState().openFeedbackModal(generatedQuery, true, userPrompt);
                }}
              >
                more feedback?
              </Link>
            </Text>
          </Text>
        </Callout>
      )}

      <IconButton
        id={likeBtnId}
        iconProps={{
          imageProps: { src: likeImageLink },
          style: { minHeight: "18px" },
        }}
        onClick={() => {
          if (likeQuery) {
            setLikeQuery(false);
            setLikeImageLink(LikeRest);
            setCalloutVisible(false);
          } else {
            setLikeQuery(true);
            setDislikeQuery(false);
            setLikeImageLink(LikePressed);
            setDislikeImageLink(LikeRest);
            setCalloutVisible(true);
          }
        }}
        onMouseOver={() => setLikeImageLink(LikeHover)}
        onMouseLeave={() => setLikeImageLink(likeQuery ? LikePressed : LikeRest)}
      />
      <IconButton
        id={dislikeBtnId}
        iconProps={{
          imageProps: { src: dislikeImageLink },
          style: { minHeight: "18px", transform: "rotate(180deg)" },
        }}
        onClick={() => {
          if (dislikeQuery) {
            setDislikeQuery(false);
            setDislikeImageLink(LikeRest);
          } else {
            setDislikeQuery(true);
            setLikeQuery(false);
            setDislikeImageLink(LikePressed);
            setLikeImageLink(LikeRest);
            useQueryCopilot.getState().openFeedbackModal(generatedQuery, false, userPrompt);
          }
        }}
        onMouseOver={() => setDislikeImageLink(LikeHover)}
        onMouseLeave={() => setDislikeImageLink(dislikeQuery ? LikePressed : LikeRest)}
      />
    </Stack>
  );
};
