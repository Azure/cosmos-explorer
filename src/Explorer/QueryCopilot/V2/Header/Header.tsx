import { DefaultButton, IconButton, Image, Modal, PrimaryButton, Stack, Text } from "@fluentui/react";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import React from "react";
import CopilotIcon from "../../../../../images/CopilotSidebarLogo.svg";

export const Header: React.FC = (): JSX.Element => {
  const { setShowCopilotSidebar, chatMessages, setChatMessages, setShowExplanationBubble } = useQueryCopilot();
  const [showDeleteHistoryModal, setShowDeleteHistoryModal] = React.useState(false);

  const getDeleteHistoryModal = () => {
    return (
      <Modal isOpen={showDeleteHistoryModal} styles={{ main: { minHeight: "122px", minWidth: "480px" } }}>
        <Stack style={{ padding: "16px 24px", height: "auto" }}>
          <Text style={{ height: 24, fontSize: "18px" }}>
            <b>Delete chat history?</b>
          </Text>
          <Text style={{ marginTop: 10, marginBottom: 20 }}>
            This action will clear all chat history. Are you sure you want to continue?
          </Text>
          <Stack horizontal tokens={{ childrenGap: 10 }} horizontalAlign="start">
            <PrimaryButton
              style={{ padding: "0px 20px", height: 24 }}
              onClick={() => {
                setChatMessages([]);
                setShowExplanationBubble(false);
                setShowDeleteHistoryModal(false);
              }}
            >
              Continue
            </PrimaryButton>
            <DefaultButton style={{ padding: "0px 20px", height: 24 }} onClick={() => setShowDeleteHistoryModal(false)}>
              Close
            </DefaultButton>
          </Stack>
        </Stack>
      </Modal>
    );
  };

  return (
    <>
      <Stack
        style={{ margin: "15px 0px 0px 0px", padding: "5px", display: "flex", justifyContent: "space-between" }}
        horizontal
        verticalAlign="center"
      >
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
          onClick={() => setShowDeleteHistoryModal(true)}
          iconProps={{ iconName: "History" }}
          title="Delete history"
          ariaLabel="Delete history"
          style={{ color: "#424242", verticalAlign: "middle" }}
          disabled={chatMessages.length === 0}
        />
        <IconButton
          onClick={() => setShowCopilotSidebar(false)}
          iconProps={{ iconName: "Cancel" }}
          title="Exit"
          ariaLabel="Exit"
          style={{ color: "#424242", verticalAlign: "middle" }}
        />
      </Stack>
      {getDeleteHistoryModal()}
    </>
  );
};
