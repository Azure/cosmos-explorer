import { DefaultButton, Modal, PrimaryButton, Stack, Text } from "@fluentui/react";
import React, { Dispatch, SetStateAction } from "react";

export const DeletePopup = ({
  showDeletePopup,
  setShowDeletePopup,
  setQuery,
  clearFeedback,
  showFeedbackBar,
}: {
  showDeletePopup: boolean;
  setShowDeletePopup: Dispatch<SetStateAction<boolean>>;
  setQuery: Dispatch<SetStateAction<string>>;
  clearFeedback: Dispatch<SetStateAction<void>>;
  showFeedbackBar: Dispatch<SetStateAction<boolean>>;
}): JSX.Element => {
  const deleteCode = () => {
    setQuery("");
    setShowDeletePopup(false);
    clearFeedback();
    showFeedbackBar(false);
  };

  return (
    <Modal
      isOpen={showDeletePopup}
      styles={{ main: { minHeight: "122px", minWidth: "880px" } }}
      titleAriaId="deleteDialogTitle"
      subtitleAriaId="deleteDialogSubTitle"
    >
      <Stack style={{ padding: "16px 24px", height: "auto" }}>
        <Text id="deleteDialogTitle" style={{ height: 24, fontSize: "18px" }}>
          <b>Delete code?</b>
        </Text>
        <Text id="deleteDialogSubTitle" style={{ marginTop: 10, marginBottom: 20 }}>
          This will clear the query from the query builder pane along with all comments and also reset the prompt pane
        </Text>
        <Stack horizontal tokens={{ childrenGap: 10 }} horizontalAlign="start">
          <PrimaryButton style={{ padding: "0px 20px", height: 24 }} onClick={deleteCode}>
            Delete
          </PrimaryButton>
          <DefaultButton style={{ padding: "0px 20px", height: 24 }} onClick={() => setShowDeletePopup(false)}>
            Close
          </DefaultButton>
        </Stack>
      </Stack>
    </Modal>
  );
};
