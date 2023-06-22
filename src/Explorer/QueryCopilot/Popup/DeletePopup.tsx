import { DefaultButton, Modal, PrimaryButton, Stack, Text } from "@fluentui/react";
import React, { Dispatch, SetStateAction } from "react";

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
    <Modal isOpen={showDeletePopup}>
      <Stack style={{ padding: "16px 24px", height: "auto" }}>
        <Text style={{ height: 24, fontSize: "18px" }}>
          <b>Delete code?</b>
        </Text>
        <Text style={{ marginTop: 10, display: "inline" }}>
          This will clear the query from the query builder pane along with all comments and also reset the prompt pane
        </Text>
        <Stack style={{ display: "inline-block", marginTop: 50 }}>
          <PrimaryButton
            style={{ padding: "10px 20px", width: "fit-content", height: 24, background: "#0078D4" }}
            onClick={deleteCode}
          >
            Delete
          </PrimaryButton>
          <DefaultButton
            style={{ marginLeft: 10, padding: "10px 20px", width: "fit-content", height: 24 }}
            onClick={() => setShowDeletePopup(false)}
          >
            Close
          </DefaultButton>
        </Stack>
      </Stack>
    </Modal>
  );

  // return (
  //   <>
  //     {showDeletePopup && (
  //       <Layer>
  //         <Popup className="popupRoot" role="dialog" aria-modal="true" onDismiss={() => setShowDeletePopup(false)}>
  //           <Overlay onClick={() => setShowDeletePopup(false)} />
  //           <FocusTrapZone>
  //             <Stack role="document">
  //               <Text className="deleteCodeHeader">Delete code?</Text>
  //               <Text className="deleteCodeText">
  //                 This will clear the query from the query builder pane along with all comments and also reset the
  //                 prompt pane
  //               </Text>
  //             </Stack>
  //             <Stack className="popUpButtonsBar">
  //               <PrimaryButton className="deletePopUpButton" onClick={deleteCode}>
  //                 Delete
  //               </PrimaryButton>
  //               <DefaultButton className="cancelPopupButton" onClick={() => setShowDeletePopup(false)}>
  //                 Close
  //               </DefaultButton>
  //             </Stack>
  //           </FocusTrapZone>
  //         </Popup>
  //       </Layer>
  //     )}
  //   </>
  // );
};
