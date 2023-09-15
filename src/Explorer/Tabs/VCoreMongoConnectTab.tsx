import { IconButton, ITextFieldStyles, Stack, TextField } from "@fluentui/react";
import React from "react";
import { userContext } from "UserContext";

export const VcoreMongoConnectTab: React.FC = (): JSX.Element => {
  const { adminLogin, connectionString } = userContext.vcoreMongoConnectionParams;
  const displayConnectionString = connectionString.replace("<user>", adminLogin);

  const textfieldStyles: Partial<ITextFieldStyles> = {
    root: { width: "100%" },
    field: { backgroundColor: "rgb(230, 230, 230)" },
    fieldGroup: { borderColor: "rgb(138, 136, 134)" },
    subComponentStyles: { label: { fontWeight: 400 } },
    description: { fontWeight: 400 },
  };

  const onCopyBtnClicked = (selector: string): void => {
    const textfield: HTMLInputElement = document.querySelector(selector);
    textfield.select();
    document.execCommand("copy");
  };

  return (
    <div style={{ width: "100%", padding: 16 }}>
      <Stack horizontal verticalAlign="end" style={{ marginBottom: 8 }}>
        <TextField
          label="MongoDB SRV connection URL"
          id="mongoSrvConnectionURL"
          readOnly
          value={displayConnectionString}
          styles={textfieldStyles}
        />
        <IconButton iconProps={{ iconName: "Copy" }} onClick={() => onCopyBtnClicked("#mongoSrvConnectionURL")} />
      </Stack>
    </div>
  );
};
