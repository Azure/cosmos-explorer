import {
  Checkbox,
  DefaultButton,
  IconButton,
  Link,
  Modal,
  PrimaryButton,
  Stack,
  Text,
  TextField,
} from "@fluentui/react";
import Explorer from "Explorer/Explorer";
import { useCopilotStore } from "Explorer/QueryCopilot/QueryCopilotContext";
import { SubmitFeedback } from "Explorer/QueryCopilot/Shared/QueryCopilotClient";
import React from "react";

export const QueryCopilotFeedbackModal = ({
  explorer,
  databaseId,
  containerId,
  mode,
}: {
  explorer: Explorer;
  databaseId: string;
  containerId: string;
  mode: string;
}): JSX.Element => {
  const {
    generatedQuery,
    userPrompt,
    likeQuery,
    showFeedbackModal,
    closeFeedbackModal,
    setHideFeedbackModalForLikedQueries,
  } = useCopilotStore();
  const [description, setDescription] = React.useState<string>("");
  const [doNotShowAgainChecked, setDoNotShowAgainChecked] = React.useState<boolean>(false);

  const handleSubmit = () => {
    closeFeedbackModal();
    setHideFeedbackModalForLikedQueries(doNotShowAgainChecked);
    SubmitFeedback({
      params: { generatedQuery, likeQuery, description, userPrompt },
      explorer,
      databaseId,
      containerId,
      mode: mode,
    });
  };

  return (
    <Modal isOpen={showFeedbackModal} styles={{ main: { borderRadius: 8, maxWidth: 600 } }}>
      <form onSubmit={handleSubmit}>
        <Stack style={{ padding: 24 }}>
          <Stack horizontal horizontalAlign="space-between">
            <Text style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>Send feedback to Microsoft</Text>
            <IconButton iconProps={{ iconName: "Cancel" }} onClick={() => closeFeedbackModal()} />
          </Stack>
          <Text style={{ fontSize: 14, marginBottom: 14 }}>Your feedback will help improve the experience.</Text>
          <TextField
            styles={{ root: { marginBottom: 14 } }}
            label="Description"
            required
            placeholder="Provide more details"
            value={description}
            onChange={(_, newValue) => setDescription(newValue)}
            multiline
            rows={3}
          />
          <TextField
            styles={{
              root: { marginBottom: 14 },
              fieldGroup: { backgroundColor: "#F3F2F1", borderRadius: 4, borderColor: "#D1D1D1" },
            }}
            label="Query generated"
            defaultValue={generatedQuery}
            multiline
            rows={3}
            readOnly
          />
          <Text style={{ fontSize: 12, marginBottom: 14 }}>
            Microsoft will process the feedback you submit pursuant to your organization’s instructions in order to
            improve your and your organization’s experience with this product. If you have any questions about the use
            of feedback data, please contact your tenant administrator. Processing of feedback data is governed by the
            Microsoft Products and Services Data Protection Addendum between your organization and Microsoft, and the
            feedback you submit is considered Personal Data under that addendum. Please see the{" "}
            {
              <Link href="https://go.microsoft.com/fwlink/?LinkId=521839" target="_blank">
                Privacy statement
              </Link>
            }{" "}
            for more information.
          </Text>
          {likeQuery && (
            <Checkbox
              styles={{ label: { paddingLeft: 0 }, root: { marginBottom: 14 } }}
              label="Don't show me this next time"
              checked={doNotShowAgainChecked}
              onChange={(_, checked) => setDoNotShowAgainChecked(checked)}
            />
          )}
          <Stack horizontal horizontalAlign="end">
            <PrimaryButton styles={{ root: { marginRight: 8 } }} type="submit">
              Submit
            </PrimaryButton>
            <DefaultButton onClick={() => closeFeedbackModal()}>Cancel</DefaultButton>
          </Stack>
        </Stack>
      </form>
    </Modal>
  );
};
