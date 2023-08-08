import { Icon, IconButton, Image, Stack, Text, TextField } from "@fluentui/react";
import Explorer from "Explorer/Explorer";
import { WelcomeSidebarPopup } from "Explorer/QueryCopilot/Popup/WelcomeSidebarPopup";
import { useQueryCopilotSidebar } from "hooks/useQueryCopilotSidebar";
import React from "react";
import CopilotIcon from "../../../images/CopilotSidebarLogo.svg";

interface QueryCopilotSidebarProps {
  explorer?: Explorer;
}

export const QueryCopilotSidebar: React.FC<QueryCopilotSidebarProps> = ({}: QueryCopilotSidebarProps): JSX.Element => {
  const {
    setWasCopilotUsed,
    showCopilotSidebar,
    setShowCopilotSidebar,
    userInput,
    setUserInput,
    chatMessages,
    setChatMessages,
    showWelcomeSidebar,
  } = useQueryCopilotSidebar();

  const handleSendMessage = () => {
    if (userInput.trim() !== "") {
      setChatMessages([...chatMessages, userInput]);
      setUserInput("");
    }
  };

  const handleInputChange = (value: string) => {
    setUserInput(value);
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
    <Stack style={{ width: "320px", height: "405px", backgroundColor: "#FAFAFA", overflow: "auto" }}>
      {showWelcomeSidebar ? (
        <Stack.Item styles={{ root: { textAlign: "center", verticalAlign: "middle" } }}>
          <WelcomeSidebarPopup />
        </Stack.Item>
      ) : (
        <>
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

          <Stack horizontalAlign="center" tokens={{ padding: 8, childrenGap: 8 }}>
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
                  <Stack horizontal tokens={{ childrenGap: 8 }}>
                    <Icon iconName="BulletedList" />
                    <Text>Generate queries based upon prompt you suggest</Text>
                  </Stack>
                  <Stack horizontal tokens={{ childrenGap: 8 }}>
                    <Icon iconName="BulletedList" />
                    <Text>Explain and provide alternate queries for a query suggested by you</Text>
                  </Stack>
                  <Stack horizontal tokens={{ childrenGap: 8 }}>
                    <Icon iconName="BulletedList" />
                    <Text>Help answer questions about Cosmos DB</Text>
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
              <TextField
                placeholder="Write your own prompt or ask a question"
                value={userInput}
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
