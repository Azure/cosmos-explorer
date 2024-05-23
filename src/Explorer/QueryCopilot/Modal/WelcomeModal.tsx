import { IconButton, Image, Link, Modal, PrimaryButton, Stack, StackItem, Text } from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import React from "react";
import Flash from "../../../../images/CopilotFlash.svg";
import Thumb from "../../../../images/CopilotThumb.svg";
import CoplilotWelcomeIllustration from "../../../../images/CopliotWelcomeIllustration.svg";
import "./WelcomeModal.css";

export const WelcomeModal = ({ visible }: { visible: boolean }): JSX.Element => {
  const [isModalVisible, { setFalse: hideModal }] = useBoolean(visible);

  React.useEffect(() => {
    if (visible) {
      window.localStorage.setItem("hideWelcomeModal", "true");
    }
  });

  return (
    <>
      <Modal
        isOpen={isModalVisible}
        onDismiss={hideModal}
        isBlocking={false}
        styles={{
          main: {
            maxHeight: 600,
            borderRadius: 10,
            overflow: "hidden",
          },
        }}
      >
        <Stack className="modalContentPadding">
          <Stack horizontal>
            <Stack horizontal grow={4} horizontalAlign="end">
              <Stack.Item>
                <Image src={CoplilotWelcomeIllustration} />
              </Stack.Item>
            </Stack>
            <Stack horizontal grow={1} horizontalAlign="end" verticalAlign="start" className="exitPadding">
              <Stack.Item>
                <IconButton
                  onClick={hideModal}
                  iconProps={{ iconName: "Cancel" }}
                  title="Exit"
                  ariaLabel="Exit"
                  className="exitIcon"
                />
              </Stack.Item>
            </Stack>
          </Stack>
          <Stack horizontalAlign="center">
            <Stack.Item align="center" style={{ textAlign: "center" }}>
              <Text className="title bold" as={"h1"}>
                Welcome to Microsoft Copilot for Azure in Cosmos DB (preview)
              </Text>
            </Stack.Item>
            <Stack.Item align="center" className="text">
              <Stack horizontal>
                <StackItem align="start" className="imageTextPadding">
                  <Image src={Flash} />
                </StackItem>
                <StackItem align="start">
                  <Text className="bold">
                    Let Copilot do the work for you
                    <br />
                  </Text>
                </StackItem>
              </Stack>
              <Text>
                Ask Copilot to generate a query by describing the query in your words.
                <br />
                <Link target="_blank" href="https://aka.ms/MicrosoftCopilotForAzureInCDBHowTo">
                  Learn more
                </Link>
              </Text>
            </Stack.Item>
            <Stack.Item align="center" className="text">
              <Stack horizontal>
                <StackItem align="start" className="imageTextPadding">
                  <Image src={Thumb} />
                </StackItem>
                <StackItem align="start">
                  <Text className="bold">
                    Use your judgement
                    <br />
                  </Text>
                </StackItem>
              </Stack>
              <Text>
                AI-generated content can have mistakes. Make sure it is accurate and appropriate before executing the
                query.
                <br />
                <Link target="_blank" href="https://aka.ms/cdb-copilot-preview-terms">
                  Read our preview terms here
                </Link>
              </Text>
            </Stack.Item>
          </Stack>
          <Stack className="buttonPadding">
            <Stack.Item align="center">
              <PrimaryButton onClick={hideModal} className="tryButton">
                Try Copilot
              </PrimaryButton>
            </Stack.Item>
          </Stack>
        </Stack>
      </Modal>
    </>
  );
};
