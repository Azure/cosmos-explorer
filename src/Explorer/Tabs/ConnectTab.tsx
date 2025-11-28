import { IconButton, ITextFieldStyles, Pivot, PivotItem, PrimaryButton, Stack, Text, TextField } from "@fluentui/react";
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
  const primaryConnectionStr = `AccountEndpoint=${uri};AccountKey=${primaryMasterKey};`;
  const secondaryConnectionStr = `AccountEndpoint=${uri};AccountKey=${secondaryMasterKey};`;
  const primaryReadonlyConnectionStr = `AccountEndpoint=${uri};AccountKey=${primaryReadonlyMasterKey};`;
  const secondaryReadonlyConnectionStr = `AccountEndpoint=${uri};AccountKey=${secondaryReadonlyMasterKey};`;
  const maskedValue: string =
    "*********************************************************************************************************************************";
  const [showPrimaryMasterKey, setShowPrimaryMasterKey] = useState<boolean>(false);
  const [showSecondaryMasterKey, setShowSecondaryMasterKey] = useState<boolean>(false);
  const [showPrimaryReadonlyMasterKey, setShowPrimaryReadonlyMasterKey] = useState<boolean>(false);
  const [showSecondaryReadonlyMasterKey, setShowSecondaryReadonlyMasterKey] = useState<boolean>(false);
  const [showPrimaryConnectionStr, setShowPrimaryConnectionStr] = useState<boolean>(false);
  const [showSecondaryConnectionStr, setShowSecondaryConnectionStr] = useState<boolean>(false);
  const [showPrimaryReadonlyConnectionStr, setShowPrimaryReadonlyConnectionStr] = useState<boolean>(false);
  const [showSecondaryReadonlyConnectionStr, setShowSecondaryReadonlyConnectionStr] = useState<boolean>(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async (): Promise<void> => {
    try {
      if (userContext.hasWriteAccess) {
        const listKeysResult: DatabaseAccountListKeysResult = await listKeys(
          userContext.subscriptionId,
          userContext.resourceGroup,
          userContext.databaseAccount.name,
        );
        setPrimaryMasterKey(listKeysResult.primaryMasterKey);
        setSecondaryMasterKey(listKeysResult.secondaryMasterKey);
        setPrimaryReadonlyMasterKey(listKeysResult.primaryReadonlyMasterKey);
        setSecondaryReadonlyMasterKey(listKeysResult.secondaryReadonlyMasterKey);
      } else {
        const listReadonlyKeysResult: DatabaseAccountListReadOnlyKeysResult = await listReadOnlyKeys(
          userContext.subscriptionId,
          userContext.resourceGroup,
          userContext.databaseAccount.name,
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
    field: {
      backgroundColor: "var(--colorNeutralBackground3)",
      color: "var(--colorNeutralForeground1)",
    },
    fieldGroup: { borderColor: "var(--colorNeutralStroke1)" },
    suffix: {
      backgroundColor: "var(--colorNeutralBackground3)",
      margin: 0,
      padding: 0,
    },
    subComponentStyles: {
      label: {
        root: {
          color: "var(--colorNeutralForeground1)",
        },
      },
    },
  };

  const renderCopyButton = (selector: string) => (
    <IconButton
      iconProps={{ iconName: "Copy" }}
      onClick={() => onCopyBtnClicked(selector)}
      styles={{
        root: {
          height: "100%",
          backgroundColor: "var(--colorNeutralBackground3)",
          border: "none",
          color: "var(--colorNeutralForeground1)",
        },
        rootHovered: {
          backgroundColor: "var(--colorNeutralBackground4)",
        },
        rootPressed: {
          backgroundColor: "var(--colorNeutralBackground5)",
        },
        icon: {
          color: "var(--colorNeutralForeground1)",
        },
      }}
    />
  );

  const themeAwareIconButtonStyles = {
    root: {
      color: "var(--colorNeutralForeground1)",
    },
    rootHovered: {
      backgroundColor: "var(--colorNeutralBackground3)",
    },
    icon: {
      color: "var(--colorNeutralForeground1)",
    },
  };

  const pivotStyles = {
    root: {
      color: "var(--colorNeutralForeground1)",
    },
    link: {
      color: "var(--colorNeutralForeground1)",
      backgroundColor: "transparent",
      selectors: {
        "&:hover": {
          color: "var(--colorNeutralForeground1)",
          backgroundColor: "var(--colorNeutralBackground3)",
        },
        "&:active": {
          color: "var(--colorNeutralForeground1)",
        },
      },
    },
    linkIsSelected: {
      color: "var(--colorNeutralForeground1)",
      selectors: {
        "&::before": {
          backgroundColor: "var(--colorBrandBackground)",
        },
      },
    },
    text: {
      color: "var(--colorNeutralForeground1)",
    },
  };

  return (
    <div style={{ width: "100%", padding: 16 }}>
      <Stack horizontal verticalAlign="end" style={{ marginBottom: 16, margin: 10 }}>
        <TextField
          label="URI"
          id="uriTextfield"
          readOnly
          value={uri}
          styles={textfieldStyles}
          onRenderSuffix={() => renderCopyButton("#uriTextfield")}
        />
        <div style={{ width: 32 }}></div>
      </Stack>

      <Pivot styles={pivotStyles}>
        {userContext.hasWriteAccess && (
          <PivotItem headerText="Read-write Keys">
            <Stack style={{ margin: 10, overflow: "auto", maxHeight: "calc(100vh - 300px)" }}>
              <Stack horizontal verticalAlign="end" style={{ marginBottom: 8 }}>
                <TextField
                  label="PRIMARY KEY"
                  id="primaryKeyTextfield"
                  readOnly
                  value={showPrimaryMasterKey ? primaryMasterKey : maskedValue}
                  styles={textfieldStyles}
                  {...(showPrimaryMasterKey && {
                    onRenderSuffix: () => renderCopyButton("#primaryKeyTextfield"),
                  })}
                />
                <IconButton
                  iconProps={{ iconName: showPrimaryMasterKey ? "Hide3" : "View" }}
                  onClick={() => setShowPrimaryMasterKey(!showPrimaryMasterKey)}
                  styles={themeAwareIconButtonStyles}
                />
              </Stack>
              <Stack horizontal verticalAlign="end" style={{ marginBottom: 8 }}>
                <TextField
                  label="SECONDARY KEY"
                  id="secondaryKeyTextfield"
                  readOnly
                  value={showSecondaryMasterKey ? secondaryMasterKey : maskedValue}
                  styles={textfieldStyles}
                  {...(showSecondaryMasterKey && {
                    onRenderSuffix: () => renderCopyButton("#secondaryKeyTextfield"),
                  })}
                />
                <IconButton
                  iconProps={{ iconName: showSecondaryMasterKey ? "Hide3" : "View" }}
                  onClick={() => setShowSecondaryMasterKey(!showSecondaryMasterKey)}
                  styles={themeAwareIconButtonStyles}
                />
              </Stack>
              <Stack horizontal verticalAlign="end" style={{ marginBottom: 8 }}>
                <TextField
                  label="PRIMARY CONNECTION STRING"
                  id="primaryConStrTextfield"
                  readOnly
                  value={showPrimaryConnectionStr ? primaryConnectionStr : maskedValue}
                  styles={textfieldStyles}
                  {...(showPrimaryConnectionStr && {
                    onRenderSuffix: () => renderCopyButton("#primaryConStrTextfield"),
                  })}
                />
                <IconButton
                  iconProps={{ iconName: showPrimaryConnectionStr ? "Hide3" : "View" }}
                  onClick={() => setShowPrimaryConnectionStr(!showPrimaryConnectionStr)}
                  styles={themeAwareIconButtonStyles}
                />
              </Stack>
              <Stack horizontal verticalAlign="end" style={{ marginBottom: 8 }}>
                <TextField
                  label="SECONDARY CONNECTION STRING"
                  id="secondaryConStrTextfield"
                  readOnly
                  value={showSecondaryConnectionStr ? secondaryConnectionStr : maskedValue}
                  styles={textfieldStyles}
                  {...(showSecondaryConnectionStr && {
                    onRenderSuffix: () => renderCopyButton("#secondaryConStrTextfield"),
                  })}
                />
                <IconButton
                  iconProps={{ iconName: showSecondaryConnectionStr ? "Hide3" : "View" }}
                  onClick={() => setShowSecondaryConnectionStr(!showSecondaryConnectionStr)}
                  styles={themeAwareIconButtonStyles}
                />
              </Stack>
            </Stack>
          </PivotItem>
        )}
        <PivotItem headerText="Read-only Keys">
          <Stack style={{ margin: 10, overflow: "auto", maxHeight: "calc(100vh - 300px)" }}>
            <Stack horizontal verticalAlign="end" style={{ marginBottom: 8 }}>
              <TextField
                label="PRIMARY READ-ONLY KEY"
                id="primaryReadonlyKeyTextfield"
                readOnly
                value={showPrimaryReadonlyMasterKey ? primaryReadonlyMasterKey : maskedValue}
                styles={textfieldStyles}
                {...(showPrimaryReadonlyMasterKey && {
                  onRenderSuffix: () => renderCopyButton("#primaryReadonlyKeyTextfield"),
                })}
              />
              <IconButton
                iconProps={{ iconName: showPrimaryReadonlyMasterKey ? "Hide3" : "View" }}
                onClick={() => setShowPrimaryReadonlyMasterKey(!showPrimaryReadonlyMasterKey)}
                styles={themeAwareIconButtonStyles}
              />
            </Stack>
            <Stack horizontal verticalAlign="end" style={{ marginBottom: 8 }}>
              <TextField
                label="SECONDARY READ-ONLY KEY"
                id="secondaryReadonlyKeyTextfield"
                readOnly
                value={showSecondaryReadonlyMasterKey ? secondaryReadonlyMasterKey : maskedValue}
                styles={textfieldStyles}
                {...(showSecondaryReadonlyMasterKey && {
                  onRenderSuffix: () => renderCopyButton("#secondaryReadonlyKeyTextfield"),
                })}
              />
              <IconButton
                iconProps={{ iconName: showSecondaryReadonlyMasterKey ? "Hide3" : "View" }}
                onClick={() => setShowSecondaryReadonlyMasterKey(!showSecondaryReadonlyMasterKey)}
                styles={themeAwareIconButtonStyles}
              />
            </Stack>
            <Stack horizontal verticalAlign="end" style={{ marginBottom: 8 }}>
              <TextField
                label="PRIMARY READ-ONLY CONNECTION STRING"
                id="primaryReadonlyConStrTextfield"
                readOnly
                value={showPrimaryReadonlyConnectionStr ? primaryReadonlyConnectionStr : maskedValue}
                styles={textfieldStyles}
                {...(showPrimaryReadonlyConnectionStr && {
                  onRenderSuffix: () => renderCopyButton("#primaryReadonlyConStrTextfield"),
                })}
              />
              <IconButton
                iconProps={{ iconName: showPrimaryReadonlyConnectionStr ? "Hide3" : "View" }}
                onClick={() => setShowPrimaryReadonlyConnectionStr(!showPrimaryReadonlyConnectionStr)}
                styles={themeAwareIconButtonStyles}
              />
            </Stack>
            <Stack horizontal verticalAlign="end" style={{ marginBottom: 8 }}>
              <TextField
                label="SECONDARY READ-ONLY CONNECTION STRING"
                id="secondaryReadonlyConStrTextfield"
                value={showSecondaryReadonlyConnectionStr ? secondaryReadonlyConnectionStr : maskedValue}
                readOnly
                styles={textfieldStyles}
                {...(showSecondaryReadonlyConnectionStr && {
                  onRenderSuffix: () => renderCopyButton("#secondaryReadonlyConStrTextfield"),
                })}
              />
              <IconButton
                iconProps={{ iconName: showSecondaryReadonlyConnectionStr ? "Hide3" : "View" }}
                onClick={() => setShowSecondaryReadonlyConnectionStr(!showSecondaryReadonlyConnectionStr)}
                styles={themeAwareIconButtonStyles}
              />
            </Stack>
          </Stack>
        </PivotItem>
      </Pivot>

      <Stack style={{ margin: 10 }}>
        <Text
          style={{
            fontWeight: 600,
            marginBottom: 8,
            color: "var(--colorNeutralForeground1)",
          }}
        >
          Download sample app
        </Text>
        <Text
          style={{
            marginBottom: 8,
            color: "var(--colorNeutralForeground2)",
          }}
        >
          Don&apos;t have an app ready? No worries, download one of our sample app with a platform of your choice.
          Connection string is already included in the app.
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
