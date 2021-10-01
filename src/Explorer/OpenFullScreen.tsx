import { DefaultButton, PrimaryButton, Spinner, Stack, Text, TextField } from "@fluentui/react";
import copyToClipboard from "clipboard-copy";
import * as React from "react";
import { useFullScreenURLs } from "../hooks/useFullScreenURLs";

export const OpenFullScreen: React.FunctionComponent = () => {
  const [isReadUrlCopy, setIsReadUrlCopy] = React.useState<Boolean>(false);
  const [isReadWriteUrlCopy, setIsReadWriteUrlCopy] = React.useState<Boolean>(false);
  const result = useFullScreenURLs();
  if (!result) {
    return <Spinner label="Generating URLs..." ariaLive="assertive" labelPosition="right" />;
  }

  const readWriteUrl = `https://cosmos.azure.com/?key=${result.readWrite}`;
  const readUrl = `https://cosmos.azure.com/?key=${result.read}`;

  return (
    <>
      <Stack tokens={{ childrenGap: 10 }}>
        <Text>
          Open this database account in a new browser tab with Cosmos DB Explorer. Or copy the read-write or read only
          access urls below to share with others. For security purposes, the URLs grant time-bound access to the
          account. When access expires, you can reconnect, using a valid connection string for the account.
        </Text>
        <TextField label="Read and Write" readOnly defaultValue={readWriteUrl} />
        <Stack horizontal tokens={{ childrenGap: 10 }}>
          <DefaultButton
            onClick={() => {
              copyToClipboard(readWriteUrl);
              setIsReadWriteUrlCopy(true);
            }}
            text={isReadWriteUrlCopy ? "Copied" : "Copy"}
            iconProps={{ iconName: "Copy" }}
          />
          <PrimaryButton
            onClick={() => {
              window.open(readWriteUrl, "_blank");
            }}
            text="Open"
            iconProps={{ iconName: "OpenInNewWindow" }}
          />
        </Stack>
        <TextField label="Read Only" readOnly defaultValue={readUrl} />
        <Stack horizontal tokens={{ childrenGap: 10 }}>
          <DefaultButton
            onClick={() => {
              setIsReadUrlCopy(true);
              copyToClipboard(readUrl);
            }}
            text={isReadUrlCopy ? "Copied" : "Copy"}
            iconProps={{ iconName: "Copy" }}
          />
          <PrimaryButton
            onClick={() => {
              window.open(readUrl, "_blank");
            }}
            text="Open"
            iconProps={{ iconName: "OpenInNewWindow" }}
          />
        </Stack>
      </Stack>
    </>
  );
};
