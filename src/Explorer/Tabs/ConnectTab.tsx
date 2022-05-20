import {
  IconButton,
  ITextFieldStyles,
  Link,
  Pivot,
  PivotItem,
  PrimaryButton,
  Stack,
  Text,
  TextField,
} from "@fluentui/react";
import { handleError } from "Common/ErrorHandlingUtils";
import { sendMessage } from "Common/MessageHandler";
import { MessageTypes } from "Contracts/ExplorerContracts";
import React, { useEffect, useState } from "react";
import { userContext } from "UserContext";
import { listKeys, listReadOnlyKeys } from "Utils/arm/generatedClients/cosmos/databaseAccounts";
import {
  DatabaseAccountListKeysResult,
  DatabaseAccountListReadOnlyKeysResult,
} from "Utils/arm/generatedClients/cosmos/types";

export const ConnectTab: React.FC = (): JSX.Element => {
  const [primaryMasterKey, setPrimaryMasterKey] = useState<string>("");
  const [secondaryMasterKey, setSecondaryMasterKey] = useState<string>("");
  const [primaryReadonlyMasterKey, setPrimaryReadonlyMasterKey] = useState<string>("");
  const [secondaryReadonlyMasterKey, setSecondaryReadonlyMasterKey] = useState<string>("");
  const uri: string = userContext.databaseAccount.properties?.documentEndpoint;
  const primaryConnectionStr = `AccountEndpoint=${uri};AccountKey=${primaryMasterKey}`;
  const secondaryConnectionStr = `AccountEndpoint=${uri};AccountKey=${secondaryMasterKey}`;
  const primaryReadonlyConnectionStr = `AccountEndpoint=${uri};AccountKey=${primaryReadonlyMasterKey}`;
  const secondaryReadonlyConnectionStr = `AccountEndpoint=${uri};AccountKey=${secondaryReadonlyMasterKey}`;

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async (): Promise<void> => {
    try {
      if (userContext.hasWriteAccess) {
        const listKeysResult: DatabaseAccountListKeysResult = await listKeys(
          userContext.subscriptionId,
          userContext.resourceGroup,
          userContext.databaseAccount.name
        );
        setPrimaryMasterKey(listKeysResult.primaryMasterKey);
        setSecondaryMasterKey(listKeysResult.secondaryMasterKey);
        setPrimaryReadonlyMasterKey(listKeysResult.primaryReadonlyMasterKey);
        setSecondaryReadonlyMasterKey(listKeysResult.secondaryReadonlyMasterKey);
      } else {
        const listReadonlyKeysResult: DatabaseAccountListReadOnlyKeysResult = await listReadOnlyKeys(
          userContext.subscriptionId,
          userContext.resourceGroup,
          userContext.databaseAccount.name
        );
        setPrimaryReadonlyMasterKey(listReadonlyKeysResult.primaryReadonlyMasterKey);
        setSecondaryReadonlyMasterKey(listReadonlyKeysResult.secondaryReadonlyMasterKey);
      }
    } catch (error) {
      handleError(error, "listKeys", "listKeys request has failed: ");
      throw error;
    }
  };

  const onCopyBtnClicked = (selector: string): void => {
    const textfield: HTMLInputElement = document.querySelector(selector);
    textfield.select();
    document.execCommand("copy");
  };

  const textfieldStyles: Partial<ITextFieldStyles> = {
    root: { width: "100%" },
    field: { backgroundColor: "rgb(230, 230, 230)" },
    fieldGroup: { borderColor: "rgb(138, 136, 134)" },
  };

  return (
    <div style={{ width: "100%", padding: 16 }}>
      <Stack style={{ marginLeft: 10 }}>
        <Text variant="medium">
          Ensure you have the right networking / access configuration before you establish the connection with your app
          or 3rd party tool.
        </Text>
        <Link style={{ fontSize: 14 }} target="_blank" href="">
          Configure networking in Azure portal
        </Link>
      </Stack>

      <Pivot>
        {userContext.hasWriteAccess && (
          <PivotItem headerText="Read-write Keys">
            <Stack style={{ margin: 10 }}>
              <Stack horizontal verticalAlign="end" style={{ marginBottom: 8 }}>
                <TextField label="URI" id="uriTextfield" readOnly value={uri} styles={textfieldStyles} />
                <IconButton iconProps={{ iconName: "Copy" }} onClick={() => onCopyBtnClicked("#uriTextfield")} />
              </Stack>

              <Stack horizontal verticalAlign="end" style={{ marginBottom: 8 }}>
                <TextField
                  label="PRIMARY KEY"
                  id="primaryKeyTextfield"
                  readOnly
                  value={primaryMasterKey}
                  styles={textfieldStyles}
                />
                <IconButton iconProps={{ iconName: "Copy" }} onClick={() => onCopyBtnClicked("#primaryKeyTextfield")} />
              </Stack>

              <Stack horizontal verticalAlign="end" style={{ marginBottom: 8 }}>
                <TextField
                  label="SECONDARY KEY"
                  id="secondaryKeyTextfield"
                  readOnly
                  value={secondaryMasterKey}
                  styles={textfieldStyles}
                />
                <IconButton
                  iconProps={{ iconName: "Copy" }}
                  onClick={() => onCopyBtnClicked("#secondaryKeyTextfield")}
                />
              </Stack>

              <Stack horizontal verticalAlign="end" style={{ marginBottom: 8 }}>
                <TextField
                  label="PRIMARY CONNECTION STRING"
                  id="primaryConStrTextfield"
                  readOnly
                  value={primaryConnectionStr}
                  styles={textfieldStyles}
                />
                <IconButton
                  iconProps={{ iconName: "Copy" }}
                  onClick={() => onCopyBtnClicked("#primaryConStrTextfield")}
                />
              </Stack>
              <Stack horizontal verticalAlign="end" style={{ marginBottom: 8 }}>
                <TextField
                  label="SECONDARY CONNECTION STRING"
                  id="secondaryConStrTextfield"
                  readOnly
                  value={secondaryConnectionStr}
                  styles={textfieldStyles}
                />
                <IconButton
                  iconProps={{ iconName: "Copy" }}
                  onClick={() => onCopyBtnClicked("#secondaryConStrTextfield")}
                />
              </Stack>
            </Stack>
          </PivotItem>
        )}
        <PivotItem headerText="Read-only Keys">
          <Stack style={{ margin: 10 }}>
            <Stack horizontal verticalAlign="end" style={{ marginBottom: 8 }}>
              <TextField label="URI" id="uriReadOnlyTextfield" readOnly value={uri} styles={textfieldStyles} />
              <IconButton iconProps={{ iconName: "Copy" }} onClick={() => onCopyBtnClicked("#uriReadOnlyTextfield")} />
            </Stack>
            <Stack horizontal verticalAlign="end" style={{ marginBottom: 8 }}>
              <TextField
                label="PRIMARY READ-ONLY KEY"
                id="primaryReadonlyKeyTextfield"
                readOnly
                value={primaryReadonlyMasterKey}
                styles={textfieldStyles}
              />
              <IconButton
                iconProps={{ iconName: "Copy" }}
                onClick={() => onCopyBtnClicked("#primaryReadonlyKeyTextfield")}
              />
            </Stack>
            <Stack horizontal verticalAlign="end" style={{ marginBottom: 8 }}>
              <TextField
                label="SECONDARY READ-ONLY KEY"
                id="secondaryReadonlyKeyTextfield"
                readOnly
                value={secondaryReadonlyMasterKey}
                styles={textfieldStyles}
              />
              <IconButton
                iconProps={{ iconName: "Copy" }}
                onClick={() => onCopyBtnClicked("#secondaryReadonlyKeyTextfield")}
              />
            </Stack>
            <Stack horizontal verticalAlign="end" style={{ marginBottom: 8 }}>
              <TextField
                label="PRIMARY READ-ONLY CONNECTION STRING"
                id="primaryReadonlyConStrTextfield"
                readOnly
                value={primaryReadonlyConnectionStr}
                styles={textfieldStyles}
              />
              <IconButton
                iconProps={{ iconName: "Copy" }}
                onClick={() => onCopyBtnClicked("#primaryReadonlyConStrTextfield")}
              />
            </Stack>
            <Stack horizontal verticalAlign="end" style={{ marginBottom: 8 }}>
              <TextField
                label="SECONDARY READ-ONLY CONNECTION STRING"
                id="secondaryReadonlyConStrTextfield"
                value={secondaryReadonlyConnectionStr}
                readOnly
                styles={textfieldStyles}
              />
              <IconButton
                iconProps={{ iconName: "Copy" }}
                onClick={() => onCopyBtnClicked("#secondaryReadonlyConStrTextfield")}
              />
            </Stack>
          </Stack>
        </PivotItem>
      </Pivot>

      <Stack style={{ margin: 10 }}>
        <Text style={{ fontWeight: 600, marginBottom: 8 }}>Download sample app</Text>
        <Text style={{ marginBottom: 8 }}>
          Don’t have an app ready? No worries, download one of our sample app with a platform of your choice. Connection
          string is already included in the app.
        </Text>
        <PrimaryButton
          style={{ width: 185 }}
          onClick={() =>
            sendMessage({
              type: MessageTypes.OpenQuickstartBlade,
            })
          }
          text="Download sample app"
        />
      </Stack>
    </div>
  );
};
