import { IButtonStyles, IconButton, Image, Stack, Text, TextField } from "@fluentui/react";
import { SamplePrompts, SamplePromptsProps } from "Explorer/QueryCopilot/SamplePrompts/SamplePrompts";
import { WelcomeSidebarPopup } from "Explorer/QueryCopilot/Sidebar/WelcomeSidebarPopup";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import React from "react";
import CopilotIcon from "../../../../images/CopilotSidebarLogo.svg";
import HintIcon from "../../../../images/Hint.svg";

const sampleChatMessages: string[] = [
  "Write a query to return last 10 records in the database",
  'Write a query to return all records in this table created in the last thirty days which also have the record owner as "Contoso"',
];

const promptStyles: IButtonStyles = {
  root: { border: "5px", selectors: { ":hover": { outline: "1px dashed #605e5c" } } },
  label: { fontWeight: 400, textAlign: "left", paddingLeft: 8 },
};

export const QueryCopilotSidebar: React.FC = (): JSX.Element => {
  const {
    setWasCopilotUsed,
    showCopilotSidebar,
    setShowCopilotSidebar,
    userPrompt,
    setUserPrompt,
    chatMessages,
    setChatMessages,
    showWelcomeSidebar,
    isSamplePromptsOpen,
    setIsSamplePromptsOpen,
  } = useQueryCopilot();

  const sampleProps: SamplePromptsProps = {
    isSamplePromptsOpen: isSamplePromptsOpen,
    setIsSamplePromptsOpen: setIsSamplePromptsOpen,
    setTextBox: setUserPrompt,
  };

  const handleSendMessage = () => {
    if (userPrompt.trim() !== "") {
      setChatMessages([...chatMessages, userPrompt]);
      setUserPrompt("");
    }
  };

  const handleInputChange = (value: string) => {
    setUserPrompt(value);
  };

  const handleEnterKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  React.useEffect(() => {
    if (showCopilotSidebar) {
      setWasCopilotUsed(true);
    }
  }, []);

  return (
    <Stack style={{ width: "100%", height: "100%", backgroundColor: "#FAFAFA", overflow: "auto" }}>
      <Stack style={{ margin: "15px 0px 0px 0px", padding: "5px" }}>
        <Stack style={{ display: "flex", justifyContent: "space-between" }} horizontal verticalAlign="center">
          <Stack horizontal verticalAlign="center">
            <Image src={CopilotIcon} />
            <Text style={{ marginLeft: "5px", fontWeight: "bold" }}>Copilot</Text>
            <Text
              style={{
                background: "#f0f0f0",
                fontSize: "10px",
                padding: "2px 4px",
                marginLeft: "5px",
                borderRadius: "8px",
              }}
            >
              Preview
            </Text>
          </Stack>
          <IconButton
            onClick={() => setShowCopilotSidebar(false)}
            iconProps={{ iconName: "Cancel" }}
            title="Exit"
            ariaLabel="Exit"
            style={{ color: "#424242", verticalAlign: "middle" }}
          />
        </Stack>
      </Stack>
      {showWelcomeSidebar ? (
        <Stack.Item styles={{ root: { textAlign: "center", verticalAlign: "middle" } }}>
          <WelcomeSidebarPopup />
        </Stack.Item>
      ) : (
        <>
          <Stack horizontalAlign="center" style={{ color: "#707070" }} tokens={{ padding: 8, childrenGap: 8 }}>
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
            })}{" "}
            {new Date().toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "numeric",
              hour12: true,
            })}
          </Stack>
          <Stack style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ flexGrow: 1, overflowY: "auto" }}>
              <Stack
                tokens={{ padding: 16, childrenGap: 12 }}
                style={{
                  backgroundColor: "white",
                  margin: "5px 10px",
                  borderRadius: "8px",
                }}
              >
                <Text variant="medium">
                  Hello, I am Cosmos Db&apos;s copilot assistant. I can help you do the following things:
                </Text>
                <Stack tokens={{ childrenGap: 8 }}>
                  <Stack horizontal style={{ marginLeft: "15px" }} tokens={{ childrenGap: 8 }}>
                    <Text style={{ fontSize: "16px", lineHeight: "16px", verticalAlign: "middle" }}>•</Text>
                    <Text style={{ verticalAlign: "middle" }}>Generate queries based upon prompt you suggest</Text>
                  </Stack>
                  <Stack horizontal style={{ marginLeft: "15px" }} tokens={{ childrenGap: 8 }}>
                    <Text style={{ fontSize: "16px", lineHeight: "16px", verticalAlign: "middle" }}>•</Text>
                    <Text style={{ verticalAlign: "middle" }}>
                      Explain and provide alternate queries for a query suggested by you
                    </Text>
                  </Stack>
                  <Stack horizontal style={{ marginLeft: "15px" }} tokens={{ childrenGap: 8 }}>
                    <Text style={{ fontSize: "16px", lineHeight: "16px", verticalAlign: "middle" }}>•</Text>
                    <Text style={{ verticalAlign: "middle" }}>Help answer questions about Cosmos DB</Text>
                  </Stack>
                </Stack>
                <Text variant="medium">
                  To get started, ask me a question or use one of the sample prompts to generate a query. AI-generated
                  content may be incorrect.
                </Text>
              </Stack>
              {chatMessages.map((message, index) => (
                <Stack
                  key={index}
                  horizontalAlign="center"
                  tokens={{ padding: 8, childrenGap: 8 }}
                  style={{
                    backgroundColor: "#E0E7FF",
                    borderRadius: "8px",
                    margin: "5px 10px",
                    textAlign: "start",
                  }}
                >
                  {message}
                </Stack>
              ))}
            </div>

            {chatMessages.length === 0 && (
              <Stack
                horizontalAlign="end"
                verticalAlign="end"
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "10px",
                  margin: "10px",
                }}
              >
                <Text
                  onClick={() => handleInputChange(sampleChatMessages[0])}
                  style={{
                    cursor: "pointer",
                    border: "1.5px solid #B0BEFF",
                    width: "100%",
                    padding: "2px",
                    borderRadius: "4px",
                    marginBottom: "5px",
                  }}
                >
                  {sampleChatMessages[0]}
                </Text>
                <Text
                  onClick={() => handleInputChange(sampleChatMessages[1])}
                  style={{
                    cursor: "pointer",
                    border: "1.5px solid #B0BEFF",
                    width: "100%",
                    padding: "2px",
                    borderRadius: "4px",
                    marginBottom: "5px",
                  }}
                >
                  {sampleChatMessages[1]}
                </Text>
              </Stack>
            )}

            <Stack
              horizontal
              horizontalAlign="end"
              verticalAlign="end"
              style={{
                display: "flex",
                alignItems: "center",
                borderRadius: "20px",
                background: "white",
                padding: "5px",
                margin: "5px",
              }}
            >
              <Stack>
                <Image src={HintIcon} styles={promptStyles} onClick={() => setIsSamplePromptsOpen(true)} />
                <SamplePrompts sampleProps={sampleProps} />
              </Stack>
              <TextField
                placeholder="Write your own prompt or ask a question"
                value={userPrompt}
                onChange={(_, newValue) => handleInputChange(newValue)}
                onKeyDown={handleEnterKeyPress}
                multiline
                resizable={false}
                styles={{
                  root: {
                    width: "100%",
                    height: "80px",
                    borderRadius: "20px",
                    padding: "8px",
                    border: "none",
                    outline: "none",
                    marginLeft: "10px",
                  },
                  fieldGroup: { border: "none" },
                }}
              />
              <IconButton iconProps={{ iconName: "Send" }} onClick={handleSendMessage} />
            </Stack>
          </Stack>
        </>
      )}
    </Stack>
  );
};
