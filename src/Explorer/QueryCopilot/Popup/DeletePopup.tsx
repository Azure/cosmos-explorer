import { DefaultButton, FocusTrapZone, Layer, Overlay, Popup, PrimaryButton, Stack, Text } from "@fluentui/react";
import React, { Dispatch, SetStateAction } from "react";
import "./DeletePopup.css";

export const DeletePopup = ({
  showDeletePopup,
  setShowDeletePopup,
  setQuery,
}: {
  showDeletePopup: boolean;
  setShowDeletePopup: Dispatch<SetStateAction<boolean>>;
  setQuery: Dispatch<SetStateAction<string>>;
}): JSX.Element => {
  function deleteCode() {
    setQuery("");
    setShowDeletePopup(false);
  }

  return (
    <>
      {showDeletePopup && (
        <Layer>
          <Popup className="popupRoot" role="dialog" aria-modal="true" onDismiss={() => setShowDeletePopup(false)}>
            <Overlay onClick={() => setShowDeletePopup(false)} />
            <FocusTrapZone>
              <Stack role="document">
                <Text className="deleteCodeHeader">Delete code?</Text>
                <Text className="deleteCodeText">
                  This will clear the query from the query builder pane along with all comments and also reset the
                  prompt pane
                </Text>
              </Stack>
              <Stack className="popUpButtonsBar">
                <PrimaryButton className="deletePopUpButton" onClick={deleteCode}>
                  Delete
                </PrimaryButton>
                <DefaultButton className="cancelPopupButton" onClick={() => setShowDeletePopup(false)}>
                  Close
                </DefaultButton>
              </Stack>
            </FocusTrapZone>
          </Popup>
        </Layer>
      )}
    </>
  );
};
