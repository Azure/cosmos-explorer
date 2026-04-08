import { IconButton, Image, Stack, Text } from "@fluentui/react";
import React, { Dispatch, SetStateAction } from "react";
import Success from "../../../../images/successfulPopup.svg";

export const CopyPopup = ({
  showCopyPopup,
  setShowCopyPopup,
}: {
  showCopyPopup: boolean;
  setShowCopyPopup: Dispatch<SetStateAction<boolean>>;
}): JSX.Element => {
  const closePopup = () => {
    setShowCopyPopup(false);
  };

  return showCopyPopup ? (
    <Stack
      role="status"
      style={{
        position: "fixed",
        width: 345,
        height: 66,
        padding: 10,
        gap: 5,
        top: 75,
        right: 20,
        background: "#FFFFFF",
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.16)",
      }}
    >
      <Stack
        horizontal
        verticalAlign="center"
        style={{ display: "flex", justifyContent: "space-between", padding: "5px, 2px, 0px, 0px" }}
      >
        <Stack horizontal verticalAlign="center" style={{ display: "flex", gap: 10 }}>
          <Image style={{ width: 15, height: 15 }} src={Success} />
          <Text>
            <b>Code copied successfully</b>
          </Text>
        </Stack>
        <IconButton
          styles={{
            root: {
              border: "none",
              backgroundColor: "transparent",
              padding: 0,
              selectors: {
                "&:focus": {
                  outline: "none",
                },
              },
            },
          }}
          iconProps={{ iconName: "Cancel" }}
          onClick={closePopup}
        />
      </Stack>
      <Text style={{ marginTop: -10 }}>The query has been copied to the clipboard</Text>
    </Stack>
  ) : (
    <></>
  );
};
